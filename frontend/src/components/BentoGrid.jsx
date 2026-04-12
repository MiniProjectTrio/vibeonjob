export default function BentoGrid() {
  return (
    <section className="py-24 px-6 bg-surface-container-low">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="font-headline text-4xl font-bold mb-4">Why VibeOnJob?</h2>
          <p className="text-on-surface-variant">Beyond the resume. Find where you actually belong.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
          {/* Bento Card 1 */}
          <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-10 flex flex-col justify-between group hover:surface-container-high transition-colors">
            <div>
              <span className="material-symbols-outlined text-4xl text-primary mb-6">psychology</span>
              <h3 className="text-2xl font-bold mb-4">Neural Matching Engine</h3>
              <p className="text-on-surface-variant text-lg max-w-md">Our algorithm analyzes 40+ points of cultural data to predict how well you'll thrive in a new environment before you even interview.</p>
            </div>
            <div className="mt-8 flex gap-4 overflow-hidden">
              <div className="px-4 py-2 rounded-full bg-primary-container/20 text-primary font-medium text-sm">Work-Life Balance</div>
              <div className="px-4 py-2 rounded-full bg-secondary-container/20 text-secondary font-medium text-sm">Async First</div>
              <div className="px-4 py-2 rounded-full bg-tertiary-container/20 text-tertiary font-medium text-sm">Growth Mindset</div>
            </div>
          </div>
          {/* Bento Card 2 */}
          <div className="md:col-span-4 bg-surface-container-lowest rounded-xl p-10 flex flex-col items-center text-center justify-center secondary-gradient text-white">
            <span className="material-symbols-outlined text-6xl mb-6">workspace_premium</span>
            <h3 className="text-2xl font-bold mb-2">100% Free Forever</h3>
            <p className="opacity-90">No hidden fees, no credit card required. Our mission is your happiness.</p>
          </div>
          {/* Bento Card 3 */}
          <div className="md:col-span-4 bg-surface-container-lowest rounded-xl p-10 flex flex-col justify-between border border-outline-variant/10">
            <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
            <div>
              <h3 className="text-xl font-bold mb-2">Verified Companies Only</h3>
              <p className="text-on-surface-variant text-sm">Every listing is vetted for authenticity and culture accuracy.</p>
            </div>
          </div>
          {/* Bento Card 4 */}
          <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-10 flex items-center gap-10 border border-outline-variant/10 overflow-hidden relative">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Insightful Analytics</h3>
              <p className="text-on-surface-variant text-sm">Visualize your career growth and market value in real-time with our smart dashboard.</p>
            </div>
            <div className="w-1/2 translate-x-10">
              <img alt="Analytics View" className="rounded-xl shadow-lg rotate-3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO8hzoE632Tdx7ZbvKYSnCFZCQ4Knx9j1WjEfUfXRtlWXn7SLC6jaDXZPGUCtkdOHcHt83jylhhNHlZXQO8J5nsQKyusKVE5N2NpOKMsz2hb8XLmCT8Htuv0AGclGRsv_Qf7Q0K2hZ7XWkjwsPbQNqncfVYhGZmuXVMPqpXLWDu4453IhoifTa6WP2u_0Q5wwOj90gq2n2mZ8l6CVwNDaho_Zy-OqrWy_G4pfAdEt7EQgKIz6WBPfezhCHz4d895dTDaZhb8Hy0kM"/>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
