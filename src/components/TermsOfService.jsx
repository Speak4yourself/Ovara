import { ArrowLeft, FileText, Shield, Scale } from 'lucide-react'
import { Button } from './SharedUI'

export default function TermsOfService({ onBack }) {
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
            <div className="p-3 rounded-xl bg-indigo-500/20">
              <FileText className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
              <p className="text-white/60 text-sm mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <Section title="1. Acceptance of Terms" icon={<Scale className="w-5 h-5" />}>
            <p>By accessing and using Ovara ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, please do not use our Service.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>Ovara provides AI-powered essay writing tools, including but not limited to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>AI content detection</li>
              <li>Essay humanization</li>
              <li>Citation generation</li>
              <li>Essay generation and analysis</li>
              <li>Writing assistance tools</li>
            </ul>
          </Section>

          <Section title="3. User Accounts">
            <p>To use certain features of the Service, you must register for an account. You agree to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your password</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Submit malicious code or harmful content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the Service for academic dishonesty</li>
              <li>Resell or redistribute our Service without permission</li>
            </ul>
          </Section>

          <Section title="5. Subscription and Payment">
            <p>Certain features require a paid subscription. By subscribing, you agree to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Pay all fees associated with your subscription tier</li>
              <li>Automatic renewal unless you cancel</li>
              <li>No refunds for partial subscription periods</li>
              <li>Price changes with 30 days notice</li>
            </ul>
          </Section>

          <Section title="6. Cancellation and Refunds">
            <p>You may cancel your subscription at any time from your account settings. Cancellations take effect at the end of the current billing period. We offer a 7-day money-back guarantee for first-time subscribers.</p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>The Service and its original content (excluding user-generated content) are owned by Ovara and are protected by copyright, trademark, and other intellectual property laws.</p>
            <p className="mt-2">You retain all rights to the content you create using our Service, but you grant us a limited license to use, store, and process your content to provide the Service.</p>
          </Section>

          <Section title="8. AI-Generated Content">
            <p>Our Service uses artificial intelligence to generate and analyze content. You acknowledge that:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>AI-generated content may not be 100% accurate</li>
              <li>You are responsible for verifying and editing all generated content</li>
              <li>We do not guarantee plagiarism-free content</li>
              <li>You must comply with your institution's academic integrity policies</li>
            </ul>
          </Section>

          <Section title="9. Privacy and Data">
            <p>Your use of the Service is also governed by our Privacy Policy. We collect and use data as described in that policy.</p>
          </Section>

          <Section title="10. Disclaimers">
            <p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</p>
            <p className="mt-2">We do not warrant that the Service will be uninterrupted, error-free, or completely secure.</p>
          </Section>

          <Section title="11. Limitation of Liability">
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, OVARA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.</p>
            <p className="mt-2">Our total liability shall not exceed the amount you paid us in the 12 months before the claim.</p>
          </Section>

          <Section title="12. Indemnification">
            <p>You agree to indemnify and hold Ovara harmless from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.</p>
          </Section>

          <Section title="13. Termination">
            <p>We reserve the right to suspend or terminate your account at any time for violations of these Terms or for any other reason at our discretion.</p>
          </Section>

          <Section title="14. Changes to Terms">
            <p>We may modify these Terms at any time. We will notify you of material changes via email or through the Service. Continued use after changes constitutes acceptance.</p>
          </Section>

          <Section title="15. Governing Law">
            <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions.</p>
          </Section>

          <Section title="16. Contact Us">
            <p>If you have questions about these Terms, please contact us at:</p>
            <p className="mt-2 text-indigo-400">support@ovara.app</p>
          </Section>
        </div>

        {/* Agreement Footer */}
        <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
          <p className="text-sm text-white/80 text-center">
            By using Ovara, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
