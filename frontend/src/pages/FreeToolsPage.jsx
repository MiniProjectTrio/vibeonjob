import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function FreeToolsPage() {
  const tools = [
    {
      icon: 'auto_awesome',
      title: 'Resume Analyzer',
      desc: 'Upload your resume and a job description to get a comprehensive gap analysis with ATS scoring, missing skills, and actionable improvements.',
      status: 'Available',
      statusColor: 'bg-green-100 text-green-700',
      link: '/dashboard',
      cta: 'Analyze Now',
    },
    {
      icon: 'analytics',
      title: 'ATS Score Checker',
      desc: 'See how well your resume matches ATS requirements. Get keyword density analysis, frequency counts, and coverage percentages for every skill.',
      status: 'Available',
      statusColor: 'bg-green-100 text-green-700',
      link: '/dashboard',
      cta: 'Check Score',
    },
    {
      icon: 'search_insights',
      title: 'Skill Gap Detector',
      desc: 'Identify exactly which skills are missing from your resume for a specific role. Each gap is prioritized by how critical it is for the position.',
      status: 'Available',
      statusColor: 'bg-green-100 text-green-700',
      link: '/dashboard',
      cta: 'Find Gaps',
    },
    {
      icon: 'edit_document',
      title: 'Resume Builder',
      desc: 'Generate an ATS-optimized version of your resume with missing keywords intelligently woven in. Download or copy instantly.',
      status: 'Available',
      statusColor: 'bg-green-100 text-green-700',
      link: '/dashboard',
      cta: 'Build Resume',
    },
    {
      icon: 'play_circle',
      title: 'Learning Path Generator',
      desc: 'Get personalized learning recommendations with YouTube tutorials, courses, and docs for every skill gap. Includes time estimates.',
      status: 'Available',
      statusColor: 'bg-green-100 text-green-700',
      link: '/dashboard',
      cta: 'Get Path',
    },
    {
      icon: 'compare',
      title: 'Resume Comparison',
      desc: 'Compare two versions of your resume against the same job description to see which performs better. Track your optimization progress.',
      status: 'Coming Soon',
      statusColor: 'bg-amber-100 text-amber-700',
      link: '#',
      cta: 'Notify Me',
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
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              100% FREE FOREVER
            </div>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tight text-on-surface mb-6 leading-tight">
              Free Tools for <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">Job Seekers</span>
            </h1>
            <p className="font-body text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              All our tools are completely free. No paywalls, no premium tiers, no credit card required. Our mission is to help you land your dream job.
            </p>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-2xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-blue-600 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {tool.icon}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${tool.statusColor}`}>
                    {tool.status}
                  </span>
                </div>
                <h3 className="font-headline text-xl font-bold text-slate-900 mb-3">{tool.title}</h3>
                <p className="text-slate-500 text-[15px] leading-relaxed flex-1">{tool.desc}</p>
                <Link
                  to={tool.link}
                  className="mt-6 inline-flex items-center gap-2 text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors group-hover:gap-3"
                >
                  {tool.cta}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Free Promise */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-green-600 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <h2 className="font-headline text-3xl font-bold text-slate-900 mb-4">Our Free Promise</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
              VibeOnJob will always remain free for job seekers. We believe everyone deserves access to professional-grade resume tools, regardless of their financial situation. No hidden fees, no premium tiers, no catch.
            </p>
            <Link to="/signup">
              <button className="primary-gradient text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-95">
                Get Started — It's Free
              </button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
