import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { supabase } from '../supabaseClient'
import { sanitizeText } from '../utils/sanitize'

function ToneMapper({ user, userSubscription, showToast, onBack }) {
  const [inputText, setInputText] = useState('')
  const [selectedTone, setSelectedTone] = useState('professional')
  const [mappedText, setMappedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && onBack) {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onBack])

  const tones = [
    { id: 'professional', name: 'Professional', description: 'Formal and business-appropriate', icon: '💼' },
    { id: 'casual', name: 'Casual', description: 'Relaxed and conversational', icon: '😊' },
    { id: 'academic', name: 'Academic', description: 'Scholarly and formal', icon: '🎓' },
    { id: 'friendly', name: 'Friendly', description: 'Warm and approachable', icon: '🤝' },
    { id: 'confident', name: 'Confident', description: 'Assertive and strong', icon: '💪' },
    { id: 'empathetic', name: 'Empathetic', description: 'Understanding and compassionate', icon: '❤️' },
    { id: 'persuasive', name: 'Persuasive', description: 'Convincing and compelling', icon: '🎯' },
    { id: 'concise', name: 'Concise', description: 'Brief and to the point', icon: '⚡' },
  ]

  const mapTone = async () => {
    if (!inputText.trim()) {
      showToast('Please enter some text to map')
      return
    }

    if (!user) {
      showToast('Please log in to use Tone Mapper')
      return
    }

    setLoading(true)

    try {
      // Sanitize input before sending to API
      const sanitizedText = sanitizeText(inputText)

      const { data: session } = await supabase.auth.getSession()

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tone-mapper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sanitizedText,
          targetTone: selectedTone,
          tier: userSubscription?.tier?.toLowerCase() || 'free',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to map tone')
      }

      const data = await response.json()
      setMappedText(data.mappedText)
      setCompareMode(true)
      showToast('Tone mapped successfully!')
    } catch (error) {
      console.error('Error mapping tone:', error)
      showToast(error.message || 'Failed to map tone. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyText = () => {
    navigator.clipboard.writeText(mappedText)
    showToast('Mapped text copied to clipboard!')
  }

  const downloadText = () => {
    const blob = new Blob([mappedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tone-mapped-${selectedTone}-${new Date().getTime()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Mapped text downloaded!')
  }

  const reset = () => {
    setMappedText('')
    setCompareMode(false)
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
            aria-label="Go back to Control Panel"
            className="inline-flex items-center px-4 py-2 text-sm font-medium border border-white/20 text-white hover:bg-white/5 transition rounded-md"
          >
            Back to Control Panel
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Tone Mapper
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Adjust the tone of your writing to match your audience and purpose
            </p>
          </div>
        </div>

        {/* Tone Selection */}
        <div className="rounded-2xl border bg-white/5 border-white/10 mb-6">
          <div className="px-6 pt-6">
            <div className="text-lg font-semibold text-indigo-300 mb-4">Select Target Tone</div>
          </div>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tones.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setSelectedTone(tone.id)}
                  className={`p-4 rounded-lg border transition text-left ${
                    selectedTone === tone.id
                      ? 'bg-indigo-500/20 border-indigo-500'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-2">{tone.icon}</div>
                  <div className="font-semibold text-sm">{tone.name}</div>
                  <div className="text-xs text-white/60 mt-1">{tone.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input/Output Area */}
        {!compareMode ? (
          <div className="rounded-2xl border bg-white/5 border-white/10">
            <div className="px-6 pt-6">
              <div className="text-lg font-semibold text-indigo-300 mb-4">Your Text</div>
            </div>
            <div className="px-6 pb-6">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter or paste your text here..."
                className="w-full h-64 rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-indigo-400 resize-none"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-white/50">
                  {getWordCount(inputText)} words
                </div>
                <button
                  onClick={mapTone}
                  disabled={loading || !inputText.trim()}
                  className="inline-flex items-center px-6 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '🔄 Mapping Tone...' : `✨ Map to ${tones.find(t => t.id === selectedTone)?.name}`}
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
                  <div className="text-sm font-semibold text-white/70">Original</div>
                </div>
                <div className="px-6 pb-6">
                  <div className="p-4 bg-black/20 rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto">
                    <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                      {inputText}
                    </p>
                  </div>
                  <div className="text-xs text-white/50 mt-2">
                    {getWordCount(inputText)} words
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white/5 border-white/10">
                <div className="px-6 pt-6">
                  <div className="text-sm font-semibold text-indigo-300">
                    {tones.find(t => t.id === selectedTone)?.icon} {tones.find(t => t.id === selectedTone)?.name} Tone
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="p-4 bg-black/20 rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto">
                    <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                      {mappedText}
                    </p>
                  </div>
                  <div className="text-xs text-white/50 mt-2">
                    {getWordCount(mappedText)} words
                  </div>
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
                    📋 Copy Mapped Text
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
                    🔄 Map Another
                  </button>
                </div>
              </div>
            </div>

            {/* Tone Analysis */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 pt-6">
                <div className="text-lg font-semibold text-indigo-300 mb-4">Tone Analysis</div>
              </div>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {getWordCount(inputText) > 0 ? Math.round((getWordCount(mappedText) / getWordCount(inputText)) * 100) : 0}%
                    </p>
                    <p className="text-xs text-white/50">Length Change</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-300">
                      {tones.find(t => t.id === selectedTone)?.icon}
                    </p>
                    <p className="text-xs text-white/50">Target Tone</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {Math.abs(getWordCount(mappedText) - getWordCount(inputText))}
                    </p>
                    <p className="text-xs text-white/50">Word Difference</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 rounded-2xl border bg-indigo-500/10 border-indigo-500/20 p-6">
          <h3 className="font-semibold text-indigo-300 mb-2">💡 How Tone Mapper Works</h3>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• Select your target tone from 8 different options</li>
            <li>• Paste your text and click "Map" to transform it</li>
            <li>• Compare original vs. mapped text side-by-side</li>
            <li>• Copy or download your tone-mapped content</li>
            <li>• Perfect for emails, essays, marketing copy, and more</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

ToneMapper.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
  userSubscription: PropTypes.shape({
    tier: PropTypes.string,
  }),
  showToast: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default ToneMapper
