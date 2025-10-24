import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useSecurity } from '../hooks/useSecurity'
import { rateLimiter } from '../utils/rateLimiter'
import { SECURITY_CONFIG } from '../config/security'

/**
 * Security Dashboard Component
 * Displays security status, rate limits, and activity monitoring
 */
function SecurityDashboard({ user, userSubscription, showToast, onBack }) {
  const security = useSecurity(user, userSubscription)
  const [stats, setStats] = useState(null)
  const [systemStats, setSystemStats] = useState(null)

  useEffect(() => {
    if (!user) return

    const updateStats = () => {
      const userStats = rateLimiter.getUserStats(user.id)
      const sysStats = rateLimiter.getSystemStats()
      setStats(userStats)
      setSystemStats(sysStats)
    }

    updateStats()
    const interval = setInterval(updateStats, 2000)

    return () => clearInterval(interval)
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-white/60">Please log in to view security dashboard</p>
        </div>
      </div>
    )
  }

  const tier = userSubscription?.tier?.toLowerCase() || 'free'
  const limits = SECURITY_CONFIG.rateLimits[tier]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            aria-label="Go back"
            className="inline-flex items-center px-4 py-2 text-sm font-medium border border-white/20 text-white hover:bg-white/5 transition rounded-md"
          >
            Back to Control Panel
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Security Dashboard
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Monitor your account security and usage
            </p>
          </div>
        </div>

        {/* Security Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl border bg-white/5 border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{security.isBlocked ? '🚫' : '✅'}</span>
              <div className="text-sm font-semibold text-white/70">Account Status</div>
            </div>
            <div className={`text-2xl font-bold ${security.isBlocked ? 'text-red-400' : 'text-green-400'}`}>
              {security.isBlocked ? 'Blocked' : 'Active'}
            </div>
            {security.isBlocked && (
              <p className="text-xs text-red-300 mt-1">{security.blockReason}</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white/5 border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎯</span>
              <div className="text-sm font-semibold text-white/70">Tier</div>
            </div>
            <div className="text-2xl font-bold text-purple-300 capitalize">{tier}</div>
            <p className="text-xs text-white/50 mt-1">
              {limits.apiCalls} calls/hour
            </p>
          </div>

          <div className="rounded-2xl border bg-white/5 border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📊</span>
              <div className="text-sm font-semibold text-white/70">Usage This Hour</div>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats?.hourCount || 0}
            </div>
            <p className="text-xs text-white/50 mt-1">
              {limits.apiCalls - (stats?.hourCount || 0)} remaining
            </p>
          </div>

          <div className="rounded-2xl border bg-white/5 border-white/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⏱️</span>
              <div className="text-sm font-semibold text-white/70">Rate Limit Reset</div>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats ? Math.ceil((stats.hourResetIn || 0) / 60000) : 0}m
            </div>
            <p className="text-xs text-white/50 mt-1">Until reset</p>
          </div>
        </div>

        {/* Usage Progress */}
        <div className="rounded-2xl border bg-white/5 border-white/10 mb-6">
          <div className="px-6 pt-6">
            <div className="text-lg font-semibold text-indigo-300 mb-4">API Usage</div>
          </div>
          <div className="px-6 pb-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">Hourly Limit</span>
                <span className="text-sm font-semibold text-white">
                  {stats?.hourCount || 0} / {limits.apiCalls}
                </span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    ((stats?.hourCount || 0) / limits.apiCalls) * 100 > 80
                      ? 'bg-red-500'
                      : ((stats?.hourCount || 0) / limits.apiCalls) * 100 > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(((stats?.hourCount || 0) / limits.apiCalls) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">Per Minute</span>
                <span className="text-sm font-semibold text-white">
                  {stats?.minuteCount || 0} / {limits.requestsPerMinute}
                </span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    ((stats?.minuteCount || 0) / limits.requestsPerMinute) * 100 > 80
                      ? 'bg-red-500'
                      : ((stats?.minuteCount || 0) / limits.requestsPerMinute) * 100 > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(((stats?.minuteCount || 0) / limits.requestsPerMinute) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {stats?.history && stats.history.length > 0 && (
          <div className="rounded-2xl border bg-white/5 border-white/10 mb-6">
            <div className="px-6 pt-6">
              <div className="text-lg font-semibold text-indigo-300 mb-4">Recent Activity</div>
            </div>
            <div className="px-6 pb-6">
              <div className="space-y-2">
                {stats.history.slice(-10).reverse().map((item, idx) => {
                  const timeAgo = Math.floor((Date.now() - item.timestamp) / 1000)
                  const display =
                    timeAgo < 60
                      ? `${timeAgo}s ago`
                      : timeAgo < 3600
                      ? `${Math.floor(timeAgo / 60)}m ago`
                      : `${Math.floor(timeAgo / 3600)}h ago`

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-green-400">●</span>
                        <span className="text-sm text-white/80">{item.action || 'API Call'}</span>
                      </div>
                      <span className="text-xs text-white/50">{display}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* System Stats (Admin only - example) */}
        {systemStats && user.email?.endsWith('@ovara.com') && (
          <div className="rounded-2xl border bg-orange-500/10 border-orange-500/20 p-6">
            <div className="text-lg font-semibold text-orange-300 mb-4">
              🔧 System Statistics (Admin)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{systemStats.totalUsers}</div>
                <div className="text-xs text-white/50">Total Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{systemStats.activeUsers}</div>
                <div className="text-xs text-white/50">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{systemStats.blockedUsers}</div>
                <div className="text-xs text-white/50">Blocked Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-300">
                  {systemStats.totalRequests}
                </div>
                <div className="text-xs text-white/50">Total Requests</div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tips */}
        <div className="mt-6 rounded-2xl border bg-indigo-500/10 border-indigo-500/20 p-6">
          <h3 className="font-semibold text-indigo-300 mb-3">🛡️ Security Tips</h3>
          <ul className="text-sm text-white/70 space-y-2">
            <li>• Don't share your account credentials with anyone</li>
            <li>• Log out when using shared computers</li>
            <li>• Monitor your usage for any suspicious activity</li>
            <li>• Report any unusual behavior immediately</li>
            <li>• Keep your password strong and unique</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

SecurityDashboard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string,
  }),
  userSubscription: PropTypes.shape({
    tier: PropTypes.string,
  }),
  showToast: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default SecurityDashboard
