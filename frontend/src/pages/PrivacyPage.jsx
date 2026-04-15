import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function PrivacyPage() {
  return (
    <>
      <NavBar />
      <main className="pt-12 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <h1 className="font-headline text-4xl font-extrabold text-on-surface mb-4">Privacy Policy</h1>
            <p className="text-on-surface-variant">Last updated: April 15, 2026</p>
          </div>

          <div className="prose-content space-y-8">
            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
              <p className="text-slate-600 leading-relaxed">
                When you use VibeOnJob, we collect minimal information necessary to provide our services:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-600">
                <li><strong>Account Information:</strong> Your email address and name when you register.</li>
                <li><strong>Resume Data:</strong> Resume files you upload are processed for analysis. Files are stored securely and associated with your account.</li>
                <li><strong>Job Descriptions:</strong> Text you paste for comparison is used only for analysis and is not shared with third parties.</li>
                <li><strong>Usage Data:</strong> We track analysis counts and feature usage to improve our service.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
              <p className="text-slate-600 leading-relaxed">
                Your data is used exclusively to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-600">
                <li>Perform resume gap analysis against job descriptions</li>
                <li>Generate ATS-friendly resume suggestions</li>
                <li>Provide personalized learning recommendations</li>
                <li>Maintain your analysis history for future reference</li>
                <li>Improve our AI analysis algorithms</li>
              </ul>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">3. Data Security</h2>
              <p className="text-slate-600 leading-relaxed">
                We implement industry-standard security measures to protect your data. All data in transit is encrypted using TLS. Passwords are hashed using bcrypt with SHA-256 pre-hashing. Database connections use SSL encryption.
              </p>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">4. Third-Party Services</h2>
              <p className="text-slate-600 leading-relaxed">
                We use Google Gemini AI for generating analysis insights. Resume text excerpts (not the full file) are sent to Google's API for processing.
                We use Neon Postgres for secure database hosting. No data is sold to advertisers or marketing companies.
              </p>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">5. Data Retention</h2>
              <p className="text-slate-600 leading-relaxed">
                Your uploaded resumes and analysis results are retained as long as your account is active. You may request deletion of your data at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">6. Your Rights</h2>
              <p className="text-slate-600 leading-relaxed">
                You have the right to access, correct, or delete your personal data. You may also request a copy of all data we hold about you. Contact us at <a href="mailto:privacy@vibeonjob.com" className="text-blue-600 hover:underline">privacy@vibeonjob.com</a> to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">7. Changes to This Policy</h2>
              <p className="text-slate-600 leading-relaxed">
                We may update this privacy policy from time to time. We will notify registered users of any significant changes via email. Continued use of the service after changes constitutes acceptance of the updated policy.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
