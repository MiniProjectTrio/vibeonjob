import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto primary-gradient rounded-xl p-12 text-center text-on-primary shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">Ready to find your vibe?</h2>
        <p className="text-lg opacity-90 mb-10 max-w-xl mx-auto relative z-10">
          Be among the first to discover a career that actually matches your energy.
        </p>
        <Link to="/signup">
          <button className="bg-white text-primary text-lg px-12 py-4 rounded-full font-bold shadow-xl hover:bg-on-primary transition-all relative z-10 active:scale-95">
            Start Your Search Now
          </button>
        </Link>
      </div>
    </section>
  );
}
