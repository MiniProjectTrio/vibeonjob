import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function TermsPage() {
  return (
    <>
      <NavBar />
      <main className="pt-12 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <h1 className="font-headline text-4xl font-extrabold text-on-surface mb-4">Terms of Service</h1>
            <p className="text-on-surface-variant">Last updated: April 15, 2026</p>
          </div>

          <div className="prose-content space-y-8">
            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing or using VibeOnJob ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">2. Description of Service</h2>
              <p className="text-slate-600 leading-relaxed">
                VibeOnJob is a free AI-powered resume analysis platform that helps job seekers optimize their resumes for specific job descriptions. Our services include:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-600">
                <li>Resume gap analysis using NLP and machine learning</li>
                <li>ATS (Applicant Tracking System) score calculation</li>
                <li>Skill gap identification and prioritization</li>
                <li>Learning resource recommendations</li>
                <li>ATS-optimized resume generation</li>
              </ul>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">3. User Accounts</h2>
              <p className="text-slate-600 leading-relaxed">
                You must create an account to use the Service. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information during registration.
              </p>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">4. Free Service</h2>
              <p className="text-slate-600 leading-relaxed">
                VibeOnJob is 100% free to use. We do not charge any fees for our analysis, resume generation, or any other features. There are no premium tiers, hidden costs, or subscription fees.
              </p>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">5. Acceptable Use</h2>
              <p className="text-slate-600 leading-relaxed">You agree not to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-600">
                <li>Use the Service for any unlawful purpose</li>
                <li>Upload malicious files or content</li>
                <li>Attempt to access other users' accounts or data</li>
                <li>Overwhelm the Service with automated requests</li>
                <li>Misrepresent yourself or your qualifications based on generated content</li>
              </ul>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">6. Intellectual Property</h2>
              <p className="text-slate-600 leading-relaxed">
                You retain all rights to your uploaded resumes and job descriptions. Analysis results and generated resumes are provided for your personal use. The VibeOnJob platform, brand, and technology remain our intellectual property.
              </p>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">7. Disclaimer</h2>
              <p className="text-slate-600 leading-relaxed">
                VibeOnJob provides AI-generated career advice and resume suggestions. While we strive for accuracy, we do not guarantee that following our suggestions will result in job offers. The Service is provided "as is" without warranties of any kind. AI-generated content should be reviewed and verified before use.
              </p>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">8. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed">
                VibeOnJob shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">9. Changes to Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the modified terms. We will provide notice of significant changes via the platform or email.
              </p>
            </section>

            <section>
              <h2 className="font-headline text-2xl font-bold text-slate-900 mb-3">10. Contact</h2>
              <p className="text-slate-600 leading-relaxed">
                For questions about these Terms of Service, please contact us at <a href="mailto:legal@vibeonjob.com" className="text-blue-600 hover:underline">legal@vibeonjob.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
