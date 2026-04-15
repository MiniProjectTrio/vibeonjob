import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function FeaturesPage() {
  const features = [
    {
      icon: 'auto_awesome',
      title: 'AI Resume Analysis',
      desc: 'Our 6-layer NLP + LLM pipeline parses your resume and compares it against any job description with surgical precision. Get a comprehensive gap analysis in seconds.',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      icon: 'analytics',
      title: 'ATS Score Calculator',
      desc: 'See exactly how your resume performs against Applicant Tracking Systems. We measure keyword density, frequency matching, and coverage percentage for every required skill.',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      icon: 'search_insights',
      title: 'Gap Detection & Highlighting',
      desc: 'Instantly identify missing skills, underrepresented keywords, and resume blind spots. Each gap is ranked by priority based on how often the JD references it.',
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      icon: 'play_circle',
      title: 'Video Recommendations',
      desc: 'For every gap we find, we suggest real YouTube tutorials, courses, and documentation to help you close the skill deficit. Learn exactly what you need, nothing more.',
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      icon: 'edit_document',
      title: 'ATS-Friendly Resume Generator',
      desc: 'One-click generation of an optimized resume. We intelligently weave missing keywords into your experience, upgrade bullet points, and restructure sections for maximum ATS compatibility.',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      icon: 'school',
      title: 'Learning Path Builder',
      desc: 'Get a personalized learning roadmap with time estimates, difficulty levels, and priority rankings. Know exactly which skills to learn first for maximum career impact.',
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
    },
  ];

  return (
    <>
      <NavBar />
      <main className="relative overflow-hidden">
        {/* Hero */}
        <section className="pt-20 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container mb-6 font-label text-sm font-semibold tracking-wide">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              ALL FEATURES
            </div>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tight text-on-surface mb-6 leading-tight">
              Everything You Need to <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">Land Your Dream Job</span>
            </h1>
            <p className="font-body text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Our AI-powered platform analyzes your resume, identifies gaps, and helps you build the perfect application — completely free.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-2xl p-8 border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <span className={`material-symbols-outlined ${feature.textColor} text-[28px]`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {feature.icon}
                  </span>
                </div>
                <h3 className="font-headline text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 text-[15px] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto primary-gradient rounded-2xl p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Ready to optimize your resume?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto relative z-10">
              Start your free analysis now. No credit card, no hidden fees.
            </p>
            <Link to="/signup">
              <button className="bg-white text-primary text-lg px-10 py-4 rounded-full font-bold shadow-xl hover:bg-on-primary transition-all relative z-10 active:scale-95">
                Get Started Free
              </button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
