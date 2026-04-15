import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setShowMenu(false);
    logout();
    navigate('/');
  };

  return (
    <header className={`w-full fixed top-0 z-50 transition-all duration-500 ${scrolled ? 'py-3' : 'py-6'}`}>
      <nav className={`mx-auto max-w-7xl px-6 transition-all duration-500`}>
        <div className={`flex justify-between items-center px-6 py-3 rounded-2xl transition-all duration-500 ${scrolled ? 'glass shadow-lg border-white/40' : 'bg-transparent'}`}>
          {/* Dynamic Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 group">
            <div className="w-10 h-10 primary-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <span className="text-2xl font-black text-slate-900 font-headline tracking-tighter">VibeOnJob</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-10">
            <Link to="/about" className="text-slate-600 hover:text-blue-600 font-premium font-bold text-sm transition-colors">About</Link>
            <Link to="/features" className="text-slate-600 hover:text-blue-600 font-premium font-bold text-sm transition-colors">Features</Link>
            <Link to="/free-tools" className="text-slate-600 hover:text-blue-600 font-premium font-bold text-sm transition-colors">Free Tools</Link>
          </div>

          {/* Auth Buttons / Avatar */}
          <div className="flex items-center gap-6">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="h-10 w-10 rounded-xl primary-gradient text-white flex items-center justify-center font-bold text-sm shadow-lg hover:scale-105 transition-transform"
                >
                  {user.first_name ? user.first_name[0].toUpperCase() : 'U'}
                </button>

                {/* Dropdown */}
                {showMenu && (
                  <div className="absolute right-0 mt-4 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-3">
                    <div className="px-5 py-4 border-b border-slate-50">
                      <p className="text-sm font-black text-slate-900 truncate">{user.first_name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors" onClick={() => setShowMenu(false)}>
                      <span className="material-symbols-outlined text-[20px]">dashboard</span>
                      Insights Dashboard
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center gap-3 px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                      <span className="material-symbols-outlined text-[20px]">logout</span>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-blue-600 font-black text-sm transition-colors px-2">Log In</Link>
                <Link to="/signup">
                  <button className="primary-gradient text-white px-7 py-3 rounded-xl font-black text-sm shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-95 transition-all">
                    Launch App
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
