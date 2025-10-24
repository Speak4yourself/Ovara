import { useState, useEffect } from 'react'
import { FileText, BookOpen, GraduationCap, User, Calendar, Sparkles, Copy, Save, Download, Plus, X } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { generateEssay as generateEssayWithClaude } from '../utils/claude'
import { Button, Card, CardHeader, CardTitle, CardContent, PageHeader, PageContainer, Input, Textarea, Select, Label } from './SharedUI'

export default function EssayGenerator({ user, userSubscription, showToast, onBack }) {
  // Form state
  const [essayTitle, setEssayTitle] = useState('')
  const [essayPrompt, setEssayPrompt] = useState('')
  const [essayTheme, setEssayTheme] = useState('')
  const [essayFormat, setEssayFormat] = useState('MLA') // MLA, APA, Chicago, Harvard
  const [writingLevel, setWritingLevel] = useState('high-school') // elementary, middle-school, high-school, undergraduate, graduate
  const [className, setClassName] = useState('')
  const [studentName, setStudentName] = useState('')
  const [selectedCitations, setSelectedCitations] = useState([])
  const [customSources, setCustomSources] = useState([''])
  const [wordCount, setWordCount] = useState(500)

  // Generated essay
  const [generatedEssay, setGeneratedEssay] = useState('')
  const [generatedWorksCited, setGeneratedWorksCited] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Saved citations from user
  const [savedCitations, setSavedCitations] = useState([])
  const [showCitationPicker, setShowCitationPicker] = useState(false)

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // Load user's saved citations
  useEffect(() => {
    if (user) {
      loadSavedCitations()
    }
  }, [user])

  const loadSavedCitations = async () => {
    try {
      const { data, error } = await supabase
        .from('citations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSavedCitations(data || [])
    } catch (error) {
      console.error('Error loading citations:', error)
    }
  }

  const addCustomSource = () => {
    setCustomSources([...customSources, ''])
  }

  const updateCustomSource = (index, value) => {
    const newSources = [...customSources]
    newSources[index] = value
    setCustomSources(newSources)
  }

  const removeCustomSource = (index) => {
    setCustomSources(customSources.filter((_, i) => i !== index))
  }

  const toggleCitation = (citationId) => {
    setSelectedCitations(prev =>
      prev.includes(citationId)
        ? prev.filter(id => id !== citationId)
        : [...prev, citationId]
    )
  }

  const generateEssay = async () => {
    if (!essayTitle.trim()) {
      showToast('Please enter an essay title')
      return
    }

    if (!essayPrompt.trim()) {
      showToast('Please enter an essay prompt or topic')
      return
    }

    setIsGenerating(true)

    try {
      // Prepare citations data
      const citationsToUse = savedCitations
        .filter(c => selectedCitations.includes(c.id))
        .map(c => ({ title: c.source_data?.title || 'Unknown', author: c.source_data?.authors?.[0]?.lastName || 'Unknown' }))

      const validCustomSources = customSources.filter(s => s.trim() !== '').map(s => ({ title: s, author: 'Various' }))

      const allSources = [...citationsToUse, ...validCustomSources]

      // Use Claude to generate essay with tier
      const tier = userSubscription?.tier?.toLowerCase() || 'free'
      const essayText = await generateEssayWithClaude(
        `${essayTitle}: ${essayPrompt}${essayTheme ? ' (Theme: ' + essayTheme + ')' : ''}`,
        'argumentative',
        wordCount,
        null,
        allSources,
        tier
      )

      // Format the essay with header if student name and class are provided
      let formattedEssay = ''
      if (studentName || className) {
        formattedEssay += `${studentName || ''}\n`
        if (className) formattedEssay += `${className}\n`
        formattedEssay += `${currentDate}\n\n`
      }

      formattedEssay += essayText

      // Extract works cited section if it exists
      const worksCitedMatch = essayText.match(/(?:Works Cited|References|Bibliography)\s*\n([\s\S]+)$/i)
      if (worksCitedMatch) {
        setGeneratedWorksCited(worksCitedMatch[0])
        setGeneratedEssay(formattedEssay.replace(worksCitedMatch[0], '').trim())
      } else {
        setGeneratedEssay(formattedEssay)
        setGeneratedWorksCited('')
      }

      showToast('Essay generated successfully!')

      // Track usage
      await supabase.rpc('increment_essay_generation_count', { p_user_id: user.id }).catch(() => {
        // Silently fail if RPC doesn't exist yet
      })

    } catch (error) {
      console.error('Error generating essay:', error)
      showToast('Failed to generate essay. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveEssay = async () => {
    if (!generatedEssay) {
      showToast('No essay to save')
      return
    }

    try {
      const fullEssay = `${generatedEssay}\n\n${generatedWorksCited}`

      const { error } = await supabase
        .from('saved_essays')
        .insert({
          user_id: user.id,
          name: essayTitle,
          content: fullEssay,
          status: 'generated',
          ai_detection_score: null,
        })

      if (error) throw error

      showToast('Essay saved successfully!')
    } catch (error) {
      console.error('Error saving essay:', error)
      showToast('Failed to save essay')
    }
  }

  const copyToClipboard = () => {
    const fullText = `${generatedEssay}\n\n${generatedWorksCited}`
    navigator.clipboard.writeText(fullText)
    showToast('Essay copied to clipboard!')
  }

  const downloadEssay = () => {
    const fullText = `${generatedEssay}\n\n${generatedWorksCited}`
    const blob = new Blob([fullText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${essayTitle || 'essay'}.txt`
    a.click()
    showToast('Essay downloaded!')
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Essay Generator</h1>
            <p className="text-white/60 mt-1">Generate complete essays with citations and formatting</p>
          </div>
          <Button
            variant="outline"
            onClick={onBack}
            className="border-white/20 text-white hover:bg-white/5"
          >
            Back to Control Panel
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Input Form */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-indigo-300">Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Student Name</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Class/Course</label>
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="e.g., English 101"
                      className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Date</label>
                    <input
                      type="text"
                      value={currentDate}
                      readOnly
                      className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white/60 outline-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Essay Details */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-indigo-300">Essay Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Essay Title *</label>
                    <input
                      type="text"
                      value={essayTitle}
                      onChange={(e) => setEssayTitle(e.target.value)}
                      placeholder="Enter your essay title"
                      className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Prompt/Topic *</label>
                    <textarea
                      value={essayPrompt}
                      onChange={(e) => setEssayPrompt(e.target.value)}
                      placeholder="What is the essay about? Paste your prompt here..."
                      className="w-full h-24 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Theme (Optional)</label>
                    <input
                      type="text"
                      value={essayTheme}
                      onChange={(e) => setEssayTheme(e.target.value)}
                      placeholder="e.g., Climate change, American history"
                      className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Format</label>
                      <select
                        value={essayFormat}
                        onChange={(e) => setEssayFormat(e.target.value)}
                        className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                      >
                        <option value="MLA">MLA</option>
                        <option value="APA">APA</option>
                        <option value="Chicago">Chicago</option>
                        <option value="Harvard">Harvard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Word Count</label>
                      <input
                        type="number"
                        value={wordCount}
                        onChange={(e) => setWordCount(parseInt(e.target.value) || 500)}
                        min="100"
                        max="5000"
                        className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Writing Level</label>
                    <select
                      value={writingLevel}
                      onChange={(e) => setWritingLevel(e.target.value)}
                      className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                    >
                      <option value="elementary">Elementary School</option>
                      <option value="middle-school">Middle School</option>
                      <option value="high-school">High School</option>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="graduate">Graduate</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Citations & Sources */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-indigo-300">Citations & Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Select from saved citations */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm text-white/70">Saved Citations</label>
                      <Button size="sm" variant="outline" onClick={() => setShowCitationPicker(!showCitationPicker)}>
                        {showCitationPicker ? 'Hide' : 'Select'} ({selectedCitations.length})
                      </Button>
                    </div>
                    {showCitationPicker && (
                      <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-black/20 rounded-lg border border-white/10">
                        {savedCitations.length === 0 ? (
                          <p className="text-white/40 text-sm">No saved citations. Generate some in the Citation Generator first.</p>
                        ) : (
                          savedCitations.map(citation => (
                            <label key={citation.id} className="flex items-start gap-2 text-sm cursor-pointer hover:bg-white/5 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={selectedCitations.includes(citation.id)}
                                onChange={() => toggleCitation(citation.id)}
                                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 accent-indigo-500"
                              />
                              <span className="text-white/70 text-xs">{citation.formatted_citation}</span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Custom sources */}
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Custom Sources (URLs or titles)</label>
                    <div className="space-y-2">
                      {customSources.map((source, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={source}
                            onChange={(e) => updateCustomSource(index, e.target.value)}
                            placeholder="https://example.com or book title"
                            className="flex-1 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                          />
                          {customSources.length > 1 && (
                            <button
                              onClick={() => removeCustomSource(index)}
                              className="text-red-400 hover:text-red-300 p-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" onClick={addCustomSource} className="mt-2">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Source
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={generateEssay}
              disabled={isGenerating}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isGenerating ? 'Generating Essay...' : 'Generate Essay'}
            </Button>
          </div>

          {/* Right: Generated Essay */}
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-indigo-300">Generated Essay</CardTitle>
                  {generatedEssay && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={copyToClipboard}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={saveEssay}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={downloadEssay}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!generatedEssay && !isGenerating ? (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60">Fill out the form and click Generate Essay</p>
                    <p className="text-white/40 text-sm mt-2">Your essay will appear here with proper formatting and citations</p>
                  </div>
                ) : isGenerating ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-white/60">Generating your essay...</p>
                    <p className="text-white/40 text-sm mt-2">This may take a minute</p>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <div className="bg-black/20 rounded-lg p-6 border border-white/10">
                      <pre className="whitespace-pre-wrap text-white/90 text-sm font-serif leading-relaxed">
                        {generatedEssay}
                      </pre>
                      {generatedWorksCited && (
                        <>
                          <div className="border-t border-white/10 my-6"></div>
                          <pre className="whitespace-pre-wrap text-white/90 text-sm font-serif leading-relaxed">
                            {generatedWorksCited}
                          </pre>
                        </>
                      )}
                    </div>
                    <div className="mt-4 text-xs text-white/40">
                      Word count: {generatedEssay.split(/\s+/).length} • Format: {essayFormat}
                    </div>
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
