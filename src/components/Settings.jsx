import { useState } from 'react'
import PropTypes from 'prop-types'
import { User, Shield, Settings as SettingsIcon, CreditCard, MessageSquare, Trash2, Sun, Moon } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'

// Reuse UI components
function Button({ className = '', variant, size, disabled, ...props }) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed"
  const variants = {
    default: "bg-indigo-500 hover:bg-indigo-400 text-white",
    secondary: "bg-white text-black hover:bg-white/90",
    outline: "border border-white/20 text-white hover:bg-white/5",
    ghost: "bg-transparent text-white/80 hover:text-white",
  }
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2", lg: "px-5 py-2.5 text-base" }
  const v = variants[variant || "default"]
  const s = sizes[size || "md"]
  return <button disabled={disabled} className={`${base} ${v} ${s} ${className}`} {...props} />
}

function Card({ className = '', ...props }) {
  return <div className={`rounded-2xl border ${className}`} {...props} />
}
function CardHeader({ className = '', ...props }) {
  return <div className={`px-6 pt-6 ${className}`} {...props} />
}
function CardTitle({ className = '', ...props }) {
  return <div className={`text-lg font-semibold ${className}`} {...props} />
}
function CardContent({ className = '', ...props }) {
  return <div className={`px-6 pb-6 ${className}`} {...props} />
}

