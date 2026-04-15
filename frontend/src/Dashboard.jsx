import { useEffect, useState, useRef } from 'react'
import { useAuth } from './context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import AnalyzePanel from './components/AnalyzePanel'
import AnalysisResults from './components/AnalysisResults'
import AnalysisHistory from './components/AnalysisHistory'

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const avatarRef = useRef(null)

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) return;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await fetch(`${apiUrl}/api/dashboard-data`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error('Failed to fetch data')
        setData(await response.json())
      } catch (err) {
        setError(err.message)
      }
    }
    fetchData()
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

  return (
    <div className="selection:bg-blue-100 selection:text-blue-900 bg-[#f8fafc] font-body min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-slate-100">
        <div className="flex justify-between items-center h-20 px-8 w-full mx-auto max-w-screen-2xl">
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <span className="text-2xl font-bold tracking-tighter text-slate-900 font-headline">VibeOnJob</span>
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
                  </div>
                )}
              </div>
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
      <main className="lg:ml-64 pt-32 pb-20 px-8 xl:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Header */}
          <header className="mb-14">
            <h1 className="editorial-headline text-[40px] font-bold text-slate-900 mb-2">
              {data?.message || `Welcome back, ${user?.first_name || 'User'}!`}
            </h1>
            <p className="text-slate-400 font-medium text-lg">
              {user?.email || "user@example.com"}
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

          </div>
        </div>
      </main>
    </div>
  )
}
