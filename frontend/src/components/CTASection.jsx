import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-24 px-8">
      <div className="max-w-6xl mx-auto rounded-[3rem] primary-gradient p-12 md:p-24 relative overflow-hidden shadow-[0_20px_80px_-15px_rgba(37,99,235,0.4)]">
        {/* Animated Orbs for Depth */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 text-center text-white max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white mb-8 font-premium text-xs font-bold tracking-widest uppercase border border-white/30">
            Join 10,000+ Job Seekers
          </div>
          <h2 className="font-headline text-4xl md:text-6xl font-extrabold mb-8 leading-tight">
            Ready to Find Your <br/> <span className="opacity-80">Next Great Vibe?</span>
          </h2>
          <p className="text-xl opacity-90 mb-12 font-body leading-relaxed">
            Stop wasting time on mismatched roles. Join the platform where culture and expertise finally speak the same language. 100% Free.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/signup">
              <button className="bg-white text-blue-600 text-xl px-12 py-5 rounded-2xl font-black shadow-2xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 group">
                Get Started Now
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </Link>
          </div>
          
          <div className="mt-12 flex justify-center items-center gap-10 opacity-70">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-primary bg-slate-200 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-primary bg-white text-blue-600 flex items-center justify-center text-[10px] font-black">+10k</div>
            </div>
            <p className="text-sm font-bold tracking-wide uppercase italic">The new standard in hiring</p>
          </div>
        </div>
      </div>
    </section>
  );
}
