import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { supabase } from '../supabaseClient'

function ArgumentHeatmap({ user, userSubscription, showToast, onBack }) {
  const [essayText, setEssayText] = useState('')
  const [heatmap, setHeatmap] = useState(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('heatmap') // 'heatmap' or 'analysis'

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && onBack) {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onBack])

  const generateHeatmap = async () => {
    if (!essayText.trim()) {
      showToast('Please enter your essay text')
      return
    }

    if (!user) {
      showToast('Please log in to use Argument Heatmap')
      return
    }

    setLoading(true)

    try {
      const { data: session } = await supabase.auth.getSession()

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/argument-heatmap`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          essayText: essayText,
          tier: userSubscription?.tier?.toLowerCase() || 'free',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to generate heatmap')
      }

      const data = await response.json()
      setHeatmap(data.heatmap)
      showToast('Heatmap generated successfully!')
    } catch (error) {
      console.error('Error generating heatmap:', error)
      showToast(error.message || 'Failed to generate heatmap. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStrengthColor = (strength) => {
    if (strength >= 80) return 'bg-green-500/40 border-green-500'
    if (strength >= 60) return 'bg-lime-500/40 border-lime-500'
    if (strength >= 40) return 'bg-yellow-500/40 border-yellow-500'
    if (strength >= 20) return 'bg-orange-500/40 border-orange-500'
    return 'bg-red-500/40 border-red-500'
  }

  const getStrengthLabel = (strength) => {
    if (strength >= 80) return 'Very Strong'
    if (strength >= 60) return 'Strong'
    if (strength >= 40) return 'Moderate'
    if (strength >= 20) return 'Weak'
    return 'Very Weak'
  }

  const reset = () => {
    setHeatmap(null)
    setView('heatmap')
  }

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0c10] via-[#12141c] to-[#0b0c10] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center px-4 py-2 text-sm font-medium border border-white/20 text-white hover:bg-white/5 transition rounded-md"
          >
            Back to Control Panel
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Argument Heatmap
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Visualize argument strength throughout your essay with color-coded analysis
            </p>
          </div>
        </div>

        {!heatmap ? (
          <div className="space-y-6">
            {/* Essay Input */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 pt-6">
                <div className="text-lg font-semibold text-indigo-300 mb-4">Your Essay</div>
              </div>
              <div className="px-6 pb-6">
                <textarea
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  placeholder="Paste your essay here to analyze argument strength..."
                  className="w-full h-96 rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-indigo-400 resize-none font-mono text-sm leading-relaxed"
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-white/50">
                    {getWordCount(essayText)} words
                  </div>
                  <button
                    onClick={generateHeatmap}
                    disabled={loading || !essayText.trim()}
                    className="inline-flex items-center px-6 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '🔄 Analyzing...' : '🔥 Generate Heatmap'}
                  </button>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-2xl border bg-indigo-500/10 border-indigo-500/20 p-6">
              <h3 className="font-semibold text-indigo-300 mb-2">🎯 What is an Argument Heatmap?</h3>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• <span className="text-green-400">Green</span> - Very strong arguments with solid evidence</li>
                <li>• <span className="text-lime-400">Light Green</span> - Strong arguments, well-supported</li>
                <li>• <span className="text-yellow-400">Yellow</span> - Moderate arguments, could be stronger</li>
                <li>• <span className="text-orange-400">Orange</span> - Weak arguments, need more support</li>
                <li>• <span className="text-red-400">Red</span> - Very weak or unsupported claims</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* View Toggle */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setView('heatmap')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      view === 'heatmap'
                        ? 'bg-indigo-500/20 border border-indigo-500 text-white'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    🔥 Heatmap View
                  </button>
                  <button
                    onClick={() => setView('analysis')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      view === 'analysis'
                        ? 'bg-indigo-500/20 border border-indigo-500 text-white'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    📊 Analysis View
                  </button>
                  <button
                    onClick={reset}
                    className="ml-auto inline-flex items-center px-4 py-2 text-sm font-medium border border-white/10 rounded-md text-white hover:bg-white/5 transition"
                  >
                    🔄 Analyze New Essay
                  </button>
                </div>
              </div>
            </div>

            {view === 'heatmap' ? (
              <>
                {/* Color Legend */}
                <div className="rounded-2xl border bg-white/5 border-white/10">
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <span className="text-white/70 font-medium">Strength:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500/40 border border-green-500"></div>
                        <span className="text-white/60">Very Strong</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-lime-500/40 border border-lime-500"></div>
                        <span className="text-white/60">Strong</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-500/40 border border-yellow-500"></div>
                        <span className="text-white/60">Moderate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-500/40 border border-orange-500"></div>
                        <span className="text-white/60">Weak</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500/40 border border-red-500"></div>
                        <span className="text-white/60">Very Weak</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Heatmap Display */}
                <div className="rounded-2xl border bg-white/5 border-white/10">
                  <div className="px-6 pt-6">
                    <div className="text-lg font-semibold text-indigo-300 mb-4">Argument Strength Heatmap</div>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="p-6 bg-black/20 rounded-lg max-h-[600px] overflow-y-auto">
                      <div className="space-y-4">
                        {heatmap.segments.map((segment, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border-2 ${getStrengthColor(segment.strength)} transition-all hover:scale-[1.01]`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-xs font-semibold text-white/80 uppercase">
                                {segment.type}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-white/70">
                                  {getStrengthLabel(segment.strength)}
                                </span>
                                <span className="text-xs font-bold text-white">
                                  {segment.strength}%
                                </span>
                              </div>
                            </div>
                            <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                              {segment.text}
                            </p>
                            {segment.feedback && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-xs text-white/60 italic">
                                  💡 {segment.feedback}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Overall Statistics */}
                <div className="rounded-2xl border bg-white/5 border-white/10">
                  <div className="px-6 pt-6">
                    <div className="text-lg font-semibold text-indigo-300 mb-4">Overall Statistics</div>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-3xl font-bold text-white">
                          {heatmap.overallStrength}%
                        </p>
                        <p className="text-xs text-white/50">Overall Strength</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-green-400">
                          {heatmap.segments.filter(s => s.strength >= 60).length}
                        </p>
                        <p className="text-xs text-white/50">Strong Arguments</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-yellow-400">
                          {heatmap.segments.filter(s => s.strength >= 40 && s.strength < 60).length}
                        </p>
                        <p className="text-xs text-white/50">Moderate Arguments</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-red-400">
                          {heatmap.segments.filter(s => s.strength < 40).length}
                        </p>
                        <p className="text-xs text-white/50">Weak Arguments</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strongest Arguments */}
                {heatmap.segments.filter(s => s.strength >= 70).length > 0 && (
                  <div className="rounded-2xl border bg-green-500/10 border-green-500/20">
                    <div className="px-6 pt-6">
                      <div className="text-lg font-semibold text-green-300 mb-4">
                        ✅ Strongest Arguments
                      </div>
                    </div>
                    <div className="px-6 pb-6">
                      <ul className="space-y-3">
                        {heatmap.segments
                          .filter(s => s.strength >= 70)
                          .sort((a, b) => b.strength - a.strength)
                          .slice(0, 3)
                          .map((segment, idx) => (
                            <li key={idx} className="p-3 bg-black/20 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-xs font-semibold text-green-300">
                                  {segment.type}
                                </span>
                                <span className="text-xs font-bold text-green-300">
                                  {segment.strength}%
                                </span>
                              </div>
                              <p className="text-sm text-white/80 line-clamp-2">
                                {segment.text}
                              </p>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Needs Improvement */}
                {heatmap.segments.filter(s => s.strength < 50).length > 0 && (
                  <div className="rounded-2xl border bg-orange-500/10 border-orange-500/20">
                    <div className="px-6 pt-6">
                      <div className="text-lg font-semibold text-orange-300 mb-4">
                        📈 Needs Improvement
                      </div>
                    </div>
                    <div className="px-6 pb-6">
                      <ul className="space-y-3">
                        {heatmap.segments
                          .filter(s => s.strength < 50)
                          .sort((a, b) => a.strength - b.strength)
                          .slice(0, 3)
                          .map((segment, idx) => (
                            <li key={idx} className="p-3 bg-black/20 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-xs font-semibold text-orange-300">
                                  {segment.type}
                                </span>
                                <span className="text-xs font-bold text-orange-300">
                                  {segment.strength}%
                                </span>
                              </div>
                              <p className="text-sm text-white/80 line-clamp-2 mb-2">
                                {segment.text}
                              </p>
                              {segment.feedback && (
                                <p className="text-xs text-white/60 italic">
                                  💡 {segment.feedback}
                                </p>
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {heatmap.recommendations && (
                  <div className="rounded-2xl border bg-white/5 border-white/10">
                    <div className="px-6 pt-6">
                      <div className="text-lg font-semibold text-indigo-300 mb-4">
                        💡 Recommendations
                      </div>
                    </div>
                    <div className="px-6 pb-6">
                      <ul className="space-y-2">
                        {heatmap.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                            <span className="text-indigo-400 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

ArgumentHeatmap.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
  userSubscription: PropTypes.shape({
    tier: PropTypes.string,
  }),
  showToast: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default ArgumentHeatmap
