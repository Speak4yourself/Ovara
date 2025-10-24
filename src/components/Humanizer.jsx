import { useState, useEffect } from 'react'
import { FileText, Upload, Sparkles, Clock, Users, AlertCircle, CheckCircle, Edit2, Trash2, Download, X } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { humanizeText } from '../utils/customHumanizer'
import { detectAIAdvanced } from '../utils/customAIDetector'
import UsageLimitModal from './UsageLimitModal'
import { Button, Card, CardHeader, CardTitle, CardContent, PageHeader, PageContainer, Input, Textarea, Select, Label } from './SharedUI'

export default function Humanizer({ user, userSubscription, showToast, onBack }) {
  // Navigation state
  const [view, setView] = useState('choice') // 'choice', 'savedEssays', 'generate', 'humanizer'

  // Essay state
  const [essays, setEssays] = useState([])
  const [selectedEssay, setSelectedEssay] = useState(null)
  const [essayText, setEssayText] = useState('')
  const [essayFilter, setEssayFilter] = useState('all') // 'all', 'generated', 'humanized', 'detected'

  // Humanizer state
  const [isHumanizing, setIsHumanizing] = useState(false)
  const [humanizedText, setHumanizedText] = useState('')
  const [queuePosition, setQueuePosition] = useState(null)
  const [queueEstimate, setQueueEstimate] = useState(null)
  const [originalAIScore, setOriginalAIScore] = useState(null)
  const [humanizedAIScore, setHumanizedAIScore] = useState(null)
  const [humanizationLevel, setHumanizationLevel] = useState('medium')

  // Rename modal state
  const [renameModal, setRenameModal] = useState(false)
  const [renameEssayId, setRenameEssayId] = useState(null)
  const [newEssayName, setNewEssayName] = useState('')

  // Upload state
  const [uploadingPDF, setUploadingPDF] = useState(false)

  // Writing style samples (Pro/Premium only)
  const [styleSamples, setStyleSamples] = useState([])
  const [uploadingStyleSample, setUploadingStyleSample] = useState(false)

  // Usage limit modal state
  const [showLimitModal, setShowLimitModal] = useState(false)

  // Tier limits
  const getTierLimits = () => {
    const tier = userSubscription?.tier?.toLowerCase() || 'free'

    const limits = {
      free: {
        humanizationsPerWeek: 3,
        queueSize: 3,
        savedEssays: 1,
        canUploadStyleSamples: false,
        styleSampleLimit: 0,
        skipQueue: false,
        doubleCheck: false,
      },
      basic: {
        humanizationsPerWeek: 20,
        queueSize: 10,
        savedEssays: 10,
        canUploadStyleSamples: false,
        styleSampleLimit: 0,
        skipQueue: false,
        doubleCheck: false,
      },
      pro: {
        humanizationsPerWeek: 100,
        queueSize: 50,
        savedEssays: 50,
        canUploadStyleSamples: true,
        styleSampleLimit: 5,
        skipQueue: false,
        doubleCheck: false,
      },
      premium: {
        humanizationsPerWeek: Infinity,
        queueSize: 1,
        savedEssays: Infinity,
        canUploadStyleSamples: true,
        styleSampleLimit: 5,
        skipQueue: true,
        doubleCheck: true,
      },
    }

    return limits[tier] || limits.free
  }

  const limits = getTierLimits()

  // Load essays on mount
  useEffect(() => {
    if (user) {
      loadEssays()
      loadStyleSamples()
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

  const loadStyleSamples = async () => {
    if (!limits.canUploadStyleSamples) return

    try {
      const { data, error } = await supabase
        .from('writing_style_samples')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limits.styleSampleLimit)

      if (error) {
        console.error('Error loading style samples:', error)
        return
      }

      setStyleSamples(data || [])
    } catch (error) {
      console.error('Error in loadStyleSamples:', error)
    }
  }

  const createNewEssay = async (name, content, status = 'generated') => {
    if (essays.length >= limits.savedEssays) {
      setShowLimitModal(true)
      return null
    }

    try {
      const { data, error } = await supabase
        .from('saved_essays')
        .insert({
          user_id: user.id,
          name: name,
          content: content,
          status: status,
          ai_detection_score: null,
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
      // In a real implementation, you'd extract text from the PDF
      // For now, we'll simulate it
      showToast('PDF upload coming soon! For now, paste text manually.')

      // TODO: Implement PDF text extraction
      // const formData = new FormData()
      // formData.append('file', file)
      // const response = await fetch('/api/extract-pdf', { method: 'POST', body: formData })
      // const { text } = await response.json()

    } catch (error) {
      console.error('Error uploading PDF:', error)
      showToast('Failed to upload PDF')
    } finally {
      setUploadingPDF(false)
    }
  }

  const handleStyleSampleUpload = async (essayId) => {
    if (styleSamples.length >= limits.styleSampleLimit) {
      showToast(`You've reached your limit of ${limits.styleSampleLimit} style samples`)
      return
    }

    const essay = essays.find(e => e.id === essayId)
    if (!essay) return

    setUploadingStyleSample(true)

    try {
      const { data, error } = await supabase
        .from('writing_style_samples')
        .insert({
          user_id: user.id,
          essay_id: essayId,
          content: essay.content,
        })
        .select()
        .single()

      if (error) throw error

      await loadStyleSamples()
      showToast('Added to writing style samples!')
    } catch (error) {
      console.error('Error adding style sample:', error)
      showToast('Failed to add style sample')
    } finally {
      setUploadingStyleSample(false)
    }
  }

  const removeStyleSample = async (sampleId) => {
    if (!confirm('Remove this essay from your style samples?')) return

    try {
      const { error } = await supabase
        .from('writing_style_samples')
        .delete()
        .eq('id', sampleId)
        .eq('user_id', user.id)

      if (error) throw error

      await loadStyleSamples()
      showToast('Style sample removed')
    } catch (error) {
      console.error('Error removing style sample:', error)
      showToast('Failed to remove style sample')
    }
  }

  const startHumanization = async (text) => {
    if (!text || text.trim().length === 0) {
      showToast('Please enter some text to humanize')
      return
    }

    setIsHumanizing(true)
    setQueuePosition(limits.skipQueue ? 0 : 1)
    setQueueEstimate(limits.skipQueue ? 0 : 1)

    try {
      // Use the selected humanization level
      const result = humanizeText(text, humanizationLevel)

      setHumanizedText(result.humanized)

      // Store the before/after scores
      setOriginalAIScore(result.beforeScore)
      setHumanizedAIScore(result.afterScore)

      setQueuePosition(null)
      setQueueEstimate(null)

      // Show improvement in toast
      const improvement = result.beforeScore - result.afterScore
      showToast(`Humanization complete! AI score reduced by ${improvement}%`)

      // Track usage
      await supabase.rpc('increment_humanization_count', { p_user_id: user.id }).catch(() => {
        // Silently fail if RPC doesn't exist yet
      })

    } catch (error) {
      console.error('Error starting humanization:', error)
      showToast('Failed to humanize text. Please try again.')
    } finally {
      setIsHumanizing(false)
    }
  }

  const filteredEssays = essays.filter(essay => {
    if (essayFilter === 'all') return true
    if (essayFilter === 'generated') return essay.status === 'generated'
    if (essayFilter === 'humanized') return essay.status === 'humanized'
    if (essayFilter === 'detected') return essay.ai_detection_score && essay.ai_detection_score > 50
    return true
  })

  // CHOICE VIEW - Select Saved Essay or Generate New
  if (view === 'choice') {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Humanizer</h1>
              <p className="text-white/60 mt-1">Make AI text sound natural and human-like</p>
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
                    <div className="text-xs text-white/60">Humanizations this week</div>
                    <div className="text-lg font-bold text-indigo-300">
                      0 / {limits.humanizationsPerWeek === Infinity ? '∞' : limits.humanizationsPerWeek}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60">Saved essays</div>
                    <div className="text-lg font-bold text-indigo-300">
                      {essays.length} / {limits.savedEssays === Infinity ? '∞' : limits.savedEssays}
                    </div>
                  </div>
                  {limits.skipQueue && (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">Skip Queue Enabled</span>
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
                  Select from your saved essays to humanize
                </p>
                <div className="text-2xl font-bold text-white">{essays.length} Essays</div>
                <Button className="w-full mt-4" variant="outline">
                  Browse Saved Essays
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-white/20 transition cursor-pointer"
                  onClick={() => setView('humanizer')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-500/20 p-3">
                    <Sparkles className="w-6 h-6 text-purple-300" />
                  </div>
                  <CardTitle className="text-purple-300">New Essay</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 text-sm mb-4">
                  Paste or upload text to humanize right away
                </p>
                <div className="text-2xl font-bold text-white">Start Fresh</div>
                <Button className="w-full mt-4" variant="outline">
                  Humanize New Text
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Writing Style Samples (Pro/Premium only) */}
          {limits.canUploadStyleSamples && (
            <Card className="bg-white/5 border-white/10 mt-6">
              <CardHeader>
                <CardTitle className="text-indigo-300">Writing Style Samples</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 text-sm mb-4">
                  Upload up to {limits.styleSampleLimit} of your own essays so the humanizer can match your writing style.
                </p>
                <div className="grid md:grid-cols-5 gap-3">
                  {styleSamples.map((sample, idx) => (
                    <div key={sample.id} className="relative bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-white/60 mb-1">Sample {idx + 1}</div>
                      <div className="text-sm text-white truncate">{sample.content.substring(0, 30)}...</div>
                      <button
                        onClick={() => removeStyleSample(sample.id)}
                        className="absolute top-1 right-1 text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {Array.from({ length: limits.styleSampleLimit - styleSamples.length }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="bg-white/5 rounded-lg p-3 border border-dashed border-white/20 flex items-center justify-center">
                      <span className="text-white/40 text-xs">Empty Slot</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/50 mt-3">
                  To add samples, go to Saved Essays and select "Add to Style Samples" on any essay.
                </p>
              </CardContent>
            </Card>
          )}
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
              onClick={() => setEssayFilter('generated')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                essayFilter === 'generated'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Generated ({essays.filter(e => e.status === 'generated').length})
            </button>
            <button
              onClick={() => setEssayFilter('humanized')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                essayFilter === 'humanized'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Humanized ({essays.filter(e => e.status === 'humanized').length})
            </button>
            <button
              onClick={() => setEssayFilter('detected')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                essayFilter === 'detected'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              AI Detected ({essays.filter(e => e.ai_detection_score && e.ai_detection_score > 50).length})
            </button>
          </div>

          {/* Essays grid */}
          {filteredEssays.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/60">No essays found. Create one to get started!</p>
                <Button className="mt-4" onClick={() => setView('humanizer')}>
                  Create New Essay
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
                    <div className="flex items-center gap-2 mt-2">
                      {essay.status === 'humanized' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">
                          Humanized
                        </span>
                      )}
                      {essay.status === 'generated' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                          Generated
                        </span>
                      )}
                      {essay.ai_detection_score !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          essay.ai_detection_score > 70 ? 'bg-red-500/20 text-red-300' :
                          essay.ai_detection_score > 40 ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {essay.ai_detection_score}% AI
                        </span>
                      )}
                    </div>
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
                          setView('humanizer')
                        }}
                      >
                        Humanize
                      </Button>
                      {limits.canUploadStyleSamples && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          disabled={styleSamples.length >= limits.styleSampleLimit || uploadingStyleSample}
                          onClick={() => handleStyleSampleUpload(essay.id)}
                        >
                          Add to Style Samples
                        </Button>
                      )}
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

  // HUMANIZER VIEW
  if (view === 'humanizer') {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Humanizer</h1>
              <p className="text-white/60 mt-1">Transform AI text into natural, human-like writing</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setView('choice')
                setEssayText('')
                setHumanizedText('')
                setSelectedEssay(null)
                setOriginalAIScore(null)
                setHumanizedAIScore(null)
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
                  <CardTitle className="text-indigo-300">Original Text</CardTitle>
                  {selectedEssay && (
                    <span className="text-xs text-white/60">From: {selectedEssay.name}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <textarea
                  value={essayText}
                  onChange={(e) => {
                    setEssayText(e.target.value)
                    // Clear scores when text changes
                    setOriginalAIScore(null)
                    setHumanizedAIScore(null)
                    setHumanizedText('')
                  }}
                  placeholder="Paste your text here or upload a PDF..."
                  className="w-full h-96 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400 resize-none"
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-white/60">
                    {essayText.length} characters
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

                {/* Humanization level selector */}
                <div className="mt-4 space-y-2">
                  <label className="text-sm text-white/70">Humanization Level:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setHumanizationLevel('light')}
                      className={`px-3 py-2 rounded-lg text-sm transition ${
                        humanizationLevel === 'light'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setHumanizationLevel('medium')}
                      className={`px-3 py-2 rounded-lg text-sm transition ${
                        humanizationLevel === 'medium'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => setHumanizationLevel('heavy')}
                      className={`px-3 py-2 rounded-lg text-sm transition ${
                        humanizationLevel === 'heavy'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      Heavy
                    </button>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    {humanizationLevel === 'light' && 'Subtle changes to reduce AI detection'}
                    {humanizationLevel === 'medium' && 'Balanced humanization for natural flow'}
                    {humanizationLevel === 'heavy' && 'Maximum humanization (may alter meaning)'}
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const result = detectAIAdvanced(essayText)
                      setOriginalAIScore(result.score)
                      showToast(`AI Detection: ${result.score}% - ${result.confidence} confidence`)
                    }}
                    disabled={!essayText.trim()}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Check AI Score
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => startHumanization(essayText)}
                    disabled={isHumanizing || !essayText.trim()}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isHumanizing ? 'Humanizing...' : 'Humanize Text'}
                  </Button>
                </div>

                {/* Show original AI score if text is analyzed */}
                {originalAIScore !== null && !isHumanizing && (
                  <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Original AI Detection:</span>
                      <span className={`text-sm font-bold ${
                        originalAIScore > 70 ? 'text-red-400' :
                        originalAIScore > 40 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {originalAIScore}% AI
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Output side */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-purple-300">Humanized Text</CardTitle>
              </CardHeader>
              <CardContent>
                {isHumanizing ? (
                  <div className="h-96 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4" />
                    <p className="text-white/70 mb-2">Humanizing your text...</p>
                    {queuePosition !== null && (
                      <div className="text-center">
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Users className="w-4 h-4" />
                          <span>Queue position: {queuePosition}</span>
                        </div>
                        {queueEstimate !== null && (
                          <div className="flex items-center gap-2 text-white/60 text-sm mt-1">
                            <Clock className="w-4 h-4" />
                            <span>Estimated wait: ~{queueEstimate} min</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : humanizedText ? (
                  <>
                    <textarea
                      value={humanizedText}
                      readOnly
                      className="w-full h-96 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none resize-none"
                    />

                    {/* Show AI score comparison */}
                    {originalAIScore !== null && humanizedAIScore !== null && (
                      <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white/70">Before:</span>
                            <span className={`text-sm font-bold ${
                              originalAIScore > 70 ? 'text-red-400' :
                              originalAIScore > 40 ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              {originalAIScore}% AI
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white/70">After:</span>
                            <span className={`text-sm font-bold ${
                              humanizedAIScore > 70 ? 'text-red-400' :
                              humanizedAIScore > 40 ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              {humanizedAIScore}% AI
                            </span>
                          </div>
                          <div className="border-t border-white/10 pt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white/70">Improvement:</span>
                              <span className="text-sm font-bold text-indigo-400">
                                -{originalAIScore - humanizedAIScore}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          navigator.clipboard.writeText(humanizedText)
                          showToast('Copied to clipboard!')
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copy Text
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={async () => {
                          const name = prompt('Enter a name for this essay:', selectedEssay?.name || 'Humanized Essay')
                          if (name) {
                            await createNewEssay(name, humanizedText, 'humanized')
                          }
                        }}
                      >
                        Save Essay
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-white/40">
                    <Sparkles className="w-12 h-12 mb-3" />
                    <p>Your humanized text will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Premium double-check info */}
          {limits.doubleCheck && (
            <Card className="bg-gradient-to-r from-yellow-500/10 to-purple-500/10 border-yellow-400/30 mt-6">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="font-medium text-yellow-300">Premium Double-Check Enabled</div>
                    <div className="text-sm text-white/70">
                      Your humanized text will be automatically checked for AI detection before delivery
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
        feature="humanization"
        onUpgrade={handleUpgrade}
      />
    </>
  )
}
