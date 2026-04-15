export default function BentoGrid() {
  const cards = [
    {
      span: "md:col-span-12",
      icon: "psychology",
      title: "Neural Matching Engine",
      desc: "Our proprietary algorithm analyzes 40+ points of cultural data and semantic relevance to predict how well you'll thrive in a new environment before you even interview.",
      tags: ["Work-Life Balance", "Async First", "Growth Mindset"],
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      accent: "border-blue-200/50"
    },
    {
      span: "md:col-span-4",
      icon: "verified_user",
      title: "Verified Companies Only",
      desc: "Every listing is manually vetted for authenticity, culture accuracy, and financial stability.",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      accent: "border-emerald-200/50"
    },
    {
      span: "md:col-span-8",
      icon: "analytics",
      title: "Insightful Analytics",
      desc: "Visualize your career growth and market value in real-time. Our dashboard provides surgical precision on what skills to learn next.",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      accent: "border-purple-200/50",
      image: "/images/dash.png"
    }
  ];

  return (
    <section className="py-32 px-6 bg-slate-50/50 relative overflow-hidden">
      {/* Decorative lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50"></div>

      <div className="max-w-7xl mx-auto">
        <div className="mb-20 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 font-premium text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            Platform Capabilities
          </div>
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Why VibeOnJob?</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-body">We go beyond the traditional resume match. We find where you actually belong using deep semantic analysis.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-auto">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`${card.span} bento-card rounded-[2rem] p-10 flex flex-col justify-between relative overflow-hidden group border ${card.accent}`}
            >
              {/* Subtle background glow on hover */}
              <div className="absolute -inset-1 primary-gradient opacity-0 lg:group-hover:opacity-[0.03] transition-opacity duration-500"></div>

              <div className={card.image ? "flex flex-col lg:flex-row gap-10 items-center justify-between h-full" : "h-full"}>
                <div className={card.image ? "flex-1" : ""}>
                  <div className={`w-14 h-14 ${card.iconBg} rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                    <span className={`material-symbols-outlined ${card.iconColor} text-[32px]`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {card.icon}
                    </span>
                  </div>
                  <h3 className="font-headline text-2xl font-bold text-slate-900 mb-4">{card.title}</h3>
                  <p className="text-slate-500 text-lg leading-relaxed mb-8">{card.desc}</p>

                  {card.tags && (
                    <div className="flex flex-wrap gap-3 mt-auto">
                      {card.tags.map(tag => (
                        <span key={tag} className="px-4 py-2 rounded-full bg-white border border-slate-100 text-slate-600 text-sm font-bold shadow-sm group-hover:bg-slate-50 transition-colors">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {card.image && (
                  <div className="lg:w-1/2 relative">
                    <div className="absolute inset-0 primary-gradient blur-[80px] opacity-10 rounded-full"></div>
                    <img
                      alt={card.title}
                      className="rounded-2xl shadow-2xl relative z-10 transform rotate-3 hover:rotate-0 transition-transform duration-700"
                      src={card.image}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
