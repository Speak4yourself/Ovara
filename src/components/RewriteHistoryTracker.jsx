import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { supabase } from '../supabaseClient'

function RewriteHistoryTracker({ user, userSubscription, showToast, onBack }) {
  const [rewriteHistory, setRewriteHistory] = useState([])
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [comparisonMode, setComparisonMode] = useState('side-by-side') // 'side-by-side' or 'inline'
  const [showDiffOnly, setShowDiffOnly] = useState(false)

  useEffect(() => {
    if (user) {
      loadHistory()
    }
  }, [user])

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && onBack) {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onBack])

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('rewrite_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRewriteHistory(data || [])
    } catch (error) {
      console.error('Error loading rewrite history:', error)
      showToast('Failed to load rewrite history')
    }
  }

  const deleteRewrite = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rewrite from your history? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('rewrite_history')
        .delete()
        .eq('id', id)

      if (error) throw error
      showToast('Rewrite deleted from history')
      loadHistory()
      if (selectedVersion?.id === id) {
        setSelectedVersion(null)
      }
    } catch (error) {
      console.error('Error deleting rewrite:', error)
      showToast('Failed to delete rewrite')
    }
  }

  const getDiff = (original, rewritten) => {
    // Optimized word-based diff algorithm using Longest Common Subsequence (LCS)
    const originalWords = original.split(/(\s+)/)
    const rewrittenWords = rewritten.split(/(\s+)/)

    // Create a Set for quick lookups
    const originalSet = new Set(originalWords)
    const rewrittenSet = new Set(rewrittenWords)

    // LCS-based diff algorithm (optimized with memoization)
    const lcs = []
    const m = originalWords.length
    const n = rewrittenWords.length

    // Only use LCS for reasonably sized inputs to avoid performance issues
    if (m * n > 10000) {
      // Fall back to simple greedy algorithm for very large texts
      return simpleGreedyDiff(originalWords, rewrittenWords)
    }

    // Build LCS table (space-optimized)
    const dp = Array(2).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 1; i <= m; i++) {
      const curr = i % 2
      const prev = 1 - curr
      for (let j = 1; j <= n; j++) {
        if (originalWords[i - 1] === rewrittenWords[j - 1]) {
          dp[curr][j] = dp[prev][j - 1] + 1
        } else {
          dp[curr][j] = Math.max(dp[prev][j], dp[curr][j - 1])
        }
      }
    }

    // Build diff from LCS
    const diff = []
    let i = 0, j = 0

    while (i < m || j < n) {
      if (i < m && j < n && originalWords[i] === rewrittenWords[j]) {
        diff.push({ type: 'unchanged', text: originalWords[i] })
        i++
        j++
      } else if (j < n && (i >= m || dp[(i+1) % 2][j + 1] > dp[i % 2][j])) {
        diff.push({ type: 'added', text: rewrittenWords[j] })
        j++
      } else {
        diff.push({ type: 'removed', text: originalWords[i] })
        i++
      }
    }

    return diff
  }

  // Simple greedy diff for very large texts
  const simpleGreedyDiff = (originalWords, rewrittenWords) => {
    const diff = []
    const maxLen = Math.max(originalWords.length, rewrittenWords.length)

    for (let i = 0; i < maxLen; i++) {
      if (i >= originalWords.length) {
        diff.push({ type: 'added', text: rewrittenWords[i] })
      } else if (i >= rewrittenWords.length) {
        diff.push({ type: 'removed', text: originalWords[i] })
      } else if (originalWords[i] === rewrittenWords[i]) {
        diff.push({ type: 'unchanged', text: originalWords[i] })
      } else {
        diff.push({ type: 'removed', text: originalWords[i] })
        diff.push({ type: 'added', text: rewrittenWords[i] })
      }
    }

    return diff
  }

  const renderDiff = (diff) => {
    return diff.map((item, index) => {
      if (showDiffOnly && item.type === 'unchanged') return null

      let className = ''
      if (item.type === 'added') {
        className = 'bg-green-500/20 text-green-300 border-b-2 border-green-500'
      } else if (item.type === 'removed') {
        className = 'bg-red-500/20 text-red-300 border-b-2 border-red-500 line-through'
      } else {
        className = 'text-white/80'
      }

      return (
        <span key={index} className={className}>
          {item.text}
        </span>
      )
    })
  }

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
    showToast('Text copied to clipboard!')
  }

  const downloadComparison = () => {
    if (!selectedVersion) return

    const diff = getDiff(selectedVersion.original_text, selectedVersion.rewritten_text)
    let content = `AI Rewrite History Comparison\n`
    content += `Date: ${new Date(selectedVersion.created_at).toLocaleString()}\n`
    content += `Rewrite Type: ${selectedVersion.rewrite_type || 'Unknown'}\n\n`
    content += `=== ORIGINAL TEXT ===\n${selectedVersion.original_text}\n\n`
    content += `=== REWRITTEN TEXT ===\n${selectedVersion.rewritten_text}\n\n`
    content += `=== CHANGES ===\n`
    diff.forEach(item => {
      if (item.type === 'added') content += `[+] ${item.text}`
      else if (item.type === 'removed') content += `[-] ${item.text}`
    })

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rewrite-comparison-${new Date().getTime()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Comparison downloaded!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0c10] via-[#12141c] to-[#0b0c10] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            aria-label="Go back to Control Panel"
            className="inline-flex items-center px-4 py-2 text-sm font-medium border border-white/20 text-white hover:bg-white/5 transition rounded-md"
          >
            Back to Control Panel
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              AI Rewrite History Tracker
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Compare your original text vs. multiple rewrites with color-coded changes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* History List */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border bg-white/5 border-white/10 h-full">
              <div className="px-6 pt-6">
                <div className="text-lg font-semibold text-indigo-300 flex items-center gap-2">
                  📝 Rewrite History
                </div>
              </div>
              <div className="px-6 pb-6">
                {rewriteHistory.length === 0 ? (
                  <p className="text-white/50 text-sm text-center py-8">
                    No rewrite history yet. Use the Humanizer to create rewrites!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto mt-4">
                    {rewriteHistory.map((version) => (
                      <div
                        key={version.id}
                        className={`p-3 rounded-lg border transition cursor-pointer ${
                          selectedVersion?.id === version.id
                            ? 'bg-purple-500/20 border-purple-500'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                        onClick={() => setSelectedVersion(version)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/50">
                              {new Date(version.created_at).toLocaleDateString()} {new Date(version.created_at).toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-white/80 mt-1 truncate">
                              {version.rewrite_type || 'Rewrite'}
                            </p>
                            <p className="text-xs text-white/40 mt-1 line-clamp-2">
                              {version.original_text.substring(0, 80)}...
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteRewrite(version.id)
                            }}
                            aria-label="Delete this rewrite from history"
                            className="text-red-400 hover:text-red-300 p-1 h-auto text-xs"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comparison View */}
          <div className="lg:col-span-2">
            {!selectedVersion ? (
              <div className="rounded-2xl border bg-white/5 border-white/10 h-full">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🔀</div>
                    <p className="text-white/50">
                      Select a rewrite from history to compare changes
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Comparison Controls */}
                <div className="rounded-2xl border bg-white/5 border-white/10">
                  <div className="px-6 py-6">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-white/70">View:</label>
                        <select
                          value={comparisonMode}
                          onChange={(e) => setComparisonMode(e.target.value)}
                          className="w-40 rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                        >
                          <option value="side-by-side">Side by Side</option>
                          <option value="inline">Inline Diff</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showDiffOnly}
                          onChange={(e) => setShowDiffOnly(e.target.checked)}
                          className="rounded accent-indigo-500"
                        />
                        Show changes only
                      </label>

                      <div className="ml-auto flex gap-2">
                        <button
                          onClick={() => copyText(selectedVersion.rewritten_text)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium border border-white/10 rounded-md text-white hover:bg-white/5 transition"
                        >
                          📋 Copy Rewrite
                        </button>
                        <button
                          onClick={downloadComparison}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium border border-white/10 rounded-md text-white hover:bg-white/5 transition"
                        >
                          💾 Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison Display */}
                {comparisonMode === 'side-by-side' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border bg-white/5 border-white/10">
                      <div className="px-6 pt-6">
                        <div className="text-sm font-semibold text-red-300">Original Text</div>
                      </div>
                      <div className="px-6 pb-6">
                        <div className="p-4 bg-black/20 rounded-lg min-h-[400px] max-h-[600px] overflow-y-auto">
                          <p className="text-white/80 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                            {selectedVersion.original_text}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-white/5 border-white/10">
                      <div className="px-6 pt-6">
                        <div className="text-sm font-semibold text-green-300">Rewritten Text</div>
                      </div>
                      <div className="px-6 pb-6">
                        <div className="p-4 bg-black/20 rounded-lg min-h-[400px] max-h-[600px] overflow-y-auto">
                          <p className="text-white/80 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                            {selectedVersion.rewritten_text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border bg-white/5 border-white/10">
                    <div className="px-6 pt-6">
                      <div className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                        🔀 Inline Diff View
                      </div>
                      <div className="flex gap-4 text-xs mt-2">
                        <span className="text-green-300">
                          <span className="inline-block w-3 h-3 bg-green-500/20 border-b-2 border-green-500 mr-1"></span>
                          Added
                        </span>
                        <span className="text-red-300">
                          <span className="inline-block w-3 h-3 bg-red-500/20 border-b-2 border-red-500 mr-1"></span>
                          Removed
                        </span>
                      </div>
                    </div>
                    <div className="px-6 pb-6">
                      <div className="p-4 bg-black/20 rounded-lg min-h-[400px] max-h-[600px] overflow-y-auto">
                        <p className="text-white/80 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                          {renderDiff(getDiff(selectedVersion.original_text, selectedVersion.rewritten_text))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div className="rounded-2xl border bg-white/5 border-white/10">
                  <div className="px-6 py-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {selectedVersion.original_text.split(/\s+/).length}
                        </p>
                        <p className="text-xs text-white/50">Original Words</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {selectedVersion.rewritten_text.split(/\s+/).length}
                        </p>
                        <p className="text-xs text-white/50">Rewritten Words</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-300">
                          {getDiff(selectedVersion.original_text, selectedVersion.rewritten_text).filter(d => d.type !== 'unchanged').length}
                        </p>
                        <p className="text-xs text-white/50">Total Changes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

RewriteHistoryTracker.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
  userSubscription: PropTypes.shape({
    tier: PropTypes.string,
  }),
  showToast: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default RewriteHistoryTracker
