import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Content */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 mb-8 font-premium text-sm font-bold tracking-wide border border-blue-100/50 shadow-sm animate-fade-in">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              THE FUTURE OF JOB SEEKING
            </div>

            <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              Discover Your <br />
              <span className="text-gradient">Ideal Career Vibe.</span>
            </h1>

            <p className="font-body text-xl text-slate-600 max-w-xl mb-10 leading-relaxed">
              Stop scrolling, start vibing. We use neural-matching to find the companies that align with your energy, culture, and career goals.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <Link to="/signup">
                <button className="primary-gradient text-white text-lg px-10 py-5 rounded-2xl font-bold shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3">
                  Analyze Your Resume
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </Link>
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 text-slate-500 font-premium text-sm font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  100% Free Forever
                </div>
                <p className="text-xs text-slate-400 pl-7">No credit card required</p>
              </div>
            </div>

            {/* Trusted By / Logo Cloud */}
            <div className="mt-16">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Designed For Modern Careers</p>
              <div className="flex flex-wrap gap-8 items-center opacity-40 grayscale pointer-events-none">
                <span className="font-headline font-black text-2xl">Google</span>
                <span className="font-headline font-black text-2xl">Meta</span>
                <span className="font-headline font-black text-2xl">Netflix</span>
                <span className="font-headline font-black text-2xl">Airbnb</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image / Visual */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
              <img
                src="/images/heroA.png"
                alt="AI Career Mapping"
                className="w-full h-auto object-cover transform transition duration-500 group-hover:scale-105"
              />
              {/* Floating Stat Card */}
              <div className="absolute bottom-8 left-8 right-8 glass p-6 rounded-2xl shadow-xl animate-bounce-slow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full primary-gradient flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Match Accuracy</p>
                    <p className="text-2xl font-black text-slate-900">98.4%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
