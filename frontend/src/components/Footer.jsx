export default function Footer() {
  return (
    <footer className="w-full py-12 border-t-0 bg-[#f5f6f7] dark:bg-slate-950">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-4">
        <div className="font-['Plus_Jakarta_Sans'] font-bold text-[#2c2f30] dark:text-white text-xl">VibeOnJob</div>
        <div className="flex gap-8 items-center">
          <a className="text-slate-500 dark:text-slate-400 hover:text-[#2563EB] underline transition-colors text-sm font-['Inter']" href="#">Privacy Policy</a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-[#2563EB] underline transition-colors text-sm font-['Inter']" href="#">Terms of Service</a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-[#2563EB] underline transition-colors text-sm font-['Inter']" href="#">Contact</a>
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-sm font-['Inter']">
          © 2024 VibeOnJob. 100% Free.
        </div>
      </div>
    </footer>
  );
}
