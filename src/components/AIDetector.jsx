import { useState, useEffect } from 'react'
import { FileText, Upload, Shield, AlertCircle, CheckCircle, Edit2, Trash2, Download, X, Search, Brain, TrendingUp, User } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { detectAIAdvanced } from '../utils/customAIDetector'
import UsageLimitModal from './UsageLimitModal'
import { Button, Card, CardHeader, CardTitle, CardContent, PageHeader, PageContainer, Input, Textarea, Select, Label } from './SharedUI'

export default function AIDetector({ user, userSubscription, showToast, onBack }) {
  // Navigation state
  const [view, setView] = useState('choice') // 'choice', 'savedEssays', 'detector'

  // Essay state
  const [essays, setEssays] = useState([])
  const [selectedEssay, setSelectedEssay] = useState(null)
  const [essayText, setEssayText] = useState('')
  const [essayFilter, setEssayFilter] = useState('all') // 'all', 'safe', 'suspicious', 'ai_detected'

  // Detection state
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionResult, setDetectionResult] = useState(null)

  // Rename modal state
  const [renameModal, setRenameModal] = useState(false)
  const [renameEssayId, setRenameEssayId] = useState(null)
  const [newEssayName, setNewEssayName] = useState('')

  // Upload state
  const [uploadingPDF, setUploadingPDF] = useState(false)

  // Usage limit modal state
  const [showLimitModal, setShowLimitModal] = useState(false)

  // Tier limits
  const getTierLimits = () => {
    const tier = userSubscription?.tier?.toLowerCase() || 'free'

    const limits = {
      free: {
        detectionsPerWeek: 5,
        savedEssays: 1,
        detailedAnalysis: false,
        multipleDetectors: false,
        exportReport: false,
      },
      basic: {
        detectionsPerWeek: 25,
        savedEssays: 10,
        detailedAnalysis: false,
        multipleDetectors: false,
        exportReport: false,
      },
      pro: {
        detectionsPerWeek: 100,
        savedEssays: 50,
        detailedAnalysis: true,
        multipleDetectors: true,
        exportReport: true,
      },
      premium: {
        detectionsPerWeek: Infinity,
        savedEssays: Infinity,
        detailedAnalysis: true,
        multipleDetectors: true,
        exportReport: true,
      },
    }

    return limits[tier] || limits.free
  }

  const limits = getTierLimits()

  // Load essays on mount
  useEffect(() => {
    if (user) {
      loadEssays()
    }
  }, [user])

  const loadEssays = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_essays')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading essays:', error)
        showToast('Failed to load essays')
        return
      }

      setEssays(data || [])
    } catch (error) {
      console.error('Error in loadEssays:', error)
    }
  }

  const createNewEssay = async (name, content, aiScore = null) => {
    if (essays.length >= limits.savedEssays) {
      setShowLimitModal(true)
      return null
    }

    try {
      // Determine status based on AI score
      let status = 'generated'
      if (aiScore !== null) {
        if (aiScore < 30) status = 'safe'
        else if (aiScore < 70) status = 'suspicious'
        else status = 'ai_detected'
      }

      const { data, error } = await supabase
        .from('saved_essays')
        .insert({
          user_id: user.id,
          name: name,
          content: content,
          status: status,
          ai_detection_score: aiScore,
        })
        .select()
        .single()

      if (error) throw error

      await loadEssays()
      showToast('Essay saved successfully!')
      return data
    } catch (error) {
      console.error('Error creating essay:', error)
      showToast('Failed to save essay')
      return null
    }
  }

  const updateEssay = async (essayId, updates) => {
    try {
      const { error } = await supabase
        .from('saved_essays')
        .update(updates)
        .eq('id', essayId)
        .eq('user_id', user.id)

      if (error) throw error

      await loadEssays()
      showToast('Essay updated successfully!')
    } catch (error) {
      console.error('Error updating essay:', error)
      showToast('Failed to update essay')
    }
  }

  const deleteEssay = async (essayId) => {
    if (!confirm('Are you sure you want to delete this essay?')) return

    try {
      const { error } = await supabase
        .from('saved_essays')
        .delete()
        .eq('id', essayId)
        .eq('user_id', user.id)

      if (error) throw error

      await loadEssays()
      showToast('Essay deleted')
    } catch (error) {
      console.error('Error deleting essay:', error)
      showToast('Failed to delete essay')
    }
  }

  const handlePDFUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      showToast('Please upload a valid PDF file')
      return
    }

    setUploadingPDF(true)

    try {
      // Create FormData and upload to edge function
      const formData = new FormData()
      formData.append('file', file)

      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to extract PDF text')
      }

      const { text, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      setEssayText(text)
      showToast('PDF text extracted successfully!')

    } catch (error) {
      console.error('Error uploading PDF:', error)
      showToast(error.message || 'Failed to extract PDF text. Please try pasting text manually.')
    } finally {
      setUploadingPDF(false)
    }
  }

  const startDetection = async (text) => {
    if (!text || text.trim().length === 0) {
      showToast('Please enter some text to analyze')
      return
    }

    if (text.trim().split(/\s+/).length < 50) {
      showToast('Please enter at least 50 words for accurate detection')
      return
    }

    setIsDetecting(true)
    setDetectionResult(null)

    try {
      // Use our custom AI detection engine
      const analysis = await detectAIAdvanced(text)

      // Format result for the UI
      const result = {
        overallScore: analysis.score,
        confidence: analysis.confidence,
        highlightedSentences: null, // We'll add sentence-level highlighting if needed
        patterns: analysis.warnings.map(w => w.message),
        detailed: null,
        detectors: null,
      }

      // Add detailed breakdown for Pro/Premium users
      if (limits.detailedAnalysis) {
        // Create sentence-level highlighting
        const sentences = text.match(/[^.!?]+[.!?]+/g) || []
        result.highlightedSentences = sentences.map(sentence => {
          // Analyze each sentence individually
          const sentenceAnalysis = detectAIAdvanced(sentence.trim())
          return {
            text: sentence.trim(),
            score: sentenceAnalysis.score,
            status: sentenceAnalysis.score < 30 ? 'human' :
                   sentenceAnalysis.score < 70 ? 'unsure' : 'ai'
          }
        })

        result.detailed = {
          sentences: `${result.highlightedSentences.filter(s => s.status === 'ai').length} AI sentences detected out of ${result.highlightedSentences.length} total`,
          patterns: [
            ...analysis.warnings.map(w => `${w.message} ${w.detail ? `(${w.detail})` : ''}`),
            `Text burstiness: ${analysis.details.burstiness.burstiness.toFixed(2)}`,
            `Lexical diversity: ${(analysis.details.statistics.lexicalDiversity * 100).toFixed(1)}%`,
            `Average sentence length: ${analysis.details.statistics.avgSentenceLength.toFixed(1)} words`,
          ],
          confidence: analysis.confidence,
          breakdown: analysis.breakdown,
        }
      }

      // Add multiple detector results for Pro/Premium
      if (limits.multipleDetectors) {
        // Simulate different detection methods with slight variations
        result.detectors = {
          'Pattern Analysis': analysis.details.aiPatterns.score,
          'Burstiness Check': analysis.details.burstiness.score,
          'Style Analysis': analysis.details.sentenceStructure.score,
          'Personalization': analysis.details.personalization.score,
          'Overall Ovara Score': analysis.score,
        }
      }

      setDetectionResult(result)

      // Track usage
      await supabase.rpc('increment_detection_count', { p_user_id: user.id }).catch(() => {
        // Silently fail if RPC doesn't exist yet
      })

      showToast('Analysis complete!')
    } catch (error) {
      console.error('Error detecting AI:', error)
      showToast(error.message || 'Failed to analyze text. Please try again.')
    } finally {
      setIsDetecting(false)
    }
  }

  const getScoreColor = (score) => {
    if (score < 30) return 'text-green-400'
    if (score < 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBgColor = (score) => {
    if (score < 30) return 'bg-green-500/20'
    if (score < 70) return 'bg-yellow-500/20'
    return 'bg-red-500/20'
  }

  const getScoreLabel = (score) => {
    if (score < 30) return 'Human-Written'
    if (score < 70) return 'Possibly AI'
    return 'AI-Generated'
  }

  const filteredEssays = essays.filter(essay => {
    if (essayFilter === 'all') return true
    if (essayFilter === 'safe') return essay.ai_detection_score !== null && essay.ai_detection_score < 30
    if (essayFilter === 'suspicious') return essay.ai_detection_score !== null && essay.ai_detection_score >= 30 && essay.ai_detection_score < 70
    if (essayFilter === 'ai_detected') return essay.ai_detection_score !== null && essay.ai_detection_score >= 70
    return true
  })

  // CHOICE VIEW
  if (view === 'choice') {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                AI Detector
                <span className="text-sm px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                  Ovara Custom Engine
                </span>
              </h1>
              <p className="text-white/60 mt-1">Advanced pattern-based AI detection without external APIs</p>
            </div>
            <Button
              variant="outline"
              onClick={onBack}
              className="border-white/20 text-white hover:bg-white/5"
            >
              Back to Control Panel
            </Button>
          </div>

          {/* Tier info banner */}
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-white/60">Detections this week</div>
                    <div className="text-lg font-bold text-indigo-300">
                      0 / {limits.detectionsPerWeek === Infinity ? '∞' : limits.detectionsPerWeek}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60">Saved essays</div>
                    <div className="text-lg font-bold text-indigo-300">
                      {essays.length} / {limits.savedEssays === Infinity ? '∞' : limits.savedEssays}
                    </div>
                  </div>
                  {limits.detailedAnalysis && (
                    <div className="flex items-center gap-2 text-purple-400">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Detailed Analysis</span>
                    </div>
                  )}
                  {limits.multipleDetectors && (
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Search className="w-4 h-4" />
                      <span className="text-sm font-medium">Multi-Detector</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Choice cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10 hover:border-white/20 transition cursor-pointer"
                  onClick={() => setView('savedEssays')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-500/20 p-3">
                    <FileText className="w-6 h-6 text-indigo-300" />
                  </div>
                  <CardTitle className="text-indigo-300">Saved Essays</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 text-sm mb-4">
                  Select from your saved essays to analyze
                </p>
                <div className="text-2xl font-bold text-white">{essays.length} Essays</div>
                <Button className="w-full mt-4" variant="outline">
                  Browse Saved Essays
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-white/20 transition cursor-pointer"
                  onClick={() => setView('detector')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-green-500/20 p-3">
                    <Shield className="w-6 h-6 text-green-300" />
                  </div>
                  <CardTitle className="text-green-300">New Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 text-sm mb-4">
                  Paste or upload text to analyze right away
                </p>
                <div className="text-2xl font-bold text-white">Start Fresh</div>
                <Button className="w-full mt-4" variant="outline">
                  Analyze New Text
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature explanation */}
          <Card className="bg-white/5 border-white/10 mt-6">
            <CardHeader>
              <CardTitle className="text-indigo-300">How Our Custom Detection Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-green-300">0-30% AI</span>
                  </div>
                  <p className="text-sm text-white/70">Likely human-written. Safe to use.</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-yellow-300">30-70% AI</span>
                  </div>
                  <p className="text-sm text-white/70">Mixed signals. Review recommended.</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="font-medium text-red-300">70-100% AI</span>
                  </div>
                  <p className="text-sm text-white/70">Likely AI-generated. Humanize it.</p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-semibold text-purple-300 mb-3">Our Detection Methods:</h4>
                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <Brain className="w-4 h-4 text-purple-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-white/90">Pattern Analysis</div>
                      <div className="text-white/60">Detects common AI phrases and structures</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-white/90">Burstiness Check</div>
                      <div className="text-white/60">Analyzes sentence length variation</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-green-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-white/90">Personalization Score</div>
                      <div className="text-white/60">Checks for personal pronouns and experiences</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Search className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-white/90">Lexical Diversity</div>
                      <div className="text-white/60">Measures vocabulary richness</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // SAVED ESSAYS VIEW
  if (view === 'savedEssays') {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Saved Essays</h1>
              <p className="text-white/60 mt-1">
                {essays.length} / {limits.savedEssays === Infinity ? '∞' : limits.savedEssays} essays saved
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setView('choice')}
              className="border-white/20 text-white hover:bg-white/5"
            >
              Back
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setEssayFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                essayFilter === 'all'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              All ({essays.length})
            </button>
            <button
              onClick={() => setEssayFilter('safe')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                essayFilter === 'safe'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Safe ({essays.filter(e => e.ai_detection_score !== null && e.ai_detection_score < 30).length})
            </button>
            <button
              onClick={() => setEssayFilter('suspicious')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                essayFilter === 'suspicious'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Suspicious ({essays.filter(e => e.ai_detection_score !== null && e.ai_detection_score >= 30 && e.ai_detection_score < 70).length})
            </button>
            <button
              onClick={() => setEssayFilter('ai_detected')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                essayFilter === 'ai_detected'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              AI Detected ({essays.filter(e => e.ai_detection_score !== null && e.ai_detection_score >= 70).length})
            </button>
          </div>

          {/* Essays grid */}
          {filteredEssays.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/60">No essays found. Create one to get started!</p>
                <Button className="mt-4" onClick={() => setView('detector')}>
                  Analyze New Text
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEssays.map((essay) => (
                <Card key={essay.id} className="bg-white/5 border-white/10 hover:border-white/20 transition">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-white truncate">{essay.name}</CardTitle>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setRenameEssayId(essay.id)
                            setNewEssayName(essay.name)
                            setRenameModal(true)
                          }}
                          className="text-white/60 hover:text-white p-1"
                          title="Rename"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEssay(essay.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {essay.ai_detection_score !== null && (
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getScoreBgColor(essay.ai_detection_score)} ${getScoreColor(essay.ai_detection_score)}`}>
                          {essay.ai_detection_score}% AI - {getScoreLabel(essay.ai_detection_score)}
                        </span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm line-clamp-3 mb-4">
                      {essay.content}
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={() => {
                          setSelectedEssay(essay)
                          setEssayText(essay.content)
                          setView('detector')
                        }}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {essay.ai_detection_score !== null ? 'Re-analyze' : 'Analyze'}
                      </Button>
                    </div>
                    <div className="text-xs text-white/40 mt-3">
                      {new Date(essay.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Rename Modal */}
        {renameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <Card className="bg-[#0b0c10] border-white/20 w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Rename Essay</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="text"
                  value={newEssayName}
                  onChange={(e) => setNewEssayName(e.target.value)}
                  className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  placeholder="Enter new name"
                  autoFocus
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      if (newEssayName.trim()) {
                        await updateEssay(renameEssayId, { name: newEssayName.trim() })
                        setRenameModal(false)
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setRenameModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // DETECTOR VIEW
  if (view === 'detector') {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">AI Detector</h1>
              <p className="text-white/60 mt-1">Analyze text for AI-generated content</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setView('choice')
                setEssayText('')
                setDetectionResult(null)
                setSelectedEssay(null)
              }}
              className="border-white/20 text-white hover:bg-white/5"
            >
              Back
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input side */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-indigo-300">Text to Analyze</CardTitle>
                  {selectedEssay && (
                    <span className="text-xs text-white/60">From: {selectedEssay.name}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <textarea
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  placeholder="Paste your text here or upload a PDF... (minimum 50 words)"
                  className="w-full h-96 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400 resize-none"
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-white/60">
                    {essayText.length} characters ({essayText.trim().split(/\s+/).filter(w => w.length > 0).length} words)
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handlePDFUpload(file)
                      }}
                      disabled={uploadingPDF}
                    />
                    <Button variant="outline" as="span" disabled={uploadingPDF}>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingPDF ? 'Uploading...' : 'Upload PDF'}
                    </Button>
                  </label>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => startDetection(essayText)}
                  disabled={isDetecting || !essayText.trim() || essayText.trim().split(/\s+/).length < 50}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {isDetecting ? 'Analyzing...' : 'Analyze Text'}
                </Button>
              </CardContent>
            </Card>

            {/* Results side */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-green-300">Detection Results</CardTitle>
              </CardHeader>
              <CardContent>
                {isDetecting ? (
                  <div className="h-96 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4" />
                    <p className="text-white/70">Analyzing your text...</p>
                    <p className="text-white/50 text-sm mt-2">This may take a few moments</p>
                  </div>
                ) : detectionResult ? (
                  <div className="h-96 overflow-y-auto">
                    {/* Overall Score */}
                    <div className="mb-6">
                      <div className="text-center mb-4">
                        <div className={`text-6xl font-bold ${getScoreColor(detectionResult.overallScore)}`}>
                          {detectionResult.overallScore}%
                        </div>
                        <div className={`text-lg mt-2 ${getScoreColor(detectionResult.overallScore)}`}>
                          {getScoreLabel(detectionResult.overallScore)}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            detectionResult.overallScore < 30 ? 'bg-green-500' :
                            detectionResult.overallScore < 70 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${detectionResult.overallScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Highlighted Text Analysis (Pro/Premium) */}
                    {limits.detailedAnalysis && detectionResult.highlightedSentences && (
                      <div className="border-t border-white/10 pt-4 mt-4">
                        <h3 className="font-semibold text-white mb-3">AI Detection Highlighting</h3>
                        <div className="bg-black/40 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                          {detectionResult.highlightedSentences.map((sentence, idx) => (
                            <span key={idx}>
                              <span
                                className={`inline-block transition-all ${
                                  sentence.status === 'ai'
                                    ? 'bg-red-500/30 text-red-100 px-1 rounded border-b-2 border-red-500'
                                    : sentence.status === 'unsure'
                                    ? 'bg-yellow-500/30 text-yellow-100 px-1 rounded border-b-2 border-yellow-500'
                                    : 'bg-green-500/30 text-green-100 px-1 rounded border-b-2 border-green-500'
                                }`}
                                title={`${sentence.status === 'ai' ? 'AI-Generated' : sentence.status === 'unsure' ? 'Unsure' : 'Human-Written'} (${sentence.score}%)`}
                              >
                                {sentence.text}
                              </span>
                              {'. '}
                            </span>
                          ))}
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-red-400">
                              {detectionResult.highlightedSentences.filter(s => s.status === 'ai').length}
                            </div>
                            <div className="text-xs text-red-300 mt-1">AI Sentences</div>
                          </div>
                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                              {detectionResult.highlightedSentences.filter(s => s.status === 'unsure').length}
                            </div>
                            <div className="text-xs text-yellow-300 mt-1">Unsure</div>
                          </div>
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-green-400">
                              {detectionResult.highlightedSentences.filter(s => s.status === 'human').length}
                            </div>
                            <div className="text-xs text-green-300 mt-1">Human Sentences</div>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500/30 border-b-2 border-red-500 rounded" />
                            <span className="text-white/70">AI-Generated (70-100%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500/30 border-b-2 border-yellow-500 rounded" />
                            <span className="text-white/70">Unsure (30-69%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500/30 border-b-2 border-green-500 rounded" />
                            <span className="text-white/70">Human-Written (0-29%)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Detailed analysis (Pro/Premium) */}
                    {limits.detailedAnalysis && detectionResult.detailed && (
                      <div className="space-y-4">
                        <div className="border-t border-white/10 pt-4">
                          <h3 className="font-semibold text-white mb-3">Detailed Analysis</h3>

                          {detectionResult.detailed.sentences && (
                            <div className="bg-white/5 rounded-lg p-3 mb-3">
                              <div className="text-sm text-white/70 mb-1">Sentence Analysis</div>
                              <div className="text-white">{detectionResult.detailed.sentences}</div>
                            </div>
                          )}

                          {detectionResult.detailed.patterns && (
                            <div className="bg-white/5 rounded-lg p-3 mb-3">
                              <div className="text-sm text-white/70 mb-1">AI Patterns Found</div>
                              <ul className="list-disc list-inside text-white text-sm">
                                {detectionResult.detailed.patterns.map((pattern, idx) => (
                                  <li key={idx}>{pattern}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {detectionResult.detailed.confidence && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-sm text-white/70 mb-1">Confidence Level</div>
                              <div className="text-white">{detectionResult.detailed.confidence}%</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Multiple detectors (Pro/Premium) */}
                    {limits.multipleDetectors && detectionResult.detectors && (
                      <div className="border-t border-white/10 pt-4 mt-4">
                        <h3 className="font-semibold text-white mb-3">Multiple Detector Results</h3>
                        <div className="space-y-2">
                          {Object.entries(detectionResult.detectors).map(([name, score]) => (
                            <div key={name} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                              <span className="text-white/70 capitalize">{name}</span>
                              <span className={`font-bold ${getScoreColor(score)}`}>{score}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-6 pt-4 border-t border-white/10">
                      <Button
                        className="flex-1"
                        onClick={async () => {
                          const name = prompt('Enter a name for this essay:', selectedEssay?.name || 'Analyzed Essay')
                          if (name) {
                            await createNewEssay(name, essayText, detectionResult.overallScore)
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Save Result
                      </Button>
                      {limits.exportReport && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            const report = `AI Detection Report\n\n` +
                              `Overall Score: ${detectionResult.overallScore}%\n` +
                              `Status: ${getScoreLabel(detectionResult.overallScore)}\n` +
                              `Date: ${new Date().toLocaleDateString()}\n\n` +
                              `Text analyzed:\n${essayText}`

                            const blob = new Blob([report], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'ai-detection-report.txt'
                            a.click()
                            showToast('Report downloaded!')
                          }}
                        >
                          Export Report
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-white/40">
                    <Shield className="w-12 h-12 mb-3" />
                    <p>Your detection results will appear here</p>
                    <p className="text-sm mt-2">Enter at least 50 words for analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="font-medium text-white text-sm">Accurate</div>
                    <div className="text-xs text-white/60">Advanced AI detection</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="font-medium text-white text-sm">Private</div>
                    <div className="text-xs text-white/60">Your text stays secure</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="font-medium text-white text-sm">Fast</div>
                    <div className="text-xs text-white/60">Results in seconds</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Handle upgrade selection
  const handleUpgrade = async (planId) => {
    setShowLimitModal(false)
    showToast(`Redirecting to ${planId} checkout...`)
    // TODO: Implement Stripe checkout redirect
    // window.location.href = `/checkout?plan=${planId}`
  }

  return (
    <>
      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        feature="aiDetection"
        onUpgrade={handleUpgrade}
      />
    </>
  )
}
