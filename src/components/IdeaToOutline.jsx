import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { supabase } from '../supabaseClient'
import { generateOutline as generateOutlineWithChatGPT } from '../utils/openai'

function IdeaToOutline({ user, userSubscription, showToast, onBack }) {
  const [idea, setIdea] = useState('')
  const [outlineType, setOutlineType] = useState('essay')
  const [detailLevel, setDetailLevel] = useState('medium')
  const [outline, setOutline] = useState(null)
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

  const outlineTypes = [
    { id: 'essay', name: 'Essay', description: 'Academic essay structure', icon: '📝' },
    { id: 'research-paper', name: 'Research Paper', description: 'Scholarly research format', icon: '🔬' },
    { id: 'presentation', name: 'Presentation', description: 'Slide deck outline', icon: '📊' },
    { id: 'article', name: 'Article', description: 'Blog or article structure', icon: '📰' },
    { id: 'speech', name: 'Speech', description: 'Persuasive speech outline', icon: '🎤' },
    { id: 'story', name: 'Story', description: 'Narrative story outline', icon: '📚' },
  ]

  const detailLevels = [
    { id: 'brief', name: 'Brief', description: 'Main points only' },
    { id: 'medium', name: 'Medium', description: 'Points with subpoints' },
    { id: 'detailed', name: 'Detailed', description: 'Full hierarchical outline' },
  ]

  const generateOutline = async () => {
    if (!idea.trim()) {
      showToast('Please enter your idea')
      return
    }

    if (!user) {
      showToast('Please log in to use Idea-to-Outline AI')
      return
    }

    setLoading(true)

    try {
      // Use ChatGPT to generate outline with tier
      const wordCount = detailLevel === 'brief' ? 500 : detailLevel === 'medium' ? 1000 : 1500
      const tier = userSubscription?.tier?.toLowerCase() || 'free'
      const result = await generateOutlineWithChatGPT(idea, outlineType, wordCount, tier)

      // Format the result to match expected structure
      const formattedOutline = {
        title: result.title,
        sections: result.body.map((bodyItem) => ({
          heading: bodyItem.mainPoint,
          subpoints: bodyItem.subPoints?.map((sp, idx) => ({
            text: sp,
            details: detailLevel === 'detailed' ? [bodyItem.evidence || 'Supporting evidence needed'] : undefined
          })) || []
        })),
        conclusion: result.conclusion?.finalThought || ''
      }

      setOutline(formattedOutline)
      showToast('Outline generated successfully!')
    } catch (error) {
      console.error('Error generating outline:', error)
      showToast(error.message || 'Failed to generate outline. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyOutline = () => {
    if (!outline) return
    const text = formatOutlineAsText(outline)
    navigator.clipboard.writeText(text)
    showToast('Outline copied to clipboard!')
  }

  const downloadOutline = () => {
    if (!outline) return
    const text = formatOutlineAsText(outline)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `outline-${outlineType}-${new Date().getTime()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Outline downloaded!')
  }

  const formatOutlineAsText = (outline) => {
    let text = `${outline.title}\n\n`

    outline.sections.forEach((section, idx) => {
      text += `${romanNumerals[idx]}. ${section.heading}\n`

      if (section.subpoints) {
        section.subpoints.forEach((sub, subIdx) => {
          text += `   ${String.fromCharCode(65 + subIdx)}. ${sub.text}\n`

          if (sub.details) {
            sub.details.forEach((detail, detailIdx) => {
              text += `      ${detailIdx + 1}. ${detail}\n`
            })
          }
        })
      }
      text += '\n'
    })

    if (outline.conclusion) {
      text += `Conclusion: ${outline.conclusion}\n`
    }

    return text
  }

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

  const reset = () => {
    setOutline(null)
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
              Idea-to-Outline AI
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Transform your ideas into structured, organized outlines instantly
            </p>
          </div>
        </div>

        {!outline ? (
          <div className="space-y-6">
            {/* Outline Type Selection */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 pt-6">
                <div className="text-lg font-semibold text-indigo-300 mb-4">Select Outline Type</div>
              </div>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {outlineTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setOutlineType(type.id)}
                      className={`p-4 rounded-lg border transition text-left ${
                        outlineType === type.id
                          ? 'bg-indigo-500/20 border-indigo-500'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-semibold text-sm">{type.name}</div>
                      <div className="text-xs text-white/60 mt-1">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Detail Level Selection */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 pt-6">
                <div className="text-lg font-semibold text-indigo-300 mb-4">Detail Level</div>
              </div>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-3 gap-3">
                  {detailLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setDetailLevel(level.id)}
                      className={`p-4 rounded-lg border transition text-center ${
                        detailLevel === level.id
                          ? 'bg-indigo-500/20 border-indigo-500'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="font-semibold text-sm">{level.name}</div>
                      <div className="text-xs text-white/60 mt-1">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Idea Input */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 pt-6">
                <div className="text-lg font-semibold text-indigo-300 mb-4">Your Idea</div>
              </div>
              <div className="px-6 pb-6">
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe your idea or topic in detail... The more context you provide, the better the outline will be!"
                  className="w-full h-48 rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-indigo-400 resize-none"
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-white/50">
                    {idea.trim().split(/\s+/).filter(w => w.length > 0).length} words
                  </div>
                  <button
                    onClick={generateOutline}
                    disabled={loading || !idea.trim()}
                    className="inline-flex items-center px-6 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '🔄 Generating...' : '✨ Generate Outline'}
                  </button>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-2xl border bg-indigo-500/10 border-indigo-500/20 p-6">
              <h3 className="font-semibold text-indigo-300 mb-2">💡 Tips for Best Results</h3>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Be specific about your topic and main points</li>
                <li>• Mention your target audience if relevant</li>
                <li>• Include any key arguments or themes to cover</li>
                <li>• Specify the desired length or scope if important</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Generated Outline */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold text-indigo-300">Generated Outline</div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyOutline}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium border border-white/10 rounded-md text-white hover:bg-white/5 transition"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={downloadOutline}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium border border-white/10 rounded-md text-white hover:bg-white/5 transition"
                    >
                      💾 Download
                    </button>
                    <button
                      onClick={reset}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium border border-white/10 rounded-md text-white hover:bg-white/5 transition"
                    >
                      🔄 New Outline
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="p-6 bg-black/20 rounded-lg max-h-[600px] overflow-y-auto">
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    {outline.title}
                  </h2>

                  {/* Sections */}
                  <div className="space-y-6">
                    {outline.sections.map((section, idx) => (
                      <div key={idx} className="border-l-4 border-indigo-500 pl-4">
                        <h3 className="text-lg font-semibold text-indigo-300 mb-3">
                          {romanNumerals[idx]}. {section.heading}
                        </h3>

                        {section.subpoints && (
                          <div className="space-y-3 ml-4">
                            {section.subpoints.map((sub, subIdx) => (
                              <div key={subIdx}>
                                <p className="text-white font-medium">
                                  {String.fromCharCode(65 + subIdx)}. {sub.text}
                                </p>

                                {sub.details && (
                                  <ul className="ml-6 mt-2 space-y-1">
                                    {sub.details.map((detail, detailIdx) => (
                                      <li key={detailIdx} className="text-white/70 text-sm">
                                        {detailIdx + 1}. {detail}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Conclusion */}
                    {outline.conclusion && (
                      <div className="border-l-4 border-green-500 pl-4 mt-6">
                        <h3 className="text-lg font-semibold text-green-300 mb-2">
                          Conclusion
                        </h3>
                        <p className="text-white/80">
                          {outline.conclusion}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Outline Stats */}
            <div className="rounded-2xl border bg-white/5 border-white/10">
              <div className="px-6 py-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {outline.sections.length}
                    </p>
                    <p className="text-xs text-white/50">Main Sections</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-300">
                      {outline.sections.reduce((sum, s) => sum + (s.subpoints?.length || 0), 0)}
                    </p>
                    <p className="text-xs text-white/50">Subpoints</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {outlineTypes.find(t => t.id === outlineType)?.icon}
                    </p>
                    <p className="text-xs text-white/50">{outlineTypes.find(t => t.id === outlineType)?.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

IdeaToOutline.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
  userSubscription: PropTypes.shape({
    tier: PropTypes.string,
  }),
  showToast: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default IdeaToOutline
