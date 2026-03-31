/**
 * VibeOnJob — Frontend Controller
 *
 * Manages the 6-step processing UI, form submission, tab navigation,
 * and all result rendering (gauges, tables, cards, copy-to-clipboard).
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── Element References ──────────────────────────────────────────────────
    const fileInput       = document.getElementById('resume');
    const fileDropArea    = document.getElementById('fileDropArea');
    const fileDropText    = document.getElementById('fileDropText');
    const form            = document.getElementById('analysisForm');
    const submitBtn       = document.getElementById('submitBtn');
    const btnText         = submitBtn.querySelector('.btn-text');

    const uploadSection   = document.getElementById('uploadSection');
    const resultsSection  = document.getElementById('resultsSection');
    const processingOverlay = document.getElementById('processingOverlay');
    const processingLabel = document.getElementById('processingLabel');
    const resetBtn        = document.getElementById('resetBtn');
    const toast           = document.getElementById('toast');

    // Processing steps
    const steps = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3'),
        document.getElementById('step4'),
        document.getElementById('step5'),
        document.getElementById('step6'),
    ];

    const stepLabels = [
        'Parsing document…',
        'Extracting skills via spaCy NER…',
        'Analysing ATS keyword frequencies…',
        'Building 384-dim semantic embeddings…',
        'Running Hungarian algorithm matching…',
        'Gemini career analysis in progress…',
    ];

    // Chart instances (kept for destroy-on-reset)
    let semanticChart = null;
    let atsChart = null;

    // ── Drag & Drop ─────────────────────────────────────────────────────────
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
        fileDropArea.addEventListener(ev, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(ev => {
        fileDropArea.addEventListener(ev, () => fileDropArea.classList.add('dragover'));
    });

    ['dragleave', 'drop'].forEach(ev => {
        fileDropArea.addEventListener(ev, () => fileDropArea.classList.remove('dragover'));
    });

    fileDropArea.addEventListener('drop', e => {
        fileInput.files = e.dataTransfer.files;
        updateFileDisplay();
    });

    fileInput.addEventListener('change', updateFileDisplay);

    function updateFileDisplay() {
        if (fileInput.files.length > 0) {
            const name = fileInput.files[0].name;
            fileDropText.textContent = `✓  ${name}`;
            fileDropText.style.color = 'var(--accent-green)';
            fileDropArea.classList.add('has-file');
        } else {
            fileDropText.textContent = 'Drag & drop or click to upload';
            fileDropText.style.color = '';
            fileDropArea.classList.remove('has-file');
        }
    }

    // ── Processing Steps Animation ──────────────────────────────────────────
    let stepInterval = null;
    let currentStep  = 0;

    function startProcessingSteps() {
        currentStep = 0;
        steps.forEach(s => {
            s.classList.remove('active', 'done');
        });
        activateStep(0);

        // Advance every 3 seconds (approximate layer durations)
        const delays = [1200, 2000, 1500, 3000, 1000, 0]; // ms per step
        let elapsed = 0;
        delays.forEach((delay, i) => {
            elapsed += delay;
            setTimeout(() => {
                if (i < steps.length - 1) activateStep(i + 1);
            }, elapsed);
        });
    }

    function activateStep(idx) {
        for (let i = 0; i < idx; i++) {
            steps[i].classList.remove('active');
            steps[i].classList.add('done');
        }
        if (idx < steps.length) {
            steps[idx].classList.add('active');
            processingLabel.textContent = stepLabels[idx];
        }
    }

    function stopProcessingSteps() {
        clearInterval(stepInterval);
        steps.forEach(s => {
            s.classList.remove('active');
            s.classList.add('done');
        });
        processingLabel.textContent = 'Analysis complete!';
    }

    // ── Form Submission ─────────────────────────────────────────────────────
    form.addEventListener('submit', async e => {
        e.preventDefault();

        const file = fileInput.files[0];
        const jd   = document.getElementById('jobDescription').value.trim();

        if (!file) { showToast('Please upload a resume file.', 'error'); return; }
        if (!jd)   { showToast('Please paste the job description.', 'error'); return; }

        // Show overlay and start step animation
        processingOverlay.classList.remove('hidden');
        submitBtn.disabled = true;
        btnText.textContent = 'Analyzing…';
        startProcessingSteps();

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('job_description', jd);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            stopProcessingSteps();

            if (!response.ok) {
                const err = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(err.detail || `HTTP ${response.status}`);
            }

            const data = await response.json();
            await sleep(400); // brief pause so the "complete" state is visible

            processingOverlay.classList.add('hidden');
            showResults(data);

        } catch (error) {
            processingOverlay.classList.add('hidden');
            console.error('[VibeOnJob] Analysis error:', error);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = 'Analyze Resume';
        }
    });

    // ── Reset ───────────────────────────────────────────────────────────────
    resetBtn.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        form.reset();
        updateFileDisplay();
        if (semanticChart) { semanticChart.destroy(); semanticChart = null; }
        if (atsChart)      { atsChart.destroy();      atsChart = null;      }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Reset tabs to Overview
        switchTab('overview');
    });

    // ── Tab Switching ───────────────────────────────────────────────────────
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    function switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tabId);
        });
        document.querySelectorAll('.tab-panel').forEach(p => {
            p.classList.toggle('hidden', p.id !== `panel-${tabId}`);
        });
    }

    // ── Show Results ────────────────────────────────────────────────────────
    function showResults(data) {
        uploadSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        switchTab('overview');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Update subtitle
        document.getElementById('resultsSubtitle').textContent =
            `${fileInput.files[0]?.name ?? 'Resume'} analysed`;

        // Render all sections
        renderDualScores(data.match_score, data.ats_score);
        renderStatsRow(data);
        renderGapTable(data.gaps || []);
        renderMatchedSkills(data.matched_skills || []);
        renderMissingSkills(data.missing_skills || []);
        renderKeywords(data.keyword_suggestions || []);
        renderLearningPath(data.learning_path || []);
        renderImprovements(data.improvements || []);
    }

    // ── Dual Gauge Charts ───────────────────────────────────────────────────
    function getScoreColor(score) {
        if (score >= 75) return '#34d399'; // green
        if (score >= 55) return '#fbbf24'; // yellow
        if (score >= 35) return '#fb923c'; // orange
        return '#f87171';                  // red
    }

    function getScoreClass(score) {
        if (score >= 75) return 'score-green';
        if (score >= 55) return 'score-yellow';
        if (score >= 35) return 'score-orange';
        return 'score-red';
    }

    function getScoreLabel(score, type) {
        if (type === 'semantic') {
            if (score >= 75) return 'Strong semantic alignment with this role';
            if (score >= 55) return 'Moderate match — targeted improvements needed';
            if (score >= 35) return 'Weak alignment — significant gaps present';
            return 'Low match — major reskilling required';
        } else {
            if (score >= 75) return 'Excellent ATS keyword coverage';
            if (score >= 55) return 'Moderate ATS coverage — add missing keywords';
            if (score >= 35) return 'Thin keyword density — ATS may filter you out';
            return 'Critical keyword gaps — resume may not pass ATS';
        }
    }

    function renderGauge(canvasId, score, chartRef) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const color = getScoreColor(score);

        if (chartRef) chartRef.destroy();

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [score, 100 - score],
                    backgroundColor: [color, 'rgba(255,255,255,0.05)'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270,
                }]
            },
            options: {
                cutout: '78%',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    tooltip: { enabled: false },
                    legend: { display: false },
                },
                animation: { animateRotate: true, duration: 900, easing: 'easeOutQuart' },
            },
        });
    }

    function animateCounter(el, target, duration = 900) {
        const start = performance.now();
        const update = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            // Ease out
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target);
            if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }

    function renderDualScores(semanticScore, atsScore) {
        const semEl  = document.getElementById('semanticScoreValue');
        const atsEl  = document.getElementById('atsScoreValue');
        const semDesc = document.getElementById('semanticScoreDesc');
        const atsDesc = document.getElementById('atsScoreDesc');

        semanticChart = renderGauge('semanticGauge', semanticScore, semanticChart);
        atsChart      = renderGauge('atsGauge', atsScore, atsChart);

        semEl.className = `score-value ${getScoreClass(semanticScore)}`;
        atsEl.className = `score-value ${getScoreClass(atsScore)}`;

        animateCounter(semEl, semanticScore);
        animateCounter(atsEl, atsScore);

        semDesc.textContent = getScoreLabel(semanticScore, 'semantic');
        atsDesc.textContent = getScoreLabel(atsScore, 'ats');
    }

    // ── Stats Row ───────────────────────────────────────────────────────────
    function renderStatsRow(data) {
        const container = document.getElementById('statsRow');
        const stats = [
            { number: data.matched_skills?.length ?? 0, label: 'Skills Matched', color: 'var(--accent-green)' },
            { number: data.missing_skills?.length ?? 0, label: 'Skills Missing', color: 'var(--accent-red)' },
            { number: data.keyword_suggestions?.length ?? 0, label: 'Keyword Gaps', color: 'var(--accent-yellow)' },
            { number: data.learning_path?.length ?? 0, label: 'Skills to Learn', color: 'var(--accent-violet)' },
        ];

        container.innerHTML = stats.map(s => `
            <div class="stat-card">
                <div class="stat-number" style="color: ${s.color}">${s.number}</div>
                <div class="stat-label">${s.label}</div>
            </div>
        `).join('');
    }

    // ── Gap Table (Overview tab) ─────────────────────────────────────────────
    function renderGapTable(gaps) {
        const wrap = document.getElementById('gapTableWrap');

        if (!gaps.length) {
            wrap.innerHTML = '<div class="empty-state">🎉 No significant skill gaps detected!</div>';
            return;
        }

        const rows = gaps.map((gap, i) => {
            const rankClass = i < 3 ? `rank-${i + 1}` : '';
            const priorityClass = (gap.priority_rank <= Math.ceil(gaps.length / 3))
                ? 'priority-high'
                : (gap.priority_rank <= Math.ceil(gaps.length * 2 / 3))
                    ? 'priority-medium'
                    : 'priority-low';

            const jdFreq = gap.jd_frequency ?? 0;
            const resumeFreq = gap.resume_frequency ?? 0;
            const addCount = gap.recommended_additions ?? 2;
            const maxFreq = Math.max(jdFreq, 1);

            const barFillColor = jdFreq === 0
                ? 'var(--text-muted)'
                : resumeFreq === 0
                    ? 'var(--accent-red)'
                    : 'var(--accent-yellow)';

            return `
                <tr>
                    <td><span class="rank-badge ${rankClass}">${gap.priority_rank ?? i + 1}</span></td>
                    <td>
                        <div class="skill-name">${escHtml(gap.skill)}</div>
                        <div style="font-size:0.78rem; color:var(--text-muted); margin-top:3px">
                            ${escHtml(gap.relevancy ?? '')}
                        </div>
                    </td>
                    <td class="freq-cell freq-jd">${jdFreq}×</td>
                    <td class="freq-cell freq-resume">${resumeFreq}×</td>
                    <td class="freq-cell freq-gap">${Math.max(0, jdFreq - resumeFreq)}</td>
                    <td>
                        <div class="freq-bar-wrap">
                            <div class="freq-bar-bg">
                                <div class="freq-bar-fill"
                                     style="width:${Math.min(resumeFreq / maxFreq * 100, 100)}%;
                                            background:${barFillColor}">
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="add-count">Add ${addCount}×</td>
                </tr>
            `;
        }).join('');

        wrap.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Missing Skill</th>
                        <th>JD Freq</th>
                        <th>Resume Freq</th>
                        <th>Gap</th>
                        <th>Coverage</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    // ── Matched Skills Table ────────────────────────────────────────────────
    function renderMatchedSkills(matched) {
        const container = document.getElementById('matchedSkillsTable');
        document.getElementById('matchedCount').textContent = `${matched.length} matches`;

        if (!matched.length) {
            container.innerHTML = '<div class="empty-state">No skill matches found.</div>';
            return;
        }

        const rows = matched.map(m => {
            const pct = m.similarity_pct ?? (m.similarity * 100).toFixed(1);
            let barColor = 'var(--accent-red)';
            if (m.similarity >= 0.5) barColor = 'var(--accent-yellow)';
            if (m.similarity >= 0.7) barColor = 'var(--accent-green)';

            return `
                <tr>
                    <td class="skill-name">${escHtml(m.jd_skill)}</td>
                    <td>${escHtml(m.resume_skill)}</td>
                    <td>
                        <div class="sim-bar-wrap">
                            <div class="sim-bar-bg">
                                <div class="sim-bar-fill"
                                     style="width:${pct}%; background:${barColor}"></div>
                            </div>
                            <span class="sim-value">${pct}%</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>JD Requirement</th>
                        <th>Your Skill</th>
                        <th>Similarity</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    // ── Missing Skills Chips ────────────────────────────────────────────────
    function renderMissingSkills(missing) {
        const container = document.getElementById('missingSkillsChips');
        document.getElementById('missingCount').textContent = `${missing.length} missing`;

        if (!missing.length) {
            container.innerHTML = `
                <div class="empty-state">🎉 No missing skills — excellent match!</div>
            `;
            return;
        }

        container.innerHTML = missing.map(skill => `
            <span class="skill-chip">${escHtml(skill)}</span>
        `).join('');
    }

    // ── Keywords (ATS Injection Guide) ──────────────────────────────────────
    function renderKeywords(suggestions) {
        const badge = document.getElementById('keywordBadge');
        badge.textContent = suggestions.length;
        badge.style.display = suggestions.length > 0 ? 'inline-flex' : 'none';

        const wrap = document.getElementById('keywordTableWrap');

        if (!suggestions.length) {
            wrap.innerHTML = `
                <div class="empty-state">
                    No keyword gaps detected — your resume covers the JD vocabulary well!
                </div>
            `;
            return;
        }

        const rows = suggestions.map((ks, i) => {
            const covered = ks.coverage_pct ?? 0;
            const coverClass = covered >= 80 ? 'good' : covered >= 40 ? 'partial' : '';
            const barWidth   = Math.min(covered, 100);

            return `
                <tr>
                    <td style="color:var(--text-muted); font-size:0.8rem; text-align:center">${i + 1}</td>
                    <td class="skill-name">${escHtml(ks.keyword)}</td>
                    <td>
                        <button class="copy-btn" id="copyBtn-${i}"
                                onclick="copyKeyword(${i}, ${JSON.stringify(ks.exact_phrase)})">
                            Copy phrase
                        </button>
                        <div style="font-size:0.74rem; color:var(--text-muted); margin-top:5px; max-width:280px">
                            "${escHtml(ks.exact_phrase)}"
                        </div>
                    </td>
                    <td class="freq-cell freq-jd">${ks.jd_frequency}×</td>
                    <td class="freq-cell freq-resume">${ks.resume_frequency}×</td>
                    <td class="freq-cell freq-gap" style="font-size:1rem">${ks.gap}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px">
                            <div class="coverage-bar-bg">
                                <div class="coverage-bar-fill ${coverClass}"
                                     style="width:${barWidth}%"></div>
                            </div>
                            <span style="font-size:0.78rem; color:var(--text-muted)">${covered}%</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        wrap.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Keyword</th>
                        <th>Exact Phrase from JD</th>
                        <th>JD Freq</th>
                        <th>Resume Freq</th>
                        <th>Gap ↓</th>
                        <th>Coverage</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    // ── Learning Path ────────────────────────────────────────────────────────
    function renderLearningPath(path) {
        const grid = document.getElementById('learningGrid');

        if (!path.length) {
            grid.innerHTML = '<div class="empty-state">No additional learning required — great profile match!</div>';
            return;
        }

        grid.innerHTML = path.map(item => {
            const priority   = (item.priority ?? 'Medium').toLowerCase();
            const difficulty = (item.difficulty ?? 'Intermediate').toLowerCase();
            const weeks      = item.estimated_time_weeks ?? '?';

            return `
                <div class="learn-card">
                    <div class="learn-priority-bar ${priority}"></div>
                    <div class="learn-content">
                        <div class="learn-skill">${escHtml(item.skill)}</div>
                        <div class="learn-reason">${escHtml(item.reason ?? '')}</div>
                        ${item.resources ? `
                            <span class="learn-resource">
                                📚 ${escHtml(item.resources)}
                            </span>
                        ` : ''}
                    </div>
                    <div class="learn-meta">
                        <span class="difficulty-badge ${difficulty}">
                            ${item.difficulty ?? 'Intermediate'}
                        </span>
                        <span class="weeks-badge">~${weeks} weeks</span>
                        <span class="weeks-badge" style="color:var(--accent-${priority === 'high' ? 'red' : priority === 'medium' ? 'yellow' : 'green'})">
                            ${item.priority ?? 'Medium'} priority
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ── Resume Improvements ─────────────────────────────────────────────────
    function renderImprovements(improvements) {
        const list = document.getElementById('improvementsList');

        if (!improvements.length) {
            list.innerHTML = '<div class="empty-state">Your resume structure looks solid for this role!</div>';
            return;
        }

        list.innerHTML = improvements.map(imp => {
            const hasExample = imp.before_example || imp.after_example;
            return `
                <div class="improve-card">
                    <span class="improve-section">${escHtml(imp.section ?? 'General')}</span>
                    <p class="improve-suggestion">${escHtml(imp.suggestion ?? '')}</p>
                    ${hasExample ? `
                        <div class="improve-example-row">
                            ${imp.before_example ? `
                                <div class="example-block before">
                                    <div class="example-label">Before — Weak</div>
                                    ${escHtml(imp.before_example)}
                                </div>
                            ` : ''}
                            ${imp.after_example ? `
                                <div class="example-block after">
                                    <div class="example-label">After — Strong</div>
                                    ${escHtml(imp.after_example)}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    // ── Toast Notification ──────────────────────────────────────────────────
    function showToast(msg, type = 'success') {
        toast.textContent = msg;
        toast.classList.remove('hidden');
        if (type === 'error') {
            toast.style.background = 'rgba(248,113,113,0.95)';
            toast.style.color = '#1a0505';
            toast.style.boxShadow = '0 8px 24px rgba(248,113,113,0.3)';
        } else {
            toast.style.background = 'rgba(52,211,153,0.95)';
            toast.style.color = '#0a1a0f';
            toast.style.boxShadow = '0 8px 24px rgba(52,211,153,0.3)';
        }
        setTimeout(() => toast.classList.add('hidden'), 3200);
    }

    // ── Utility ──────────────────────────────────────────────────────────────
    function escHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Expose copyKeyword globally for inline onclick handlers
    window.copyKeyword = function(idx, phrase) {
        navigator.clipboard.writeText(phrase).then(() => {
            const btn = document.getElementById(`copyBtn-${idx}`);
            if (btn) {
                btn.classList.add('copied');
                btn.textContent = '✓ Copied!';
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.textContent = 'Copy phrase';
                }, 2200);
            }
            showToast(`Copied: "${phrase.length > 40 ? phrase.slice(0, 40) + '…' : phrase}"`);
        }).catch(() => {
            showToast('Copy failed — please copy manually.', 'error');
        });
    };
});