export default function Settings({
  user,
  userSubscription,
  showToast,
  onBack,
  onNavigate,
  emailNotifications,
  setEmailNotifications,
  discordLink,
  setDiscordLink,
  discordLinkCode,
  setDiscordLinkCode,
  discordLoading,
  setDiscordLoading,
  loadDiscordLink,
}) {
  const [activeTab, setActiveTab] = useState('account')
  const { theme, toggleTheme, isDark } = useTheme()

  const tabs = [
    { id: 'account', name: 'Account', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'preferences', name: 'Preferences', icon: SettingsIcon },
    { id: 'subscription', name: 'Subscription', icon: CreditCard },
    { id: 'discord', name: 'Discord', icon: MessageSquare },
    { id: 'danger', name: 'Danger Zone', icon: Trash2 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0c10] via-[#12141c] to-[#0b0c10] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-white/60 text-sm mt-1">
              Manage your account settings and preferences
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onBack}
            className="border-white/20 text-white hover:bg-white/5"
          >
            Back to Control Panel
          </Button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </div>
                <Button variant="outline" className="mt-2">
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Current Password</label>
                  <input
                    type="password"
                    className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">New Password</label>
                  <input
                    type="password"
                    className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </div>
                <Button variant="outline" className="mt-2">
                  Change Password
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-white/60">Receive updates about your account</div>
                  </div>
                  <button
                    onClick={() => {
                      setEmailNotifications(!emailNotifications)
                      showToast(emailNotifications ? 'Email notifications disabled' : 'Email notifications enabled')
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      emailNotifications ? 'bg-indigo-500' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-500" />}
                      {isDark ? 'Dark Mode' : 'Light Mode'}
                    </div>
                    <div className="text-sm text-white/60">Toggle between light and dark theme</div>
                  </div>
                  <button
                    onClick={() => {
                      toggleTheme()
                      showToast(isDark ? 'Switched to light mode' : 'Switched to dark mode')
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      isDark ? 'bg-indigo-500' : 'bg-yellow-500'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        isDark ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="pt-2">
                  <label className="block text-sm text-white/70 mb-1">Language</label>
                  <select className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400">
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      Current Plan:{' '}
                      <span
                        className={
                          userSubscription?.tier === 'premium'
                            ? 'text-purple-400'
                            : userSubscription?.tier === 'pro'
                            ? 'text-indigo-400'
                            : 'text-emerald-400'
                        }
                      >
                        {userSubscription?.tier
                          ? userSubscription.tier.charAt(0).toUpperCase() + userSubscription.tier.slice(1)
                          : 'Loading...'}
                      </span>
                    </div>
                    <div className="text-sm text-white/60">
                      {userSubscription
                        ? `You are currently on the ${
                            userSubscription.tier.charAt(0).toUpperCase() + userSubscription.tier.slice(1)
                          } plan`
                        : 'Loading subscription...'}
                    </div>
                    {userSubscription && (
                      <div className="text-xs text-white/50 mt-1">
                        Status:{' '}
                        <span className={userSubscription.status === 'active' ? 'text-emerald-400' : 'text-yellow-400'}>
                          {userSubscription.status}
                        </span>
                      </div>
                    )}
                    {/* Cancel Subscription - Subtle link below status */}
                    {userSubscription &&
                     userSubscription.tier !== 'free' &&
                     userSubscription.status === 'active' &&
                     userSubscription.stripe_subscription_id && (
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
                            try {
                              showToast('Processing cancellation...')

                              // Get the current session
                              const { data: { session } } = await supabase.auth.getSession()

                              // Call the cancel-subscription Edge Function
                              const response = await fetch(
                                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`,
                                {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${session?.access_token}`,
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    subscriptionId: userSubscription.stripe_subscription_id,
                                  }),
                                }
                              )

                              const result = await response.json()

                              if (response.ok) {
                                showToast('Subscription canceled successfully')
                                // Reload the page to reflect changes
                                setTimeout(() => window.location.reload(), 1500)
                              } else {
                                showToast(result.error || 'Failed to cancel subscription. Please contact support.')
                              }
                            } catch (error) {
                              console.error('Error canceling subscription:', error)
                              showToast('An error occurred. Please contact support.')
                            }
                          }
                        }}
                        className="text-xs text-white/30 hover:text-white/50 transition-colors underline decoration-white/20 hover:decoration-white/40 mt-2"
                      >
                        Cancel subscription
                      </button>
                    )}
                  </div>
                  <Button onClick={() => onNavigate('pricing')}>Upgrade Plan</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Discord Tab */}
          {activeTab === 'discord' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>Discord Integration</CardTitle>
              </CardHeader>
              <CardContent>
                {discordLink ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-emerald-400">✓ Discord Linked</div>
                        <div className="text-sm text-white/60 mt-1">Connected as: {discordLink.discord_username}</div>
                        <div className="text-xs text-white/50 mt-1">
                          Linked on {new Date(discordLink.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-950/30"
                        onClick={async () => {
                          if (confirm('Are you sure you want to unlink your Discord account?')) {
                            setDiscordLoading(true)
                            const { error } = await supabase.from('discord_links').delete().eq('user_id', user.id)

                            setDiscordLoading(false)

                            if (error) {
                              showToast('Failed to unlink Discord account')
                            } else {
                              setDiscordLink(null)
                              showToast('Discord account unlinked')
                            }
                          }
                        }}
                        disabled={discordLoading}
                      >
                        {discordLoading ? 'Unlinking...' : 'Unlink'}
                      </Button>
                    </div>
                    <p className="text-xs text-white/60">
                      Your Discord roles are automatically synced based on your subscription tier.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-white/70">
                      Link your Discord account to get automatic role assignment based on your subscription tier.
                    </p>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">
                        Discord Link Code
                        <span className="text-white/50 text-xs ml-2">(Get this from Discord with /link)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discordLinkCode}
                          onChange={(e) => setDiscordLinkCode(e.target.value.toUpperCase())}
                          placeholder="Enter 8-character code"
                          maxLength={8}
                          className="flex-1 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400 uppercase"
                        />
                        <Button
                          onClick={async () => {
                            if (!discordLinkCode || discordLinkCode.length !== 8) {
                              showToast('Please enter a valid 8-character code')
                              return
                            }

                            setDiscordLoading(true)

                            try {
                              const { data: codeData, error: codeError } = await supabase
                                .from('discord_link_codes')
                                .select('*')
                                .eq('code', discordLinkCode)
                                .eq('used', false)
                                .gt('expires_at', new Date().toISOString())
                                .single()

                              if (codeError || !codeData) {
                                showToast('Invalid or expired code')
                                setDiscordLoading(false)
                                return
                              }

                              const { error: linkError } = await supabase.from('discord_links').insert({
                                user_id: user.id,
                                discord_id: codeData.discord_id,
                                discord_username: codeData.discord_username,
                                user_email: user.email,
                              })

                              if (linkError) {
                                if (linkError.code === '23505') {
                                  showToast('This Discord account is already linked to another user')
                                } else {
                                  showToast('Failed to link Discord account')
                                }
                                setDiscordLoading(false)
                                return
                              }

                              await supabase.from('discord_link_codes').update({ used: true }).eq('code', discordLinkCode)

                              await loadDiscordLink()

                              setDiscordLinkCode('')
                              showToast('Discord account linked successfully!')
                            } catch (error) {
                              console.error('Error linking Discord:', error)
                              showToast('An error occurred')
                            }

                            setDiscordLoading(false)
                          }}
                          disabled={discordLoading || !discordLinkCode || discordLinkCode.length !== 8}
                        >
                          {discordLoading ? 'Linking...' : 'Link Account'}
                        </Button>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-sm font-medium text-white/90 mb-2">How to link:</p>
                      <ol className="text-xs text-white/70 space-y-1 list-decimal list-inside">
                        <li>Join our Discord server</li>
                        <li>
                          Use the <code className="bg-black/40 px-1 py-0.5 rounded">/link</code> command
                        </li>
                        <li>Copy the 8-character code</li>
                        <li>Paste it here and click "Link Account"</li>
                      </ol>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/70 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-950/30"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      showToast('Account deletion requested. Please contact support.')
                    }
                  }}
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

Settings.propTypes = {
  user: PropTypes.object,
  userSubscription: PropTypes.object,
  showToast: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  emailNotifications: PropTypes.bool.isRequired,
  setEmailNotifications: PropTypes.func.isRequired,
  discordLink: PropTypes.object,
  setDiscordLink: PropTypes.func.isRequired,
  discordLinkCode: PropTypes.string.isRequired,
  setDiscordLinkCode: PropTypes.func.isRequired,
  discordLoading: PropTypes.bool.isRequired,
  setDiscordLoading: PropTypes.func.isRequired,
  loadDiscordLink: PropTypes.func.isRequired,
}
