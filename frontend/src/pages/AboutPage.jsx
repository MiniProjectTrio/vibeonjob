import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  const team = [
    {
      name: "Sujeet Mahto",
      role: "Full-Stack Architect",
      icon: "code",
      color: "from-blue-500 to-indigo-600",
      description: "Architected the hybrid NLP + LLM pipeline powering the 6-layer resume analysis engine.",
    },
    {
      name: "Sakshi Jain",
      role: "AI & Data Engineer",
      icon: "psychology",
      color: "from-violet-500 to-purple-600",
      description: "Built the semantic embedding layer and Hungarian algorithm matching for precision skill gap detection.",
    },
    {
      name: "Ninkor Chandra Barman",
      role: "Frontend & UX Designer",
      icon: "palette",
      color: "from-pink-500 to-rose-600",
      description: "Crafted the premium Ethereal Curator design system and interactive dashboard experience.",
    },
  ];

  return (
    <>
      <NavBar />
      <main className="relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute w-[800px] h-[800px] rounded-full blur-[120px] z-0 opacity-10 pointer-events-none bg-gradient-to-br from-blue-400 to-indigo-600 -top-48 -right-48"></div>
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[100px] z-0 opacity-10 pointer-events-none bg-gradient-to-tr from-violet-500 to-purple-400 bottom-0 -left-48"></div>

        {/* Hero Section */}
        <section className="relative z-10 pt-20 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container mb-8 font-label text-sm font-semibold tracking-wide">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              ABOUT THE TEAM
            </div>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tight text-on-surface mb-6 leading-tight">
              Built by the <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">Mini Project Trio.</span>
            </h1>
            <p className="font-body text-xl text-on-surface-variant max-w-2xl mx-auto mb-6 leading-relaxed">
              Three students with one vision — to revolutionize how job seekers bridge the gap between their resume and their dream role using cutting-edge AI.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="relative z-10 py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="bento-card rounded-2xl p-10 md:p-14">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600">rocket_launch</span>
                </div>
                <h2 className="editorial-headline text-2xl font-bold text-on-surface">Our Mission</h2>
              </div>
              <p className="text-on-surface-variant text-lg leading-relaxed mb-6">
                VibeOnJob was born out of a simple frustration — the modern job application process is broken. 
                Applicant Tracking Systems reject qualified candidates because their resumes don't speak the right "language." 
                We built a tool that bridges this gap with a unique hybrid approach:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-slate-50/50 rounded-2xl p-6 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                  <span className="material-symbols-outlined text-blue-600 text-3xl mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>neurology</span>
                  <h3 className="font-bold text-on-surface mb-2">NLP-Driven Extraction</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">spaCy NER + dependency parsing extracts skills through linguistic structure — no keyword matching.</p>
                </div>
                <div className="bg-slate-50/50 rounded-2xl p-6 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                  <span className="material-symbols-outlined text-indigo-600 text-3xl mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
                  <h3 className="font-bold text-on-surface mb-2">Semantic Matching</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">384-dim MiniLM embeddings + Hungarian algorithm find the optimal skill alignment.</p>
                </div>
                <div className="bg-slate-50/50 rounded-2xl p-6 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                  <span className="material-symbols-outlined text-violet-600 text-3xl mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <h3 className="font-bold text-on-surface mb-2">LLM Presentation</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">Gemini translates mathematical analysis into actionable, human-readable career advice.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="relative z-10 py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="editorial-headline text-3xl font-bold text-on-surface mb-4">The Visionaries</h2>
              <p className="text-on-surface-variant text-lg">Creators & Contributors of VibeOnJob</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member, idx) => (
                <div key={idx} className="bento-card rounded-2xl p-8 text-center group">
                  <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                    <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{member.icon}</span>
                  </div>
                  <h3 className="font-headline text-xl font-bold text-on-surface mb-1">{member.name}</h3>
                  <p className="text-sm font-semibold text-primary mb-4">{member.role}</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GitHub CTA */}
        <section className="relative z-10 py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bento-card rounded-2xl p-10 md:p-14 bg-gradient-to-br from-slate-900 to-slate-800 border-0">
              <span className="material-symbols-outlined text-blue-400 text-5xl mb-6 block" style={{ fontVariationSettings: "'FILL' 1" }}>code</span>
              <h2 className="editorial-headline text-3xl font-bold text-white mb-4">Open Source on GitHub</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                VibeOnJob is an open-source project. Explore the codebase, contribute,
                or fork it for your own career tools.
              </p>
              <a
                href="https://github.com/MiniProjectTrio/vibeonjob"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-sm hover:bg-slate-100 transition-colors shadow-xl"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                View on GitHub
              </a>
            </div>
          </div>
        </section>

        {/* Bottom spacer */}
        <div className="h-8"></div>
      </main>
      <Footer />
    </>
  );
}
