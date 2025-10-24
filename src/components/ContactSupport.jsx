import { useState } from 'react'
import { ArrowLeft, Mail, MessageSquare, Send, Check, HelpCircle, Book, Zap, Users } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Textarea, Label } from './SharedUI'
import { supabase } from '../supabaseClient'

// Discord server invite link - update this with your actual Discord invite
const DISCORD_INVITE_URL = 'https://discord.gg/your-server-code' // Replace with your actual Discord invite

export default function ContactSupport({ user, onBack, showToast }) {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: '',
    email: user?.email || ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.subject || !formData.message || !formData.email) {
      showToast('Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      // Save to support_tickets table
      const { error } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: user?.id || null,
          email: formData.email,
          subject: formData.subject,
          category: formData.category,
          message: formData.message,
          status: 'open'
        }])

      if (error) throw error

      setSubmitted(true)
      showToast('Support ticket submitted successfully!')

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          subject: '',
          category: 'general',
          message: '',
          email: user?.email || ''
        })
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      console.error('Error submitting support ticket:', error)
      showToast('Failed to submit ticket. Please email us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0c10] via-[#12141c] to-[#0b0c10] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Button variant="outline" size="sm" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Contact & Support</h1>
          <p className="text-white/60 mt-2">We're here to help! Get in touch with our team.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Contact Form */}
          <Card className="bg-white/5 border-white/10 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Submit a Support Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                    <Check className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Ticket Submitted!</h3>
                  <p className="text-white/70">We'll get back to you as soon as possible.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="general">General Question</option>
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="feature">Feature Request</option>
                      <option value="bug">Bug Report</option>
                      <option value="account">Account Issues</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please provide as much detail as possible..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Quick Links & Info */}
          <div className="space-y-6">
            {/* Discord Server - Primary Support */}
            <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Join Our Discord Server
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/90 mb-4">
                  Get instant support from our community and team! Our Discord server has:
                </p>
                <ul className="text-sm text-white/80 space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>Dedicated support tickets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>Live chat with the community</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>Fastest response times</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>Feature updates & announcements</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-indigo-500 hover:bg-indigo-400"
                  onClick={() => window.open(DISCORD_INVITE_URL, '_blank')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Join Discord Server
                </Button>
              </CardContent>
            </Card>

            {/* Direct Contact */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="w-4 h-4" />
                  Email Us Directly
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/70 mb-3">
                  Prefer email? Reach out directly:
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-white/60">General Support:</p>
                    <a href="mailto:support@ovara.app" className="text-indigo-400 hover:text-indigo-300">
                      support@ovara.app
                    </a>
                  </div>
                  <div>
                    <p className="text-white/60">Billing:</p>
                    <a href="mailto:billing@ovara.app" className="text-indigo-400 hover:text-indigo-300">
                      billing@ovara.app
                    </a>
                  </div>
                  <div>
                    <p className="text-white/60">Privacy:</p>
                    <a href="mailto:privacy@ovara.app" className="text-indigo-400 hover:text-indigo-300">
                      privacy@ovara.app
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="w-4 h-4" />
                  Common Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-white">How do I cancel my subscription?</p>
                    <p className="text-white/60 mt-1">Go to Settings → Subscription and click "Cancel subscription"</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">Can I get a refund?</p>
                    <p className="text-white/60 mt-1">We offer a 7-day money-back guarantee for new subscribers</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">How do I export my essays?</p>
                    <p className="text-white/60 mt-1">Open any essay and click the download button to export as PDF</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="bg-indigo-500/10 border-indigo-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-white">Average Response Time</p>
                    <p className="text-white/70 mt-1">We typically respond within 24 hours on business days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documentation Link */}
        <Card className="bg-white/5 border-white/10 mt-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Book className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Looking for documentation?</p>
                  <p className="text-sm text-white/60 mt-0.5">Check out our help center for guides and tutorials</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => window.open('/docs', '_blank')}>
                View Docs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
