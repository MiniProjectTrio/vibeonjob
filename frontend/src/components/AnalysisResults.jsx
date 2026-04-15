import { useState } from 'react';

/* ── Animated Circular Gauge ──────────────────────────────────────────────── */
function ScoreGauge({ score, label, color = '#2563eb' }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" className="drop-shadow-sm">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        <text x="70" y="66" textAnchor="middle" className="text-2xl font-extrabold" fill="#1e293b" style={{ fontSize: '28px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {Math.round(score)}%
        </text>
        <text x="70" y="86" textAnchor="middle" fill="#94a3b8" style={{ fontSize: '11px', fontWeight: 600 }}>
          {label}
        </text>
      </svg>
    </div>
  );
}

/* ── Skill Chip ───────────────────────────────────────────────────────────── */
function SkillChip({ text, variant = 'matched' }) {
  const styles = {
    matched: 'bg-green-50 text-green-700 border-green-200',
    missing: 'bg-red-50 text-red-600 border-red-200',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${styles[variant]}`}>
      {text}
    </span>
  );
}

/* ── Tab Button ───────────────────────────────────────────────────────────── */
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-blue-50 text-blue-600 shadow-sm'
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
        {icon}
      </span>
      {label}
    </button>
  );
}

/* ── Priority Badge ───────────────────────────────────────────────────────── */
function PriorityBadge({ rank }) {
  const colors = rank === 1 ? 'bg-red-100 text-red-700' : rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';
  return (
    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${colors}`}>
      #{rank}
    </span>
  );
}

