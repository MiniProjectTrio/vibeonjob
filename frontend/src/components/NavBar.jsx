import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <header className="w-full top-0 sticky z-50 bg-[#f5f6f7] dark:bg-slate-950">
      <nav className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-[#2c2f30] dark:text-white font-['Plus_Jakarta_Sans'] tracking-tight">VibeOnJob</div>
        <div className="hidden md:flex items-center gap-8">
          <a className="text-[#2c2f30] dark:text-slate-400 hover:text-[#2563EB] font-['Plus_Jakarta_Sans'] transition-all" href="#">Features</a>
          <a className="text-[#2c2f30] dark:text-slate-400 hover:text-[#2563EB] font-['Plus_Jakarta_Sans'] transition-all" href="#">Free Tools</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <button className="text-[#2c2f30] dark:text-slate-400 hover:text-[#2563EB] px-4 py-2 transition-all font-medium">Log In</button>
          </Link>
          <Link to="/signup">
            <button className="primary-gradient text-on-primary px-6 py-2.5 rounded-full font-bold shadow-lg hover:shadow-primary/20 transition-all scale-95 active:scale-90 duration-100">Get Started Free</button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
