document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('resume');
    const fileDropArea = document.getElementById('fileDropArea');
    const fileMsg = document.querySelector('.file-msg');
    const form = document.getElementById('analysisForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.querySelector('.btn-text');
    const loader = document.querySelector('.loader');
    
    const uploadPanel = document.getElementById('uploadPanel');
    const resultsPanel = document.getElementById('resultsPanel');
    const resetBtn = document.getElementById('resetBtn');

    let gaugeChart = null;

    // File dropping aesthetics
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, () => fileDropArea.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, () => fileDropArea.classList.remove('dragover'), false);
    });

    fileDropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        updateFileDisplay();
    });

    fileInput.addEventListener('change', updateFileDisplay);

    function updateFileDisplay() {
        if (fileInput.files.length > 0) {
            fileMsg.textContent = fileInput.files[0].name;
            fileMsg.style.color = '#fff';
        } else {
            fileMsg.textContent = 'Drag & Drop or Click to Select';
            fileMsg.style.color = 'var(--text-muted)';
        }
    }

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = fileInput.files[0];
        const jd = document.getElementById('jobDescription').value;

        if (!file || !jd) {
            alert('Please provide both a resume and a job description.');
            return;
        }

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('job_description', jd);

        // UI Loading State
        submitBtn.disabled = true;
        btnText.textContent = 'Analyzing...';
        loader.classList.remove('hidden');

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Analysis failed');
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = 'Analyze Match';
            loader.classList.add('hidden');
        }
    });

    resetBtn.addEventListener('click', () => {
        resultsPanel.classList.add('hidden');
        uploadPanel.classList.remove('hidden');
        form.reset();
        updateFileDisplay();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    function displayResults(data) {
        uploadPanel.classList.add('hidden');
        resultsPanel.classList.remove('hidden');

        // Render Gauge
        renderGauge(data.match_score);

        // Render Gaps
        const gapsList = document.getElementById('gapsList');
        gapsList.innerHTML = '';
        if (data.gaps && data.gaps.length > 0) {
            data.gaps.forEach(gap => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${gap.skill} missing</strong> 
                                <span style="color:#ef4444; font-size: 0.9em;">(Relevancy: ${gap.relevancy})</span><br>
                                <p style="margin-top:0.5rem; font-size:0.95em; color:#cbd5e1;">Context: ${gap.context}</p>`;
                gapsList.appendChild(li);
            });
        } else {
            gapsList.innerHTML = '<li>No significant gaps found! You are a strong match.</li>';
        }

        // Render Improvements
        const improvementsList = document.getElementById('improvementsList');
        improvementsList.innerHTML = '';
        if (data.improvements && data.improvements.length > 0) {
            data.improvements.forEach(imp => {
                const li = document.createElement('li');
                li.style.borderLeftColor = 'var(--accent-yellow)';
                li.innerHTML = `<strong>${imp.section} Section</strong>
                                <p>${imp.suggestion}</p>`;
                improvementsList.appendChild(li);
            });
        } else {
            improvementsList.innerHTML = '<li>Your resume is well structured!</li>';
        }

        // Render Learning Path
        const learningPathCards = document.getElementById('learningPathCards');
        learningPathCards.innerHTML = '';
        if (data.learning_path && data.learning_path.length > 0) {
            data.learning_path.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `<h4>${item.skill}</h4>
                                  <p>${item.reason}</p>
                                  ${item.resources ? `<span class="resource">Suggested: ${item.resources}</span>` : ''}`;
                learningPathCards.appendChild(card);
            });
        } else {
            learningPathCards.innerHTML = '<p>No specific extra skills to learn.</p>';
        }
    }

    function renderGauge(score) {
        document.getElementById('scoreValue').textContent = score;
        
        const ctx = document.getElementById('scoreGauge').getContext('2d');
        
        let color = '#ef4444'; // red
        if (score >= 40) color = '#eab308'; // yellow
        if (score >= 70) color = '#22c55e'; // green

        if (gaugeChart) {
            gaugeChart.destroy();
        }

        gaugeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [score, 100 - score],
                    backgroundColor: [color, 'rgba(255, 255, 255, 0.1)'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270,
                }]
            },
            options: {
                cutout: '80%',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    tooltip: { enabled: false },
                    legend: { display: false }
                },
                animation: {
                    animateRotate: true,
                    animateScale: false
                }
            }
        });
    }
});
