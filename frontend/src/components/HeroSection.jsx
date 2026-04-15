import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="pt-20 pb-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container mb-8 font-label text-sm font-semibold tracking-wide">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          AI-POWERED MATCHING
        </div>
        <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface mb-6 leading-tight">
          Discover Your <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">Ideal Career Vibe.</span>
        </h1>
        <p className="font-body text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop scrolling and start vibing. We use neural-matching to find the companies that align with your energy, culture, and career goals.
        </p>
        <div className="flex flex-col items-center gap-4">
          <Link to="/signup">
            <button className="primary-gradient text-on-primary text-lg px-10 py-5 rounded-full font-bold shadow-xl hover:shadow-primary/30 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3">
              Try Now - It's 100% Free
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </Link>
          <div className="flex items-center gap-2 text-on-surface-variant font-label text-sm">
            <span className="material-symbols-outlined text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            No payment required
          </div>
        </div>
      </div>
    </section>
  );
}
