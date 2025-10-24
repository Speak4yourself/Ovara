import React, { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { supabase } from '../supabaseClient'
import { useDebounce } from '../hooks/useDebounce'

function ReadabilitySculptor({ user, userSubscription, showToast, onBack }) {
  const [inputText, setInputText] = useState('')
  const [targetLevel, setTargetLevel] = useState('high-school')
  const [sculptedText, setSculptedText] = useState('')
  const [originalScores, setOriginalScores] = useState(null)
  const [sculptedScores, setSculptedScores] = useState(null)
  const [loading, setLoading] = useState(false)

  // Debounce input text for performance
  const debouncedInputText = useDebounce(inputText, 300)

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && onBack) {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onBack])

  // Calculate readability scores only when debounced text changes
  useEffect(() => {
    if (debouncedInputText.trim()) {
      setOriginalScores(calculateReadability(debouncedInputText))
    } else {
      setOriginalScores(null)
    }
  }, [debouncedInputText])

  const readabilityLevels = [
    { id: 'elementary', name: 'Elementary', grade: '3-5', icon: '🎒' },
    { id: 'middle-school', name: 'Middle School', grade: '6-8', icon: '📚' },
    { id: 'high-school', name: 'High School', grade: '9-12', icon: '🎓' },
    { id: 'college', name: 'College', grade: '13-16', icon: '🏛️' },
    { id: 'graduate', name: 'Graduate', grade: '17+', icon: '👨‍🎓' },
    { id: 'professional', name: 'Professional', grade: 'Expert', icon: '💼' },
  ]

  // Calculate readability scores
  const calculateReadability = (text) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.trim().split(/\s+/).filter(w => w.length > 0)
    const syllables = words.reduce((count, word) => count + countSyllables(word), 0)

    const avgWordsPerSentence = words.length / (sentences.length || 1)
    const avgSyllablesPerWord = syllables / (words.length || 1)

    // Flesch Reading Ease Score
    const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord

    // Flesch-Kincaid Grade Level
    const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59

    return {
      fleschScore: Math.max(0, Math.min(100, fleschScore)).toFixed(1),
      gradeLevel: Math.max(0, gradeLevel).toFixed(1),
      sentences: sentences.length,
      words: words.length,
      syllables: syllables,
      avgWordsPerSentence: avgWordsPerSentence.toFixed(1),
      avgSyllablesPerWord: avgSyllablesPerWord.toFixed(2),
    }
  }

  // Count syllables in a word (simple approximation)
  const countSyllables = (word) => {
    word = word.toLowerCase().replace(/[^a-z]/g, '')
    if (word.length <= 3) return 1

    const vowels = 'aeiouy'
    let count = 0
    let prevWasVowel = false

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i])
      if (isVowel && !prevWasVowel) {
        count++
      }
      prevWasVowel = isVowel
    }

    // Adjust for silent 'e' at the end
    if (word.endsWith('e')) count--

    return Math.max(1, count)
  }

  const getFleschInterpretation = (score) => {
    if (score >= 90) return { level: 'Very Easy', color: 'text-green-400' }
    if (score >= 80) return { level: 'Easy', color: 'text-green-300' }
    if (score >= 70) return { level: 'Fairly Easy', color: 'text-lime-400' }
    if (score >= 60) return { level: 'Standard', color: 'text-yellow-400' }
    if (score >= 50) return { level: 'Fairly Difficult', color: 'text-orange-400' }
    if (score >= 30) return { level: 'Difficult', color: 'text-red-400' }
    return { level: 'Very Difficult', color: 'text-red-500' }
  }

  const sculptReadability = async () => {
    if (!inputText.trim()) {
      showToast('Please enter some text to sculpt')
      return
    }

    if (!user) {
      showToast('Please log in to use Readability Sculptor')
      return
    }

    setLoading(true)

    try {
      // Calculate original scores
      const origScores = calculateReadability(inputText)
      setOriginalScores(origScores)

      const { data: session } = await supabase.auth.getSession()

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/readability-sculptor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          targetLevel: targetLevel,
          tier: userSubscription?.tier?.toLowerCase() || 'free',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to sculpt readability')
      }

      const data = await response.json()
      setSculptedText(data.sculptedText)

      // Calculate sculpted scores
      const scultpScores = calculateReadability(data.sculptedText)
      setSculptedScores(scultpScores)

      showToast('Readability sculpted successfully!')
    } catch (error) {
      console.error('Error sculpting readability:', error)
      showToast(error.message || 'Failed to sculpt readability. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyText = () => {
    navigator.clipboard.writeText(sculptedText)
    showToast('Sculpted text copied to clipboard!')
  }

  const downloadText = () => {
    const blob = new Blob([sculptedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `readability-${targetLevel}-${new Date().getTime()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Sculpted text downloaded!')
  }

  const reset = () => {
    setSculptedText('')
    setOriginalScores(null)
    setSculptedScores(null)
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
              Readability Sculptor
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Adjust text complexity and improve readability for your target audience
            </p>
          </div>
        </div>

        {/* Target Level Selection */}
        <div className="rounded-2xl border bg-white/5 border-white/10 mb-6">
          <div className="px-6 pt-6">
            <div className="text-lg font-semibold text-indigo-300 mb-4">Select Target Reading Level</div>
          </div>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {readabilityLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setTargetLevel(level.id)}
                  className={`p-4 rounded-lg border transition text-center ${
                    targetLevel === level.id
                      ? 'bg-indigo-500/20 border-indigo-500'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-2">{level.icon}</div>
                  <div className="font-semibold text-sm">{level.name}</div>
                  <div className="text-xs text-white/60 mt-1">Grade {level.grade}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input/Output Area */}
        {!sculptedText ? (
          <div className="rounded-2xl border bg-white/5 border-white/10">
            <div className="px-6 pt-6">
              <div className="text-lg font-semibold text-indigo-300 mb-4">Your Text</div>
            </div>
            <div className="px-6 pb-6">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter or paste your text here..."
                aria-label="Enter your text to analyze readability"
                className="w-full h-64 rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-indigo-400 resize-none"
              />

              {/* Live Readability Scores */}
              {originalScores && (
                <div className="mt-4 p-4 bg-black/20 rounded-lg">
                  <div className="text-sm font-semibold text-white/70 mb-3">Current Readability</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className={`text-2xl font-bold ${getFleschInterpretation(originalScores.fleschScore).color}`}>
                        {originalScores.fleschScore}
                      </div>
                      <div className="text-xs text-white/50">Flesch Score</div>
                      <div className={`text-xs ${getFleschInterpretation(originalScores.fleschScore).color}`}>
                        {getFleschInterpretation(originalScores.fleschScore).level}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{originalScores.gradeLevel}</div>
                      <div className="text-xs text-white/50">Grade Level</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{originalScores.avgWordsPerSentence}</div>
                      <div className="text-xs text-white/50">Words/Sentence</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{originalScores.avgSyllablesPerWord}</div>
                      <div className="text-xs text-white/50">Syllables/Word</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-white/50">
                  {originalScores ? `${originalScores.words} words, ${originalScores.sentences} sentences` : ''}
                </div>
                <button
                  onClick={sculptReadability}
                  disabled={loading || !inputText.trim()}
                  className="inline-flex items-center px-6 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '🔄 Sculpting...' : `✨ Sculpt for ${readabilityLevels.find(l => l.id === targetLevel)?.name}`}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Comparison View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-white/5 border-white/10">
                <div className="px-6 pt-6">
                  <div className="text-sm font-semibold text-white/70">Original Text</div>
                </div>
                <div className="px-6 pb-6">
                  <div className="p-4 bg-black/20 rounded-lg min-h-[300px] max-h-[400px] overflow-y-auto">
                    <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                      {inputText}
                    </p>
                  </div>
                  {originalScores && (
                    <div className="mt-3 p-3 bg-black/20 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className={`font-bold ${getFleschInterpretation(originalScores.fleschScore).color}`}>
                            {originalScores.fleschScore} Flesch
                          </div>
                          <div className="text-white/50">{getFleschInterpretation(originalScores.fleschScore).level}</div>
                        </div>
                        <div>
                          <div className="font-bold text-white">Grade {originalScores.gradeLevel}</div>
                          <div className="text-white/50">{originalScores.words} words</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border bg-white/5 border-white/10">
                <div className="px-6 pt-6">
                  <div className="text-sm font-semibold text-indigo-300">
                    {readabilityLevels.find(l => l.id === targetLevel)?.icon} Sculpted Text
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="p-4 bg-black/20 rounded-lg min-h-[300px] max-h-[400px] overflow-y-auto">
                    <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                      {sculptedText}
                    </p>
                  </div>
                  {sculptedScores && (
                    <div className="mt-3 p-3 bg-black/20 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className={`font-bold ${getFleschInterpretation(sculptedScores.fleschScore).color}`}>
                            {sculptedScores.fleschScore} Flesch
                          </div>
                          <div className="text-white/50">{getFleschInterpretation(sculptedScores.fleschScore).level}</div>
                        </div>
                        <div>
                          <div className="font-bold text-white">Grade {sculptedScores.gradeLevel}</div>
                          <div className="text-white/50">{sculptedScores.words} words</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 py-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={copyText}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium border border-white/10 rounded-md text-white hover:bg-white/5 transition"
                  >
                    📋 Copy Sculpted Text
                  </button>
                  <button
                    onClick={downloadText}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium border border-white/10 rounded-md text-white hover:bg-white/5 transition"
                  >
                    💾 Download
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium border border-white/10 rounded-md text-white hover:bg-white/5 transition ml-auto"
                  >
                    🔄 Sculpt Another
                  </button>
                </div>
              </div>
            </div>

            {/* Improvement Analysis */}
            {originalScores && sculptedScores && (
              <div className="rounded-2xl border bg-white/5 border-white/10">
                <div className="px-6 pt-6">
                  <div className="text-lg font-semibold text-indigo-300 mb-4">Readability Improvement</div>
                </div>
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className={`text-2xl font-bold ${
                        parseFloat(sculptedScores.fleschScore) > parseFloat(originalScores.fleschScore)
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {parseFloat(sculptedScores.fleschScore) > parseFloat(originalScores.fleschScore) ? '+' : ''}
                        {(parseFloat(sculptedScores.fleschScore) - parseFloat(originalScores.fleschScore)).toFixed(1)}
                      </p>
                      <p className="text-xs text-white/50">Flesch Change</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${
                        parseFloat(sculptedScores.gradeLevel) < parseFloat(originalScores.gradeLevel)
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {(parseFloat(sculptedScores.gradeLevel) - parseFloat(originalScores.gradeLevel)).toFixed(1)}
                      </p>
                      <p className="text-xs text-white/50">Grade Level Change</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {(parseFloat(sculptedScores.avgWordsPerSentence) - parseFloat(originalScores.avgWordsPerSentence)).toFixed(1)}
                      </p>
                      <p className="text-xs text-white/50">Avg Words/Sentence</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {sculptedScores.words - originalScores.words}
                      </p>
                      <p className="text-xs text-white/50">Word Count Change</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 rounded-2xl border bg-indigo-500/10 border-indigo-500/20 p-6">
          <h3 className="font-semibold text-indigo-300 mb-2">📊 Understanding Readability Scores</h3>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• <strong>Flesch Score:</strong> 0-100 scale, higher = easier to read</li>
            <li>• <strong>Grade Level:</strong> School grade needed to understand the text</li>
            <li>• <strong>Words/Sentence:</strong> Average sentence length (shorter = easier)</li>
            <li>• <strong>Syllables/Word:</strong> Average word complexity (fewer = simpler)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

ReadabilitySculptor.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
  userSubscription: PropTypes.shape({
    tier: PropTypes.string,
  }),
  showToast: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default ReadabilitySculptor
