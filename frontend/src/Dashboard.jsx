import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from './context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import AnalyzePanel from './components/AnalyzePanel'
import AnalysisResults from './components/AnalysisResults'
import AnalysisHistory from './components/AnalysisHistory'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const avatarRef = useRef(null)

  // Upload & Analysis State
  const [resumeFile, setResumeFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // Resume generation state
  const [generatingResume, setGeneratingResume] = useState(false)
  const [generatedResume, setGeneratedResume] = useState(null)

  // Dashboard stats (non-blocking)
  const [stats, setStats] = useState(null)

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setShowAvatarMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch dashboard stats (non-blocking — errors don't prevent usage)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!token) return;
        const response = await fetch(`${API_URL}/api/dashboard-data`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          setStats(await response.json())
        }
      } catch (err) {
        console.warn('Dashboard stats unavailable:', err.message)
      }
    }
    fetchStats()
  }, [token])

  const handleSignOut = () => {
    logout();
    navigate('/');
  }

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    // Refresh dashboard data to update analysis count
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await fetch(`${apiUrl}/api/dashboard-data`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) setData(await response.json())
      } catch (_) {}
    }
    fetchData()
  }

  const handleViewHistoricAnalysis = (analysisData) => {
    setAnalysisResult(analysisData);
  }

  const handleNewAnalysis = () => {
    setAnalysisResult(null);
  }
  // File handling
  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.pdf') || file.name.endsWith('.docx'))) {
      setResumeFile(file);
      setAnalysisError(null);
    } else {
      setAnalysisError('Please upload a PDF or DOCX file.');
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setAnalysisError(null);
    }
  };

  // Run Analysis
  const handleAnalyze = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      setAnalysisError('Please upload a resume and paste a job description.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setGeneratedResume(null);

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('job_description', jobDescription);

      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate ATS-friendly resume
  const handleGenerateResume = async () => {
    if (!analysisResult) return;
    setGeneratingResume(true);

    try {
      const response = await fetch(`${API_URL}/api/generate-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_description: jobDescription,
          missing_skills: analysisResult.missing_skills,
          improvements: analysisResult.improvements,
          gaps: analysisResult.gaps,
          matched_skills: analysisResult.matched_skills,
          ats_score: analysisResult.ats_score,
        }),
      });

      if (!response.ok) {
        throw new Error('Resume generation failed');
      }

      const data = await response.json();
      setGeneratedResume(data.resume_text);
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setGeneratingResume(false);
    }
  };

  const handleCopyResume = () => {
    if (generatedResume) {
      navigator.clipboard.writeText(generatedResume);
    }
  };

  const handleDownloadResume = () => {
    if (generatedResume) {
      const blob = new Blob([generatedResume], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ATS_Optimized_Resume.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const resetAnalysis = () => {
    setResumeFile(null);
    setJobDescription('');
    setAnalysisResult(null);
    setAnalysisError(null);
    setGeneratedResume(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Score color utility
  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };
  return (
    <div className="selection:bg-blue-100 selection:text-blue-900 bg-[#f8fafc] font-body min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="flex justify-between items-center h-16 px-6 lg:px-8 w-full mx-auto max-w-screen-2xl">
          <div className="flex items-center gap-8 lg:gap-12">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <span className="text-xl font-bold tracking-tighter text-slate-900 font-headline">VibeOnJob</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/dashboard" className="nav-link-active text-blue-600 font-headline font-semibold text-[15px]">Dashboard</Link>
              <Link to="/about" className="text-slate-500 hover:text-slate-900 font-headline font-medium text-[15px] transition-colors">About</Link>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="h-8 w-px bg-slate-200 mx-1"></div>
              <div className="relative" ref={avatarRef}>
                <button
                  onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                  className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold text-sm shadow-md hover:scale-105 transition-transform ring-2 ring-white cursor-pointer"
                >
                   {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
                </button>
                {showAvatarMenu && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.first_name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <Link to="/about" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setShowAvatarMenu(false)}>
                      <span className="material-symbols-outlined text-[18px]">info</span>
                      About Us
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign Out
                    </button>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="nav-link-active text-blue-600 font-headline font-semibold text-[14px]">Dashboard</Link>
              <Link to="/about" className="text-slate-500 hover:text-slate-900 font-headline font-medium text-[14px] transition-colors">About</Link>
              <Link to="/features" className="text-slate-500 hover:text-slate-900 font-headline font-medium text-[14px] transition-colors">Features</Link>
              <Link to="/free-tools" className="text-slate-500 hover:text-slate-900 font-headline font-medium text-[14px] transition-colors">Free Tools</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={avatarRef}>
              <button
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold text-sm shadow-md hover:scale-105 transition-transform ring-2 ring-white cursor-pointer"
              >
                {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
              </button>
              {showAvatarMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.first_name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <Link to="/about" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setShowAvatarMenu(false)}>
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    About Us
                  </Link>
                  <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 hidden lg:flex flex-col border-r border-slate-100 bg-white mt-20 z-40">
        <div className="flex flex-col gap-1 p-6">
          <Link to="/dashboard" className="flex items-center gap-3 bg-blue-50/50 text-blue-600 rounded-xl px-4 py-3 font-semibold text-[14px]">
            <span className="material-symbols-outlined text-[20px]">grid_view</span> Overview
          </Link>
        </div>
        <div className="mt-auto p-6 flex flex-col gap-6">
          <div className="pt-6 border-t border-slate-100 flex flex-col gap-2">
             <button onClick={handleSignOut} className="flex items-center gap-3 text-slate-400 hover:text-red-500 px-4 py-2 transition-all font-medium text-[13px] text-left w-full">
                <span className="material-symbols-outlined text-[18px]">logout</span> Log Out
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <header className="mb-8">
            <h1 className="editorial-headline text-3xl lg:text-[36px] font-bold text-slate-900 mb-1">
              {stats?.message || `Welcome back, ${user?.first_name || 'User'}!`}
            </h1>
            <p className="text-slate-400 font-medium text-base">
              Upload your resume & job description to get AI-powered gap analysis
            </p>
          </header>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Main Panel — Upload or Results */}
            <div className="md:col-span-12 lg:col-span-8">
              {analysisResult ? (
                <AnalysisResults result={analysisResult} onNewAnalysis={handleNewAnalysis} />
              ) : (
                <AnalyzePanel onAnalysisComplete={handleAnalysisComplete} />
              )}
            </div>

            {/* Side Panel — Stats + History */}
            <div className="md:col-span-12 lg:col-span-4 space-y-8">
              {/* Analyses Run Card */}
              <div className="bento-card rounded-xl p-10 flex flex-col justify-between relative overflow-hidden group">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600">analytics</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600 bg-blue-50/80 px-3 py-1.5 rounded-full">Your Stats</span>
                  </div>
                  <h3 className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Analyses Run</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="editorial-headline text-[80px] font-extrabold gradient-text leading-none">{data?.total_analyses ?? 0}</span>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl"></div>
              </div>

              {/* Analysis History */}
              <AnalysisHistory onViewAnalysis={handleViewHistoricAnalysis} />
            </div>
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bento-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">analytics</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Analyses</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{stats?.total_analyses || 0}</p>
            </div>
            <div className="bento-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 text-[18px]">verified</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</span>
              </div>
              <p className="text-2xl font-extrabold text-green-600">Free</p>
            </div>
            <div className="bento-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600 text-[18px]">description</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Resumes</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{stats?.total_analyses || 0}</p>
            </div>
            <div className="bento-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">workspace_premium</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan</span>
              </div>
              <p className="text-2xl font-extrabold gradient-text">100% Free</p>
            </div>
          </div>

          {!analysisResult ? (
            /* ────────── UPLOAD & ANALYSIS INPUT ────────── */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resume Upload */}
              <div className="bento-card rounded-xl p-6">
                <h2 className="editorial-headline text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
                  Upload Resume
                </h2>
                <div
                  className={`upload-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[240px] cursor-pointer ${dragOver ? 'bg-blue-50 border-blue-400' : 'hover:bg-blue-50/30'}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {resumeFile ? (
                    <>
                      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-green-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </div>
                      <p className="font-bold text-slate-900 text-lg mb-1">{resumeFile.name}</p>
                      <p className="text-slate-500 text-sm">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setResumeFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="mt-3 text-sm text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-blue-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                      </div>
                      <p className="font-bold text-slate-800 mb-1">Drag & drop your resume</p>
                      <p className="text-slate-500 text-sm">or click to browse • PDF, DOCX</p>
                    </>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <div className="bento-card rounded-xl p-6 flex flex-col">
                <h2 className="editorial-headline text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                  Job Description
                </h2>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="flex-1 min-h-[240px] w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none text-sm text-slate-700 placeholder-slate-400 font-body"
                />
              </div>

              {/* Analyze Button */}
              <div className="lg:col-span-2 flex flex-col items-center gap-3">
                {analysisError && (
                  <div className="w-full max-w-xl p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100 text-sm">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <p>{analysisError}</p>
                  </div>
                )}
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || !resumeFile || !jobDescription.trim()}
                  className={`primary-gradient text-white px-12 py-4 rounded-xl font-bold text-base shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${analyzing ? 'animate-pulse' : ''}`}
                >
                  {analyzing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      Analyze Resume
                    </>
                  )}
                </button>
                {analyzing && (
                  <p className="text-slate-400 text-sm">This may take 15-30 seconds for AI analysis...</p>
                )}
              </div>
            </div>
          ) : (
            /* ────────── ANALYSIS RESULTS ────────── */
            <div className="space-y-6">
              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={resetAnalysis}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  New Analysis
                </button>
                <button
                  onClick={handleGenerateResume}
                  disabled={generatingResume}
                  className="flex items-center gap-2 px-5 py-2.5 primary-gradient text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-50"
                >
                  {generatingResume ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit_document</span>
                      Generate ATS-Friendly Resume
                    </>
                  )}
                </button>
              </div>

              {/* Scores Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* ATS Score */}
                <div className="bento-card rounded-xl p-6 flex items-center gap-5">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke={getScoreColor(analysisResult.ats_score)} strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - analysisResult.ats_score / 100)}`}
                        strokeLinecap="round" className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-extrabold" style={{ color: getScoreColor(analysisResult.ats_score) }}>{Math.round(analysisResult.ats_score)}%</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">ATS Score</h3>
                    <p className="text-xl font-extrabold text-slate-900">{getScoreLabel(analysisResult.ats_score)}</p>
                    <p className="text-xs text-slate-500 mt-1">Keyword density match</p>
                  </div>
                </div>

                {/* Match Score */}
                <div className="bento-card rounded-xl p-6 flex items-center gap-5">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke={getScoreColor(analysisResult.match_score)} strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - analysisResult.match_score / 100)}`}
                        strokeLinecap="round" className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-extrabold" style={{ color: getScoreColor(analysisResult.match_score) }}>{Math.round(analysisResult.match_score)}%</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Semantic Match</h3>
                    <p className="text-xl font-extrabold text-slate-900">{getScoreLabel(analysisResult.match_score)}</p>
                    <p className="text-xs text-slate-500 mt-1">Neural skill matching</p>
                  </div>
                </div>

                {/* Skills Summary */}
                <div className="bento-card rounded-xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Skills Summary</h3>
                  <div className="flex items-end gap-6">
                    <div>
                      <p className="text-3xl font-extrabold text-green-600">{analysisResult.matched_skills?.length || 0}</p>
                      <p className="text-xs text-slate-500 mt-1">Matched</p>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-red-500">{analysisResult.missing_skills?.length || 0}</p>
                      <p className="text-xs text-slate-500 mt-1">Gaps Found</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gap Highlights */}
              {analysisResult.gaps && analysisResult.gaps.length > 0 && (
                <div className="bento-card rounded-xl p-6">
                  <h2 className="editorial-headline text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    Skill Gaps Detected
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysisResult.gaps.map((gap, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-red-50/50 border border-red-100/50 hover:border-red-200 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-900 text-sm">{gap.skill}</h4>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${gap.priority_rank <= 2 ? 'bg-red-100 text-red-600' : gap.priority_rank <= 4 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                            Priority #{gap.priority_rank}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{gap.relevancy}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>JD mentions: <strong className="text-slate-600">{gap.jd_frequency}x</strong></span>
                          <span>Resume: <strong className="text-red-500">{gap.resume_frequency}x</strong></span>
                          <span>Add: <strong className="text-blue-600">{gap.recommended_additions}x</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Video Recommendations / Learning Resources */}
              {analysisResult.recommended_resources && analysisResult.recommended_resources.length > 0 && (
                <div className="bento-card rounded-xl p-6">
                  <h2 className="editorial-headline text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                    Recommended Videos & Resources
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analysisResult.recommended_resources.map((res, idx) => (
                      <a
                        key={idx}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${res.resource_type === 'Video' ? 'bg-red-100 text-red-600' : res.resource_type === 'Course' ? 'bg-blue-100 text-blue-600' : res.resource_type === 'Documentation' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                            {res.resource_type}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">{res.skill}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-purple-700 transition-colors line-clamp-2">{res.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{res.description}</p>
                        <div className="flex items-center gap-1 mt-2 text-purple-600 text-xs font-semibold">
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          Open Resource
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {analysisResult.improvements && analysisResult.improvements.length > 0 && (
                <div className="bento-card rounded-xl p-6">
                  <h2 className="editorial-headline text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                    Resume Improvements
                  </h2>
                  <div className="space-y-3">
                    {analysisResult.improvements.map((imp, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-green-50/30 border border-green-100/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700">{imp.section}</span>
                        </div>
                        <p className="text-sm text-slate-700 mb-3">{imp.suggestion}</p>
                        {imp.before_example && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">Before</p>
                              <p className="text-xs text-red-700">{imp.before_example}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-green-400 mb-1">After</p>
                              <p className="text-xs text-green-700">{imp.after_example}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Path */}
              {analysisResult.learning_path && analysisResult.learning_path.length > 0 && (
                <div className="bento-card rounded-xl p-6">
                  <h2 className="editorial-headline text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                    Learning Path
                  </h2>
                  <div className="space-y-3">
                    {analysisResult.learning_path.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-blue-50/30 border border-blue-100/50 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-900 text-sm">{item.skill}</h4>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${item.priority === 'High' ? 'bg-red-100 text-red-600' : item.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                              {item.priority}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${item.difficulty === 'Beginner' ? 'bg-green-100 text-green-600' : item.difficulty === 'Intermediate' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                              {item.difficulty}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mb-1">{item.reason}</p>
                          {item.resources && (
                            <p className="text-xs text-blue-600 font-medium">📚 {item.resources}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-center px-4">
                          <p className="text-xl font-extrabold text-blue-600">{item.estimated_time_weeks}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Weeks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated ATS Resume */}
              {generatedResume && (
                <div className="bento-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="editorial-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                      ATS-Optimized Resume
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyResume}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        Copy
                      </button>
                      <button
                        onClick={handleDownloadResume}
                        className="flex items-center gap-1 px-3 py-1.5 primary-gradient text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-6 rounded-xl border border-slate-200 max-h-[600px] overflow-y-auto font-body leading-relaxed">
                    {generatedResume}
                  </pre>
                </div>
              )}

              {/* Matched Skills */}
              {analysisResult.matched_skills && analysisResult.matched_skills.length > 0 && (
                <div className="bento-card rounded-xl p-6">
                  <h2 className="editorial-headline text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Matched Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.matched_skills.map((skill, idx) => (
                      <div key={idx} className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-xs font-semibold text-green-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        {skill.jd_skill}
                        <span className="text-green-400 ml-1">{Math.round(skill.similarity * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
