import { useEffect, useState, useRef } from 'react'
import { useAuth } from './context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
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
              <Link to="#" className="text-slate-500 hover:text-slate-900 font-headline font-medium text-[15px] transition-colors">Features</Link>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center px-4 py-2 bg-slate-100/80 rounded-full border border-slate-200/50">
              <span className="material-symbols-outlined text-slate-400 text-[18px] mr-2">search</span>
              <input type="text" placeholder="Search insights..." className="bg-transparent border-none focus:ring-0 text-sm placeholder-slate-400 w-48 outline-none" />
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-slate-900 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="text-slate-400 hover:text-slate-900 transition-colors">
                <span className="material-symbols-outlined">settings</span>
              </button>
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
          <Link to="#" className="flex items-center gap-3 bg-blue-50/50 text-blue-600 rounded-xl px-4 py-3 font-semibold text-[14px]">
            <span className="material-symbols-outlined text-[20px]">grid_view</span> Overview
          </Link>
          <Link to="#" className="flex items-center gap-3 text-slate-500 px-4 py-3 hover:bg-slate-50 rounded-xl transition-all font-medium text-[14px]">
            <span className="material-symbols-outlined text-[20px]">person_search</span> Recruitment
          </Link>
        </div>
        <div className="mt-auto p-6 flex flex-col gap-6">
          <button className="primary-gradient text-white rounded-xl py-3.5 px-4 font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
            Post a Job
          </button>
          <div className="pt-6 border-t border-slate-100 flex flex-col gap-2">
             <Link to="#" className="flex items-center gap-3 text-slate-400 hover:text-blue-500 px-4 py-2 transition-all font-medium text-[13px]">
                <span className="material-symbols-outlined text-[18px]">help_center</span> Help Center
             </Link>
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
            
            {/* Upload Zone (Dashboard logic merged) */}
            <div className="md:col-span-12 lg:col-span-8">
              <div className="group relative bg-white rounded-xl p-2 h-full bento-card">
                 {error ? (
                    <div className="p-8 m-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
                        <span className="material-symbols-outlined">error</span>
                        <p>Error loading dashboard backend stats: {error}</p>
                    </div>
                ) : !data ? (
                    <div className="p-12 m-4 rounded-xl flex flex-col items-center justify-center min-h-[400px]">
                        <span className="material-symbols-outlined animate-pulse text-4xl text-blue-300">sync</span>
                        <p className="mt-4 text-slate-500 font-medium">Loading premium insights...</p>
                    </div>
                ) : (
                    <div className="upload-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:bg-blue-50/30 min-h-[400px]">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                            <span className="material-symbols-outlined text-blue-600 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                        </div>
                        <h2 className="editorial-headline text-2xl font-bold text-slate-900 mb-4">Upload Resume and Job Description</h2>
                        <p className="text-slate-500 max-w-sm mx-auto mb-10 text-[15px] leading-relaxed">
                             Drag and drop your PDF or DOCX files here to start the AI talent matching analysis.
                        </p>
                        <div className="flex gap-4">
                            <button className="primary-gradient text-white px-10 py-4 rounded-xl font-bold text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
                                Browse Files
                            </button>
                        </div>
                    </div>
                )}
              </div>
            </div>

            {/* Analyses Run Card */}
            <div className="md:col-span-6 lg:col-span-4">
              <div className="bento-card rounded-xl p-10 h-full flex flex-col justify-between relative overflow-hidden group">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600">analytics</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600 bg-blue-50/80 px-3 py-1.5 rounded-full">Global Usage</span>
                  </div>
                  <h3 className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Analyses Run</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="editorial-headline text-[120px] font-extrabold gradient-text leading-none">{data ? data.insights.length : 0}</span>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl"></div>
              </div>
            </div>

            {/* Pro Tips / Activity */}
            <div className="md:col-span-6 lg:col-span-5">
              <div className="bento-card rounded-xl p-10 h-full">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="editorial-headline text-xl font-bold text-slate-900">Expert Insights</h3>
                  <span className="material-symbols-outlined text-blue-500/40">lightbulb</span>
                </div>
                <div className="space-y-5">
                   {data && data.insights.map((insight, idx) => (
                      <div key={idx} className="flex gap-5 p-5 rounded-2xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
                        <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0 group-hover:border-blue-100">
                          <span className="material-symbols-outlined text-blue-600 text-[20px]">psychology</span>
                        </div>
                        <div>
                          <p className="text-[13px] text-slate-500 leading-relaxed font-bold">{insight}</p>
                        </div>
                      </div>
                   ))}
                   {(!data || data.insights.length === 0) && (
                      <p className="text-sm text-slate-500">Upload documents to unlock automated behavioral and team alignment insights.</p>
                   )}
                </div>
              </div>
            </div>

            {/* Premium Promo Card */}
            <div className="md:col-span-12 lg:col-span-7">
              <div className="group relative rounded-xl overflow-hidden min-h-[400px] flex items-end">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmfhRNcm0LBtthlybuB_LjCK3wIe3UM7FYDSJqWwWdsAsn233eyXwcmLfTGXbswzqocrco1AnHxef31A08FgnNpgdv1lxvMN8-sIVTdz9Mz6J7EIOtPZoUNzwf-w2jAUQ1GYyoInPWnSr84fDyOJkDu6XM2NceaweDjWDmWXy6JPJniTt7eczoXSHtAzl41nHxpjU2FvExW2bLKuSf6uxYr9Tci2BHl4lFNDB8yzewgIVpuGLu6hDrnZ5xjnVVCNU5I5DfmWtGkH0e" alt="Office space" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent"></div>
                <div className="relative z-10 p-12 w-full">
                  <div className="max-w-md">
                    <div className="bg-blue-400/20 backdrop-blur-md px-4 py-1.5 rounded-full w-fit mb-6 border border-white/20">
                      <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Enterprise Edition</span>
                    </div>
                    <h2 className="editorial-headline text-3xl font-bold text-white mb-4">Unlock Premium Talent Insights</h2>
                    <p className="text-white/80 text-[15px] mb-8 leading-relaxed">Gain access to behavioral predictive analytics and automated interview scheduling for your whole team.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
