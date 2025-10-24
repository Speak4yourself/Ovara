import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { supabase } from '../supabaseClient'

function EssayGradePredictor({ user, userSubscription, showToast, onBack }) {
  const [essayText, setEssayText] = useState('')
  const [rubric, setRubric] = useState('')
  const [gradeLevel, setGradeLevel] = useState('high-school')
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && onBack) {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onBack])

  const gradeLevels = [
    { id: 'middle-school', name: 'Middle School', icon: '📚' },
    { id: 'high-school', name: 'High School', icon: '🎓' },
    { id: 'college', name: 'College', icon: '🏛️' },
    { id: 'graduate', name: 'Graduate', icon: '👨‍🎓' },
  ]

  const predictGrade = async () => {
    if (!essayText.trim()) {
      showToast('Please enter your essay text')
      return
    }

    if (!user) {
      showToast('Please log in to use Essay Grade Predictor')
      return
    }

    setLoading(true)

    try {
      const { data: session } = await supabase.auth.getSession()

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/grade-predictor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          essayText: essayText,
          rubric: rubric || null,
          gradeLevel: gradeLevel,
          tier: userSubscription?.tier?.toLowerCase() || 'free',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to predict grade')
      }

      const data = await response.json()
      setPrediction(data.prediction)
      showToast('Grade prediction generated!')
    } catch (error) {
      console.error('Error predicting grade:', error)
      showToast(error.message || 'Failed to predict grade. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'text-green-400'
    if (grade >= 80) return 'text-lime-400'
    if (grade >= 70) return 'text-yellow-400'
    if (grade >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const getLetterGrade = (score) => {
    if (score >= 93) return 'A'
    if (score >= 90) return 'A-'
    if (score >= 87) return 'B+'
    if (score >= 83) return 'B'
    if (score >= 80) return 'B-'
    if (score >= 77) return 'C+'
    if (score >= 73) return 'C'
    if (score >= 70) return 'C-'
    if (score >= 67) return 'D+'
    if (score >= 63) return 'D'
    if (score >= 60) return 'D-'
    return 'F'
  }

  const reset = () => {
    setPrediction(null)
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
              Essay Grade Predictor
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Get an AI-powered prediction of your essay grade with detailed feedback
            </p>
          </div>
        </div>

        {!prediction ? (
          <div className="space-y-6">
            {/* Grade Level Selection */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 pt-6">
                <div className="text-lg font-semibold text-indigo-300 mb-4">Academic Level</div>
              </div>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {gradeLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setGradeLevel(level.id)}
                      className={`p-4 rounded-lg border transition text-center ${
                        gradeLevel === level.id
                          ? 'bg-indigo-500/20 border-indigo-500'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="text-2xl mb-2">{level.icon}</div>
                      <div className="font-semibold text-sm">{level.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Essay Text Input */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 pt-6">
                <div className="text-lg font-semibold text-indigo-300 mb-4">Your Essay</div>
              </div>
              <div className="px-6 pb-6">
                <textarea
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  placeholder="Paste your complete essay here..."
                  className="w-full h-64 rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-indigo-400 resize-none font-mono text-sm"
                />
                <div className="text-sm text-white/50 mt-2">
                  {getWordCount(essayText)} words
                </div>
              </div>
            </div>

            {/* Optional Rubric */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 pt-6">
                <div className="text-lg font-semibold text-indigo-300 mb-2">
                  Grading Rubric <span className="text-xs text-white/50">(Optional)</span>
                </div>
                <p className="text-sm text-white/60 mb-4">
                  Paste your assignment rubric or grading criteria for more accurate predictions
                </p>
              </div>
              <div className="px-6 pb-6">
                <textarea
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                  placeholder="Example: Content 40%, Organization 30%, Grammar 20%, Creativity 10%"
                  className="w-full h-32 rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-indigo-400 resize-none text-sm"
                />
              </div>
            </div>

            {/* Predict Button */}
            <div className="flex justify-center">
              <button
                onClick={predictGrade}
                disabled={loading || !essayText.trim()}
                className="inline-flex items-center px-8 py-3 text-base font-medium bg-indigo-500 hover:bg-indigo-400 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Analyzing...' : '✨ Predict My Grade'}
              </button>
            </div>

            {/* Info Card */}
            <div className="rounded-2xl border bg-indigo-500/10 border-indigo-500/20 p-6">
              <h3 className="font-semibold text-indigo-300 mb-2">📊 How It Works</h3>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• AI analyzes grammar, structure, and content quality</li>
                <li>• Considers thesis strength and argument development</li>
                <li>• Evaluates organization and flow</li>
                <li>• Provides detailed feedback on improvements</li>
                <li>• Note: This is a prediction tool, not a guarantee</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Grade Display */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 py-8">
                <div className="text-center">
                  <div className="text-sm text-white/60 mb-2">Predicted Grade</div>
                  <div className={`text-8xl font-bold mb-4 ${getGradeColor(prediction.score)}`}>
                    {getLetterGrade(prediction.score)}
                  </div>
                  <div className={`text-4xl font-semibold ${getGradeColor(prediction.score)}`}>
                    {prediction.score}%
                  </div>
                  <div className="text-sm text-white/50 mt-4">
                    {prediction.confidence ? `Confidence: ${prediction.confidence}%` : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown by Category */}
            {prediction.breakdown && (
              <div className="rounded-2xl border bg-white/5 border-white/10">
                <div className="px-6 pt-6">
                  <div className="text-lg font-semibold text-indigo-300 mb-4">Grade Breakdown</div>
                </div>
                <div className="px-6 pb-6">
                  <div className="space-y-4">
                    {prediction.breakdown.map((category, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{category.name}</span>
                          <span className={`text-sm font-semibold ${getGradeColor(category.score)}`}>
                            {category.score}%
                          </span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              category.score >= 90 ? 'bg-green-400' :
                              category.score >= 80 ? 'bg-lime-400' :
                              category.score >= 70 ? 'bg-yellow-400' :
                              category.score >= 60 ? 'bg-orange-400' :
                              'bg-red-400'
                            }`}
                            style={{ width: `${category.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Strengths */}
            {prediction.strengths && prediction.strengths.length > 0 && (
              <div className="rounded-2xl border bg-green-500/10 border-green-500/20">
                <div className="px-6 pt-6">
                  <div className="text-lg font-semibold text-green-300 mb-4">✅ Strengths</div>
                </div>
                <div className="px-6 pb-6">
                  <ul className="space-y-2">
                    {prediction.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Areas for Improvement */}
            {prediction.improvements && prediction.improvements.length > 0 && (
              <div className="rounded-2xl border bg-orange-500/10 border-orange-500/20">
                <div className="px-6 pt-6">
                  <div className="text-lg font-semibold text-orange-300 mb-4">📈 Areas for Improvement</div>
                </div>
                <div className="px-6 pb-6">
                  <ul className="space-y-2">
                    {prediction.improvements.map((improvement, idx) => (
                      <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Overall Feedback */}
            {prediction.feedback && (
              <div className="rounded-2xl border bg-white/5 border-white/10">
                <div className="px-6 pt-6">
                  <div className="text-lg font-semibold text-indigo-300 mb-4">💬 Overall Feedback</div>
                </div>
                <div className="px-6 pb-6">
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {prediction.feedback}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center px-6 py-2 text-sm font-medium border border-white/10 rounded-md text-white hover:bg-white/5 transition"
              >
                🔄 Analyze Another Essay
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

EssayGradePredictor.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
  userSubscription: PropTypes.shape({
    tier: PropTypes.string,
  }),
  showToast: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default EssayGradePredictor
