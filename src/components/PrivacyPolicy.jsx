import { ArrowLeft, Shield, Eye, Lock, Database, Users, Bell } from 'lucide-react'
import { Button } from './SharedUI'

export default function PrivacyPolicy({ onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0c10] via-[#12141c] to-[#0b0c10] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Button variant="outline" size="sm" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
              <p className="text-white/60 text-sm mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <Section title="1. Introduction" icon={<Eye className="w-5 h-5" />}>
            <p>At Ovara, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.</p>
            <p className="mt-2">By using Ovara, you agree to the collection and use of information in accordance with this policy.</p>
          </Section>

          <Section title="2. Information We Collect" icon={<Database className="w-5 h-5" />}>
            <h3 className="font-semibold text-white mt-3">Personal Information</h3>
            <p>We collect information that you provide directly to us:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Name and email address (for account creation)</li>
              <li>Payment information (processed securely via Stripe)</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3 className="font-semibold text-white mt-3">Content Information</h3>
            <p>We collect content you create or upload:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Essays and documents you submit for analysis</li>
              <li>Generated content from our AI tools</li>
              <li>Saved essays and citations</li>
            </ul>

            <h3 className="font-semibold text-white mt-3">Usage Information</h3>
            <p>We automatically collect certain information:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Device information and IP address</li>
              <li>Browser type and version</li>
              <li>Usage patterns and feature interactions</li>
              <li>Performance data and error logs</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information" icon={<Users className="w-5 h-5" />}>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Provide, maintain, and improve our Service</li>
              <li>Process your transactions and manage subscriptions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="4. AI Processing" icon={<Lock className="w-5 h-5" />}>
            <p>When you use our AI-powered features:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Your content is processed by third-party AI providers (OpenAI, Anthropic)</li>
              <li>We do not use your content to train AI models</li>
              <li>Content is encrypted in transit and at rest</li>
              <li>We retain content only as long as necessary to provide the Service</li>
            </ul>
          </Section>

          <Section title="5. Information Sharing">
            <p>We do not sell your personal information. We may share your information with:</p>

            <h3 className="font-semibold text-white mt-3">Service Providers</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Supabase (hosting and database)</li>
              <li>Stripe (payment processing)</li>
              <li>OpenAI and Anthropic (AI processing)</li>
              <li>Email service providers</li>
            </ul>

            <h3 className="font-semibold text-white mt-3">Legal Requirements</h3>
            <p className="mt-2">We may disclose your information if required by law or if we believe it's necessary to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Comply with legal obligations</li>
              <li>Protect our rights and property</li>
              <li>Prevent fraud or abuse</li>
              <li>Protect the safety of users</li>
            </ul>
          </Section>

          <Section title="6. Data Security">
            <p>We implement appropriate security measures to protect your information:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Encryption of data in transit (SSL/TLS)</li>
              <li>Encryption of data at rest</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
              <li>Secure payment processing (PCI-DSS compliant)</li>
            </ul>
            <p className="mt-2 text-yellow-400/80 text-sm">However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.</p>
          </Section>

          <Section title="7. Data Retention">
            <p>We retain your information for as long as your account is active or as needed to provide services. We will delete your data:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>When you delete your account</li>
              <li>After 90 days of account inactivity (with notice)</li>
              <li>When no longer needed for legal or business purposes</li>
            </ul>
          </Section>

          <Section title="8. Your Rights" icon={<Shield className="w-5 h-5" />}>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Correction:</strong> Update inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Export your data in a common format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing emails</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at privacy@ovara.app</p>
          </Section>

          <Section title="9. Cookies and Tracking">
            <p>We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze usage patterns</li>
              <li>Improve user experience</li>
            </ul>
            <p className="mt-2">You can control cookies through your browser settings.</p>
          </Section>

          <Section title="10. Children's Privacy">
            <p>Our Service is not intended for children under 13 years of age. We do not knowingly collect information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.</p>
          </Section>

          <Section title="11. International Users">
            <p>Your information may be transferred to and processed in the United States. By using our Service, you consent to the transfer of your information to countries outside your country of residence.</p>
          </Section>

          <Section title="12. Third-Party Links">
            <p>Our Service may contain links to third-party websites. We are not responsible for the privacy practices of these websites. We encourage you to review their privacy policies.</p>
          </Section>

          <Section title="13. Email Communications" icon={<Bell className="w-5 h-5" />}>
            <p>We may send you:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Account and service notifications (required)</li>
              <li>Usage limit warnings (required)</li>
              <li>Product updates and features (optional)</li>
              <li>Marketing communications (optional)</li>
            </ul>
            <p className="mt-2">You can opt out of optional emails in your account settings.</p>
          </Section>

          <Section title="14. FERPA Compliance">
            <p>For educational institutions, we comply with the Family Educational Rights and Privacy Act (FERPA) when applicable. Student data is handled with appropriate safeguards.</p>
          </Section>

          <Section title="15. GDPR Compliance">
            <p>For EU users, we comply with the General Data Protection Regulation (GDPR). You have additional rights under GDPR, including the right to lodge a complaint with a supervisory authority.</p>
          </Section>

          <Section title="16. California Privacy Rights">
            <p>California residents have specific rights under the California Consumer Privacy Act (CCPA), including the right to know what information we collect and the right to deletion.</p>
          </Section>

          <Section title="17. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or through a prominent notice on our Service.</p>
            <p className="mt-2">Your continued use after changes indicates acceptance of the updated policy.</p>
          </Section>

          <Section title="18. Contact Us">
            <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
            <div className="mt-3 space-y-1">
              <p className="text-indigo-400">Email: privacy@ovara.app</p>
              <p className="text-indigo-400">Support: support@ovara.app</p>
            </div>
          </Section>
        </div>

        {/* Important Notice */}
        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-sm text-white/80 text-center">
            <strong>Your Privacy Matters.</strong> We are committed to protecting your data and being transparent about our practices.
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="text-white/80 space-y-2 leading-relaxed">
        {children}
      </div>
    </div>
  )
}
