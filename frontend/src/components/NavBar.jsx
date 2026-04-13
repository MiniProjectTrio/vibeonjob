import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

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
    <header className="w-full top-0 sticky z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <nav className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        {/* Dynamic Logo */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="text-2xl font-bold text-on-surface font-headline tracking-tight">VibeOnJob</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/about" className="text-on-surface-variant hover:text-primary font-headline font-medium text-[15px] transition-colors">About</Link>
          <a className="text-on-surface-variant hover:text-primary font-headline font-medium text-[15px] transition-colors" href="#">Features</a>
          <a className="text-on-surface-variant hover:text-primary font-headline font-medium text-[15px] transition-colors" href="#">Free Tools</a>
        </div>

        {/* Auth Buttons / Avatar */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold text-sm shadow-md hover:scale-105 transition-transform ring-2 ring-white"
              >
                {user.first_name ? user.first_name[0].toUpperCase() : 'U'}
              </button>

              {/* Dropdown */}
              {showMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-on-surface truncate">{user.first_name || 'User'}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                  </div>
                  <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setShowMenu(false)}>
                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                    Dashboard
                  </Link>
                  <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login">
                <button className="text-on-surface hover:text-primary px-4 py-2 transition-all font-bold text-sm">Log In</button>
              </Link>
              <Link to="/signup">
                <button className="primary-gradient text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:scale-95">Get Started Free</button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
