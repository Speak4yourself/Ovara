import { useState, useEffect } from 'react'
import { Book, Link as LinkIcon, Film, FileText, Globe, User, Calendar, Copy, Download, Plus, Trash2, Search, BookOpen, GraduationCap } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { generateCitation as generateCitationWithChatGPT } from '../utils/openai'
import { canUseFeature, incrementUsage, getCurrentUsage } from '../utils/usageTracking'
import UsageLimitWarning from './UsageLimitWarning'
import UsageTracker from './UsageTracker'
import { Button, Card, CardHeader, CardTitle, CardContent, PageHeader, PageContainer, Input, Textarea, Select, Label } from './SharedUI'

export default function CitationGenerator({ user, userSubscription, showToast, onBack }) {
  // State
  const [citationStyle, setCitationStyle] = useState('APA') // APA, MLA, Chicago, Harvard, IEEE
  const [sourceType, setSourceType] = useState('website') // website, book, journal, video, etc.
  const [citations, setCitations] = useState([])
  const [savedCitations, setSavedCitations] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [usage, setUsage] = useState(null)
  const [showLimitWarning, setShowLimitWarning] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    // Common fields
    title: '',
    url: '',
    accessDate: new Date().toISOString().split('T')[0],

    // Authors
    authors: [{ firstName: '', lastName: '' }],

    // Website specific
    websiteName: '',
    publishDate: '',

    // Book specific
    publisher: '',
    publicationYear: '',
    edition: '',
    pages: '',

    // Journal specific
    journalName: '',
    volume: '',
    issue: '',
    doi: '',

    // Video specific
    videoSource: '', // YouTube, Vimeo, etc.
    duration: '',
  })

  // Tier limits
  const getTierLimits = () => {
    const tier = userSubscription?.tier?.toLowerCase() || 'free'
    const limits = {
      free: {
        citationsPerMonth: 10,
        savedCitations: 5,
        aiValidation: false,
        exportBibliography: false,
        batchGeneration: false,
      },
      basic: {
        citationsPerMonth: 50,
        savedCitations: 25,
        aiValidation: false,
        exportBibliography: true,
        batchGeneration: false,
      },
      pro: {
        citationsPerMonth: 200,
        savedCitations: 100,
        aiValidation: true,
        exportBibliography: true,
        batchGeneration: true,
      },
      premium: {
        citationsPerMonth: Infinity,
        savedCitations: Infinity,
        aiValidation: true,
        exportBibliography: true,
        batchGeneration: true,
      },
    }
    return limits[tier] || limits.free
  }

  const limits = getTierLimits()

  // Load saved citations and usage
  useEffect(() => {
    if (user) {
      loadSavedCitations()
      loadUsage()
    }
  }, [user])

  const loadUsage = async () => {
    try {
      const data = await getCurrentUsage()
      setUsage(data)
    } catch (error) {
      console.error('Error loading usage:', error)
    }
  }

  const loadSavedCitations = async () => {
    try {
      const { data, error } = await supabase
        .from('citations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setSavedCitations(data || [])
    } catch (error) {
      console.error('Error loading citations:', error)
    }
  }

  const generateCitation = async () => {
    if (!formData.title.trim()) {
      showToast('Please enter a title')
      return
    }

    if (formData.authors[0].lastName.trim() === '') {
      showToast('Please enter at least one author')
      return
    }

    // Check usage limits
    const canUse = await canUseFeature('citation', false)
    if (!canUse) {
      setShowLimitWarning(true)
      showToast('Citation limit reached! Upgrade to continue')
      return
    }

    setIsGenerating(true)

    try {
      // Generate citation using ChatGPT with tier
      const tier = userSubscription?.tier?.toLowerCase() || 'free'
      const citationText = await generateCitationWithChatGPT(citationStyle, sourceType, formData, tier)

      const result = {
        style: citationStyle,
        sourceType: sourceType,
        citation: citationText,
        data: formData,
        aiValidated: limits.aiValidation,
        timestamp: new Date().toISOString()
      }

      // Add to current citations
      setCitations([result, ...citations])

      // Increment usage counter
      const updatedUsage = await incrementUsage('citation', false)
      setUsage(updatedUsage)

      // Check if approaching limit
      const tier_lower = tier
      if (tier_lower === 'free') {
        const citationsUsed = updatedUsage.citations_used || 0
        const citationsLimit = updatedUsage.citations_limit || 10
        if (citationsUsed >= citationsLimit * 0.8) {
          setShowLimitWarning(true)
        }
      }

      showToast('Citation generated!')

    } catch (error) {
      console.error('Error generating citation:', error)
      showToast('Failed to generate citation. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveCitation = async (citation) => {
    if (savedCitations.length >= limits.savedCitations) {
      showToast(`You've reached your limit of ${limits.savedCitations} saved citations`)
      return
    }

    try {
      const { data, error } = await supabase
        .from('citations')
        .insert({
          user_id: user.id,
          style: citation.style,
          source_type: citation.sourceType,
          formatted_citation: citation.citation,
          source_data: citation.data,
        })
        .select()
        .single()

      if (error) throw error

      await loadSavedCitations()
      showToast('Citation saved!')
    } catch (error) {
      console.error('Error saving citation:', error)
      showToast('Failed to save citation')
    }
  }

  const deleteCitation = async (citationId) => {
    try {
      const { error } = await supabase
        .from('citations')
        .delete()
        .eq('id', citationId)
        .eq('user_id', user.id)

      if (error) throw error

      await loadSavedCitations()
      showToast('Citation deleted')
    } catch (error) {
      console.error('Error deleting citation:', error)
      showToast('Failed to delete citation')
    }
  }

  const copyCitation = (citation) => {
    navigator.clipboard.writeText(citation)
    showToast('Citation copied to clipboard!')
  }

  const exportBibliography = () => {
    if (!limits.exportBibliography) {
      showToast('Upgrade to Basic or higher to export bibliography')
      return
    }

    const bibliography = citations.map(c => c.citation).join('\n\n')
    const blob = new Blob([bibliography], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bibliography-${citationStyle.toLowerCase()}.txt`
    a.click()
    showToast('Bibliography exported!')
  }

  const addAuthor = () => {
    setFormData({
      ...formData,
      authors: [...formData.authors, { firstName: '', lastName: '' }]
    })
  }

  const removeAuthor = (index) => {
    if (formData.authors.length === 1) {
      showToast('At least one author is required')
      return
    }
    setFormData({
      ...formData,
      authors: formData.authors.filter((_, i) => i !== index)
    })
  }

  const updateAuthor = (index, field, value) => {
    const newAuthors = [...formData.authors]
    newAuthors[index][field] = value
    setFormData({ ...formData, authors: newAuthors })
  }

  const getSourceIcon = (type) => {
    switch (type) {
      case 'book': return <Book className="w-5 h-5" />
      case 'website': return <Globe className="w-5 h-5" />
      case 'journal': return <FileText className="w-5 h-5" />
      case 'video': return <Film className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const tier = userSubscription?.tier?.toLowerCase() || 'free'

  return (
    <div className="min-h-screen">
      {/* Usage Limit Warning Popup */}
      {showLimitWarning && usage && (
        <UsageLimitWarning
          usage={usage}
          feature="citation"
          isPremium={false}
          tier={tier}
          onClose={() => setShowLimitWarning(false)}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Citation Generator</h1>
            <p className="text-white/60 mt-1">Generate accurate citations in multiple formats</p>
          </div>
          <Button
            variant="outline"
            onClick={onBack}
            className="border-white/20 text-white hover:bg-white/5"
          >
            Back to Control Panel
          </Button>
        </div>

        {/* Usage Info */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-xs text-white/60">Citations this month</div>
                  <div className="text-lg font-bold text-indigo-300">
                    0 / {limits.citationsPerMonth === Infinity ? '∞' : limits.citationsPerMonth}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Saved citations</div>
                  <div className="text-lg font-bold text-indigo-300">
                    {savedCitations.length} / {limits.savedCitations === Infinity ? '∞' : limits.savedCitations}
                  </div>
                </div>
                {limits.aiValidation && (
                  <div className="flex items-center gap-2 text-purple-400">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-sm font-medium">AI Validation</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Input Form */}
          <div className="space-y-6">
            {/* Citation Style Selector */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-indigo-300">Citation Style</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE'].map(style => (
                    <button
                      key={style}
                      onClick={() => setCitationStyle(style)}
                      className={`px-4 py-2 rounded-lg text-sm transition ${
                        citationStyle === style
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/50 mt-3">
                  {citationStyle === 'APA' && 'American Psychological Association (Sciences, Social Sciences)'}
                  {citationStyle === 'MLA' && 'Modern Language Association (Humanities, Arts)'}
                  {citationStyle === 'Chicago' && 'Chicago Manual of Style (History, Arts)'}
                  {citationStyle === 'Harvard' && 'Harvard Reference System (General)'}
                  {citationStyle === 'IEEE' && 'Institute of Electrical and Electronics Engineers (Engineering)'}
                </p>
              </CardContent>
            </Card>

            {/* Source Type Selector */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-indigo-300">Source Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'website', label: 'Website', icon: <Globe className="w-4 h-4" /> },
                    { value: 'book', label: 'Book', icon: <Book className="w-4 h-4" /> },
                    { value: 'journal', label: 'Journal Article', icon: <FileText className="w-4 h-4" /> },
                    { value: 'video', label: 'Video', icon: <Film className="w-4 h-4" /> },
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setSourceType(type.value)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition ${
                        sourceType === type.value
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {type.icon}
                      {type.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Input Form */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-indigo-300">Source Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Authors */}
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Authors</label>
                    {formData.authors.map((author, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={author.firstName}
                          onChange={(e) => updateAuthor(index, 'firstName', e.target.value)}
                          className="flex-1 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                        />
                        <input
                          type="text"
                          placeholder="Last Name *"
                          value={author.lastName}
                          onChange={(e) => updateAuthor(index, 'lastName', e.target.value)}
                          className="flex-1 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                        />
                        {index > 0 && (
                          <button
                            onClick={() => removeAuthor(index)}
                            className="text-red-400 hover:text-red-300 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={addAuthor}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Author
                    </Button>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Title *</label>
                    <input
                      type="text"
                      placeholder="Enter title..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                    />
                  </div>

                  {/* Website Specific */}
                  {sourceType === 'website' && (
                    <>
                      <div>
                        <label className="block text-sm text-white/70 mb-1">Website Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Purdue OWL"
                          value={formData.websiteName}
                          onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-1">URL</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={formData.url}
                          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Publish Date</label>
                          <input
                            type="date"
                            value={formData.publishDate}
                            onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Access Date *</label>
                          <input
                            type="date"
                            value={formData.accessDate}
                            onChange={(e) => setFormData({ ...formData, accessDate: e.target.value })}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Book Specific */}
                  {sourceType === 'book' && (
                    <>
                      <div>
                        <label className="block text-sm text-white/70 mb-1">Publisher</label>
                        <input
                          type="text"
                          placeholder="e.g., Oxford University Press"
                          value={formData.publisher}
                          onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Year *</label>
                          <input
                            type="text"
                            placeholder="2024"
                            value={formData.publicationYear}
                            onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Edition</label>
                          <input
                            type="text"
                            placeholder="2nd"
                            value={formData.edition}
                            onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Pages</label>
                          <input
                            type="text"
                            placeholder="123-145"
                            value={formData.pages}
                            onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Journal Specific */}
                  {sourceType === 'journal' && (
                    <>
                      <div>
                        <label className="block text-sm text-white/70 mb-1">Journal Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Journal of Applied Psychology"
                          value={formData.journalName}
                          onChange={(e) => setFormData({ ...formData, journalName: e.target.value })}
                          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Volume</label>
                          <input
                            type="text"
                            placeholder="15"
                            value={formData.volume}
                            onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Issue</label>
                          <input
                            type="text"
                            placeholder="3"
                            value={formData.issue}
                            onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Pages</label>
                          <input
                            type="text"
                            placeholder="123-145"
                            value={formData.pages}
                            onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-1">DOI (Optional)</label>
                        <input
                          type="text"
                          placeholder="10.1037/apl0000123"
                          value={formData.doi}
                          onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                        />
                      </div>
                    </>
                  )}

                  {/* Video Specific */}
                  {sourceType === 'video' && (
                    <>
                      <div>
                        <label className="block text-sm text-white/70 mb-1">Video Source</label>
                        <input
                          type="text"
                          placeholder="e.g., YouTube, Vimeo"
                          value={formData.videoSource}
                          onChange={(e) => setFormData({ ...formData, videoSource: e.target.value })}
                          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-1">URL</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={formData.url}
                          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Publish Date</label>
                          <input
                            type="date"
                            value={formData.publishDate}
                            onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Duration</label>
                          <input
                            type="text"
                            placeholder="12:34"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <Button
                    className="w-full"
                    onClick={generateCitation}
                    disabled={isGenerating}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Citation'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Generated Citations */}
          <div className="space-y-6">
            {/* Current Citations */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-indigo-300">Generated Citations</CardTitle>
                  {citations.length > 0 && limits.exportBibliography && (
                    <Button size="sm" variant="outline" onClick={exportBibliography}>
                      <Download className="w-4 h-4 mr-1" />
                      Export All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {citations.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-white/40 mx-auto mb-3" />
                    <p className="text-white/60">No citations generated yet</p>
                    <p className="text-white/40 text-sm mt-1">Fill out the form and click Generate</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {citations.map((citation, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs text-indigo-300 font-medium">{citation.style}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copyCitation(citation.citation)}
                              className="text-white/60 hover:text-white p-1"
                              title="Copy"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => saveCitation(citation)}
                              className="text-white/60 hover:text-white p-1"
                              title="Save"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{citation.citation}</p>
                        {citation.aiValidated && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                            <GraduationCap className="w-3 h-3" />
                            <span>AI Validated</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Citations */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-indigo-300">Saved Citations ({savedCitations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {savedCitations.length === 0 ? (
                  <div className="text-center py-8">
                    <Book className="w-12 h-12 text-white/40 mx-auto mb-3" />
                    <p className="text-white/60">No saved citations</p>
                    <p className="text-white/40 text-sm mt-1">Generate and save citations to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {savedCitations.map((citation) => (
                      <div key={citation.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {getSourceIcon(citation.source_type)}
                            <span className="text-xs text-indigo-300 font-medium">{citation.style}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copyCitation(citation.formatted_citation)}
                              className="text-white/60 hover:text-white p-1"
                              title="Copy"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCitation(citation.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed">{citation.formatted_citation}</p>
                        <div className="text-xs text-white/40 mt-2">
                          {new Date(citation.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