/* ── Difficulty Badge ─────────────────────────────────────────────────────── */
function DifficultyBadge({ level }) {
  const colors = {
    Beginner: 'bg-green-50 text-green-700',
    Intermediate: 'bg-amber-50 text-amber-700',
    Advanced: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${colors[level] || colors.Intermediate}`}>
      {level}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function AnalysisResults({ result, onNewAnalysis }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', icon: 'dashboard', label: 'Overview' },
    { id: 'gaps', icon: 'warning', label: `Gaps (${result.gaps?.length || 0})` },
    { id: 'improvements', icon: 'edit_note', label: 'Improvements' },
    { id: 'learning', icon: 'school', label: 'Learning Path' },
    { id: 'keywords', icon: 'key', label: 'ATS Keywords' },
    { id: 'resources', icon: 'link', label: 'Resources' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Score Header ─────────────────────────────────────────────────── */}
      <div className="bento-card rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            </div>
            <h2 className="editorial-headline text-xl font-bold text-slate-900">Analysis Results</h2>
          </div>
          <button
            onClick={onNewAnalysis}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Analysis
          </button>
        </div>

        {/* Gauges */}
        <div className="flex justify-center gap-12 flex-wrap">
          <ScoreGauge score={result.match_score || 0} label="Semantic Match" color="#2563eb" />
          <ScoreGauge score={result.ats_score || 0} label="ATS Score" color="#7c3aed" />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-green-50/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-green-600">{result.matched_skills?.length || 0}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Matched Skills</p>
          </div>
          <div className="bg-red-50/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-red-500">{result.missing_skills?.length || 0}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Missing Skills</p>
          </div>
          <div className="bg-amber-50/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-amber-600">{result.gaps?.length || 0}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Skill Gaps</p>
          </div>
          <div className="bg-violet-50/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-violet-600">{result.learning_path?.length || 0}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Skills to Learn</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="bento-card rounded-xl overflow-hidden">
        <div className="flex gap-1 p-3 bg-slate-50/50 border-b border-slate-100 overflow-x-auto">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>

        <div className="p-6 md:p-8">
          {/* ── Overview Tab ─────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Matched Skills */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Matched Skills ({result.matched_skills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.matched_skills?.map((m, i) => (
                    <div key={i} className="group relative">
                      <SkillChip text={m.jd_skill} variant="matched" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        ↔ {m.resume_skill} ({m.similarity_pct || Math.round(m.similarity * 100)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                  Missing Skills ({result.missing_skills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.missing_skills?.map((skill, i) => (
                    <SkillChip key={i} text={skill} variant="missing" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Gaps Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'gaps' && (
            <div className="space-y-4">
              {result.gaps?.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No skill gaps detected — great match!</p>
              )}
              {result.gaps?.map((gap, i) => (
                <div key={i} className="bg-slate-50/50 rounded-2xl p-5 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <PriorityBadge rank={gap.priority_rank || i + 1} />
                      <h4 className="font-bold text-slate-900 text-sm">{gap.skill}</h4>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>JD: <strong className="text-blue-600">{gap.jd_frequency}×</strong></span>
                      <span>Resume: <strong className="text-slate-700">{gap.resume_frequency}×</strong></span>
                      <span>Add: <strong className="text-amber-600">+{gap.recommended_additions}×</strong></span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-1"><strong className="text-slate-700">Why it matters:</strong> {gap.relevancy}</p>
                  <p className="text-sm text-slate-500"><strong className="text-slate-600">Context:</strong> {gap.context}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Improvements Tab ─────────────────────────────────────────── */}
          {activeTab === 'improvements' && (
            <div className="space-y-4">
              {result.improvements?.map((imp, i) => (
                <div key={i} className="bg-slate-50/50 rounded-2xl p-5 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                      {imp.section}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium mb-3">{imp.suggestion}</p>
                  {imp.before_example && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-red-50/50 rounded-xl p-3 border border-red-100">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Before</p>
                        <p className="text-xs text-red-700">{imp.before_example}</p>
                      </div>
                      <div className="bg-green-50/50 rounded-xl p-3 border border-green-100">
                        <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">After</p>
                        <p className="text-xs text-green-700">{imp.after_example}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Learning Path Tab ────────────────────────────────────────── */}
          {activeTab === 'learning' && (
            <div className="space-y-4">
              {result.learning_path?.map((item, i) => (
                <div key={i} className="bg-slate-50/50 rounded-2xl p-5 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-slate-900 text-sm">{item.skill}</h4>
                    <div className="flex items-center gap-2">
                      <DifficultyBadge level={item.difficulty} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        item.priority === 'High' ? 'bg-red-50 text-red-600' :
                        item.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{item.reason}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      ~{item.estimated_time_weeks} weeks
                    </span>
                    {item.resources && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">menu_book</span>
                        {item.resources}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ATS Keywords Tab ─────────────────────────────────────────── */}
          {activeTab === 'keywords' && (
            <div>
              {result.keyword_suggestions?.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No keyword gaps found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Keyword</th>
                        <th className="text-center py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">JD Freq</th>
                        <th className="text-center py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Resume Freq</th>
                        <th className="text-center py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Gap</th>
                        <th className="text-center py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Coverage</th>
                        <th className="text-left py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">JD Phrase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.keyword_suggestions?.map((ks, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-800">{ks.keyword}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-50 text-blue-700 rounded-lg font-bold text-xs">{ks.jd_frequency}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${
                              ks.resume_frequency === 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                            }`}>{ks.resume_frequency}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-50 text-amber-700 rounded-lg font-bold text-xs">{ks.gap}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${ks.coverage_pct >= 75 ? 'bg-green-500' : ks.coverage_pct >= 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(ks.coverage_pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-slate-500">{ks.coverage_pct}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-xs italic max-w-[200px] truncate">{ks.exact_phrase}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Resources Tab ────────────────────────────────────────────── */}
          {activeTab === 'resources' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.recommended_resources?.map((res, i) => (
                <a
                  key={i}
                  href={res.url}
                  className="bg-slate-50/50 rounded-2xl p-5 hover:bg-white border border-transparent hover:border-blue-100 transition-all group block"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      res.resource_type === 'Video' ? 'bg-red-50 text-red-600' :
                      res.resource_type === 'Course' ? 'bg-blue-50 text-blue-600' :
                      res.resource_type === 'Documentation' ? 'bg-green-50 text-green-600' :
                      'bg-violet-50 text-violet-600'
                    }`}>
                      {res.resource_type}
                    </span>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-500 text-[16px] transition-colors">open_in_new</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{res.title}</h4>
                  <p className="text-xs text-slate-500 mb-2">{res.description}</p>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-slate-400">target</span>
                    <span className="text-xs font-semibold text-slate-400">{res.skill}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
