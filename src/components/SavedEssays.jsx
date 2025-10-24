import { useState, useEffect } from 'react'
import { FileText, Upload, Search, Edit2, Trash2, Download, X, Filter, Plus, CheckCircle, AlertCircle, Sparkles, Shield, Book, Copy, Globe, Film } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { Button, Card, CardHeader, CardTitle, CardContent, PageHeader, PageContainer, Input, Textarea, Select, Label } from './SharedUI'

export default function SavedEssays({ user, userSubscription, showToast, onBack }) {
  // State
  const [activeTab, setActiveTab] = useState('essays') // 'essays' or 'citations'
  const [essays, setEssays] = useState([])
  const [citations, setCitations] = useState([])
  const [filteredEssays, setFilteredEssays] = useState([])
  const [filteredCitations, setFilteredCitations] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'generated', 'humanized', 'safe', 'suspicious', 'ai_detected'
  const [citationStyleFilter, setCitationStyleFilter] = useState('all') // 'all', 'APA', 'MLA', 'Chicago', etc.
  const [sortBy, setSortBy] = useState('date') // 'date', 'name', 'score'
  const [selectedEssays, setSelectedEssays] = useState([])
  const [selectedCitations, setSelectedCitations] = useState([])

  // Modal states
  const [uploadModal, setUploadModal] = useState(false)
  const [renameModal, setRenameModal] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [newEssayModal, setNewEssayModal] = useState(false)

  // Form states
  const [uploadingPDF, setUploadingPDF] = useState(false)
  const [newEssayName, setNewEssayName] = useState('')
  const [newEssayContent, setNewEssayContent] = useState('')
  const [currentEssay, setCurrentEssay] = useState(null)

  // Tier limits
  const getTierLimits = () => {
    const tier = userSubscription?.tier?.toLowerCase() || 'free'
    const limits = {
      free: { savedEssays: 1 },
      basic: { savedEssays: 10 },
      pro: { savedEssays: 50 },
      premium: { savedEssays: Infinity },
    }
    return limits[tier] || limits.free
  }

  const limits = getTierLimits()

  // Load essays and citations
  useEffect(() => {
    if (user) {
      loadEssays()
      loadCitations()
    }
  }, [user])

  // Filter and sort essays
  useEffect(() => {
    let result = [...essays]

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(essay => {
        if (statusFilter === 'generated') return essay.status === 'generated'
        if (statusFilter === 'humanized') return essay.status === 'humanized'
        if (statusFilter === 'safe') return essay.ai_detection_score !== null && essay.ai_detection_score < 30
        if (statusFilter === 'suspicious') return essay.ai_detection_score !== null && essay.ai_detection_score >= 30 && essay.ai_detection_score < 70
        if (statusFilter === 'ai_detected') return essay.ai_detection_score !== null && essay.ai_detection_score >= 70
        return true
      })
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(essay =>
        essay.name.toLowerCase().includes(query) ||
        essay.content.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'score') {
      result.sort((a, b) => (b.ai_detection_score || 0) - (a.ai_detection_score || 0))
    }

    setFilteredEssays(result)
  }, [essays, statusFilter, searchQuery, sortBy])

  // Filter and sort citations
  useEffect(() => {
    let result = [...citations]

    // Apply style filter
    if (citationStyleFilter !== 'all') {
      result = result.filter(citation => citation.style === citationStyleFilter)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(citation =>
        citation.formatted_citation.toLowerCase().includes(query)
      )
    }

    // Sort by date (most recent first)
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    setFilteredCitations(result)
  }, [citations, citationStyleFilter, searchQuery])

  const loadEssays = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_essays')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEssays(data || [])
    } catch (error) {
      console.error('Error loading essays:', error)
      showToast('Failed to load essays')
    }
  }

  const loadCitations = async () => {
    try {
      const { data, error } = await supabase
        .from('citations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCitations(data || [])
    } catch (error) {
      console.error('Error loading citations:', error)
      showToast('Failed to load citations')
    }
  }

  const handlePDFUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      showToast('Please upload a valid PDF file')
      return
    }

    if (essays.length >= limits.savedEssays) {
      showToast(`You've reached your limit of ${limits.savedEssays} saved essays. Delete some or upgrade!`)
      return
    }

    setUploadingPDF(true)

    try {
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

      const { text, wordCount, fileName } = await response.json()

      // Create essay with extracted text
      const essayName = fileName.replace('.pdf', '') || 'Untitled Essay'

      const { data, error } = await supabase
        .from('saved_essays')
        .insert({
          user_id: user.id,
          name: essayName,
          content: text,
          status: 'generated',
          ai_detection_score: null,
        })
        .select()
        .single()

      if (error) throw error

      await loadEssays()
      showToast(`PDF uploaded! ${wordCount} words extracted.`)
      setUploadModal(false)

    } catch (error) {
      console.error('Error uploading PDF:', error)
      showToast('Failed to extract PDF text. Please try copying text manually.')
    } finally {
      setUploadingPDF(false)
    }
  }

  const createNewEssay = async () => {
    if (!newEssayName.trim()) {
      showToast('Please enter an essay name')
      return
    }

    if (!newEssayContent.trim()) {
      showToast('Please enter some content')
      return
    }

    if (essays.length >= limits.savedEssays) {
      showToast(`You've reached your limit of ${limits.savedEssays} saved essays`)
      return
    }

    try {
      const { data, error } = await supabase
        .from('saved_essays')
        .insert({
          user_id: user.id,
          name: newEssayName.trim(),
          content: newEssayContent.trim(),
          status: 'generated',
          ai_detection_score: null,
        })
        .select()
        .single()

      if (error) throw error

      await loadEssays()
      showToast('Essay created successfully!')
      setNewEssayModal(false)
      setNewEssayName('')
      setNewEssayContent('')
    } catch (error) {
      console.error('Error creating essay:', error)
      showToast('Failed to create essay')
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
      setSelectedEssays(selectedEssays.filter(id => id !== essayId))
      showToast('Essay deleted')
    } catch (error) {
      console.error('Error deleting essay:', error)
      showToast('Failed to delete essay')
    }
  }

  const deleteSelectedEssays = async () => {
    if (selectedEssays.length === 0) return
    if (!confirm(`Delete ${selectedEssays.length} selected essays?`)) return

    try {
      const { error } = await supabase
        .from('saved_essays')
        .delete()
        .in('id', selectedEssays)
        .eq('user_id', user.id)

      if (error) throw error

      await loadEssays()
      setSelectedEssays([])
      showToast(`${selectedEssays.length} essays deleted`)
    } catch (error) {
      console.error('Error deleting essays:', error)
      showToast('Failed to delete essays')
    }
  }

  const exportEssay = (essay) => {
    const content = `${essay.name}\n\n${essay.content}\n\n---\nCreated: ${new Date(essay.created_at).toLocaleDateString()}\nStatus: ${essay.status}\nAI Score: ${essay.ai_detection_score || 'N/A'}%`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${essay.name}.txt`
    a.click()
    showToast('Essay exported!')
  }

  const exportSelectedEssays = () => {
    if (selectedEssays.length === 0) return

    const selectedData = essays.filter(e => selectedEssays.includes(e.id))
    const content = selectedData.map(essay =>
      `${essay.name}\n${'='.repeat(essay.name.length)}\n\n${essay.content}\n\nCreated: ${new Date(essay.created_at).toLocaleDateString()}\nStatus: ${essay.status}\nAI Score: ${essay.ai_detection_score || 'N/A'}%\n\n${'='.repeat(80)}\n\n`
    ).join('')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `essays-export-${Date.now()}.txt`
    a.click()
    showToast(`${selectedEssays.length} essays exported!`)
  }

  const getScoreColor = (score) => {
    if (score === null) return 'text-gray-400'
    if (score < 30) return 'text-green-400'
    if (score < 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBgColor = (score) => {
    if (score === null) return 'bg-gray-500/20'
    if (score < 30) return 'bg-green-500/20'
    if (score < 70) return 'bg-yellow-500/20'
    return 'bg-red-500/20'
  }

  const getStatusBadge = (essay) => {
    if (essay.ai_detection_score !== null) {
      const score = essay.ai_detection_score
      if (score < 30) return { text: 'Safe', color: 'bg-green-500/20 text-green-300' }
      if (score < 70) return { text: 'Suspicious', color: 'bg-yellow-500/20 text-yellow-300' }
      return { text: 'AI Detected', color: 'bg-red-500/20 text-red-300' }
    }
    if (essay.status === 'humanized') return { text: 'Humanized', color: 'bg-purple-500/20 text-purple-300' }
    return { text: 'Generated', color: 'bg-blue-500/20 text-blue-300' }
  }

  const toggleSelectEssay = (essayId) => {
    setSelectedEssays(prev =>
      prev.includes(essayId)
        ? prev.filter(id => id !== essayId)
        : [...prev, essayId]
    )
  }

  const selectAllEssays = () => {
    if (selectedEssays.length === filteredEssays.length) {
      setSelectedEssays([])
    } else {
      setSelectedEssays(filteredEssays.map(e => e.id))
    }
  }

  // Citation functions
  const copyCitation = (citation) => {
    navigator.clipboard.writeText(citation)
    showToast('Citation copied to clipboard!')
  }

  const deleteCitation = async (citationId) => {
    if (!confirm('Are you sure you want to delete this citation?')) return

    try {
      const { error } = await supabase
        .from('citations')
        .delete()
        .eq('id', citationId)
        .eq('user_id', user.id)

      if (error) throw error

      await loadCitations()
      setSelectedCitations(selectedCitations.filter(id => id !== citationId))
      showToast('Citation deleted')
    } catch (error) {
      console.error('Error deleting citation:', error)
      showToast('Failed to delete citation')
    }
  }

  const deleteSelectedCitations = async () => {
    if (selectedCitations.length === 0) return
    if (!confirm(`Delete ${selectedCitations.length} selected citations?`)) return

    try {
      const { error } = await supabase
        .from('citations')
        .delete()
        .in('id', selectedCitations)
        .eq('user_id', user.id)

      if (error) throw error

      await loadCitations()
      setSelectedCitations([])
      showToast(`${selectedCitations.length} citations deleted`)
    } catch (error) {
      console.error('Error deleting citations:', error)
      showToast('Failed to delete citations')
    }
  }

  const exportCitations = () => {
    if (selectedCitations.length === 0) return

    const selectedData = citations.filter(c => selectedCitations.includes(c.id))
    const content = selectedData.map(citation =>
      `[${citation.style}] ${citation.source_type}\n${citation.formatted_citation}\n\n`
    ).join('')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `citations-export-${Date.now()}.txt`
    a.click()
    showToast(`${selectedCitations.length} citations exported!`)
  }

  const toggleSelectCitation = (citationId) => {
    setSelectedCitations(prev =>
      prev.includes(citationId)
        ? prev.filter(id => id !== citationId)
        : [...prev, citationId]
    )
  }

  const selectAllCitations = () => {
    if (selectedCitations.length === filteredCitations.length) {
      setSelectedCitations([])
    } else {
      setSelectedCitations(filteredCitations.map(c => c.id))
    }
  }

  const getSourceIcon = (type) => {
    switch (type) {
      case 'book': return <Book className="w-4 h-4" />
      case 'website': return <Globe className="w-4 h-4" />
      case 'journal': return <FileText className="w-4 h-4" />
      case 'video': return <Film className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Saved Content</h1>
            <p className="text-white/60 mt-1">
              {activeTab === 'essays'
                ? `${essays.length} / ${limits.savedEssays === Infinity ? '∞' : limits.savedEssays} essays saved`
                : `${citations.length} citations saved`
              }
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onBack}
            className="border-white/20 text-white hover:bg-white/5"
          >
            Back to Control Panel
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('essays'); setSearchQuery(''); }}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition ${
              activeTab === 'essays' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            Essays ({essays.length})
          </button>
          <button
            onClick={() => { setActiveTab('citations'); setSearchQuery(''); }}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition ${
              activeTab === 'citations' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <Book className="w-4 h-4 inline-block mr-2" />
            Citations ({citations.length})
          </button>
        </div>

        {/* Action Bar */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={activeTab === 'essays' ? "Search essays..." : "Search citations..."}
                    className="w-full pl-10 pr-4 py-2 rounded-md bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-400"
                  />
                </div>

                {/* Sort/Filter - Only for essays */}
                {activeTab === 'essays' && (
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 rounded-md bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-400"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="name">Sort by Name</option>
                    <option value="score">Sort by AI Score</option>
                  </select>
                )}

                {/* Style Filter - Only for citations */}
                {activeTab === 'citations' && (
                  <select
                    value={citationStyleFilter}
                    onChange={(e) => setCitationStyleFilter(e.target.value)}
                    className="px-4 py-2 rounded-md bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-400"
                  >
                    <option value="all">All Styles</option>
                    <option value="APA">APA</option>
                    <option value="MLA">MLA</option>
                    <option value="Chicago">Chicago</option>
                    <option value="Harvard">Harvard</option>
                    <option value="IEEE">IEEE</option>
                  </select>
                )}
              </div>

              {activeTab === 'essays' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setNewEssayModal(true)}
                    disabled={essays.length >= limits.savedEssays}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Essay
                  </Button>
                  <Button
                    onClick={() => setUploadModal(true)}
                    disabled={essays.length >= limits.savedEssays}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload PDF
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters - Only show for essays tab */}
        {activeTab === 'essays' && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  statusFilter === 'all' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                All ({essays.length})
              </button>
            <button
              onClick={() => setStatusFilter('generated')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                statusFilter === 'generated' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Generated ({essays.filter(e => e.status === 'generated').length})
            </button>
            <button
              onClick={() => setStatusFilter('humanized')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                statusFilter === 'humanized' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Humanized ({essays.filter(e => e.status === 'humanized').length})
            </button>
            <button
              onClick={() => setStatusFilter('safe')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                statusFilter === 'safe' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Safe ({essays.filter(e => e.ai_detection_score !== null && e.ai_detection_score < 30).length})
            </button>
            <button
              onClick={() => setStatusFilter('suspicious')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                statusFilter === 'suspicious' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Suspicious ({essays.filter(e => e.ai_detection_score !== null && e.ai_detection_score >= 30 && e.ai_detection_score < 70).length})
            </button>
            <button
              onClick={() => setStatusFilter('ai_detected')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                statusFilter === 'ai_detected' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              AI Detected ({essays.filter(e => e.ai_detection_score !== null && e.ai_detection_score >= 70).length})
            </button>
          </div>

          {selectedEssays.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">{selectedEssays.length} selected</span>
              <Button size="sm" variant="outline" onClick={exportSelectedEssays}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button size="sm" variant="danger" onClick={deleteSelectedEssays}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
          </div>
        )}

        {/* Bulk Actions for Citations */}
        {activeTab === 'citations' && selectedCitations.length > 0 && (
          <div className="flex items-center justify-end gap-2 mb-6">
            <span className="text-white/60 text-sm">{selectedCitations.length} selected</span>
            <Button size="sm" variant="outline" onClick={exportCitations}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button size="sm" variant="danger" onClick={deleteSelectedCitations}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        )}

        {/* Essays List */}
        {activeTab === 'essays' && (
          filteredEssays.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 text-lg mb-2">No essays found</p>
              <p className="text-white/40 text-sm mb-6">
                {searchQuery ? 'Try a different search term' : 'Upload a PDF or create a new essay to get started'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setNewEssayModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Essay
                </Button>
                <Button variant="outline" onClick={() => setUploadModal(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={selectedEssays.length === filteredEssays.length && filteredEssays.length > 0}
                  onChange={selectAllEssays}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 accent-indigo-500"
                />
                Select all {filteredEssays.length} essays
              </label>
            </div>

            {/* Essays Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEssays.map((essay) => {
                const statusBadge = getStatusBadge(essay)
                return (
                  <Card key={essay.id} className="bg-white/5 border-white/10 hover:border-white/20 transition">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedEssays.includes(essay.id)}
                          onChange={() => toggleSelectEssay(essay.id)}
                          className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 accent-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-white truncate">{essay.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                              {statusBadge.text}
                            </span>
                            {essay.ai_detection_score !== null && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getScoreBgColor(essay.ai_detection_score)} ${getScoreColor(essay.ai_detection_score)}`}>
                                {essay.ai_detection_score}% AI
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setCurrentEssay(essay)
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
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/70 text-sm line-clamp-3 mb-4">
                        {essay.content}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setCurrentEssay(essay)
                            setViewModal(true)
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportEssay(essay)}
                          title="Export"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-white/40 mt-3">
                        {new Date(essay.created_at).toLocaleDateString()} • {essay.content.split(/\s+/).length} words
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )
        )}

        {/* Citations List */}
        {activeTab === 'citations' && (
          filteredCitations.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-16 text-center">
                <Book className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 text-lg mb-2">No citations found</p>
                <p className="text-white/40 text-sm">
                  {searchQuery ? 'Try a different search term' : 'Generate citations in the Citation Generator to save them here'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Select All */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={selectedCitations.length === filteredCitations.length && filteredCitations.length > 0}
                    onChange={selectAllCitations}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 accent-indigo-500"
                  />
                  Select all {filteredCitations.length} citations
                </label>
              </div>

              {/* Citations Grid */}
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredCitations.map((citation) => (
                  <Card key={citation.id} className="bg-white/5 border-white/10 hover:border-white/20 transition">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCitations.includes(citation.id)}
                          onChange={() => toggleSelectCitation(citation.id)}
                          className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 accent-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getSourceIcon(citation.source_type)}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                              {citation.style}
                            </span>
                            <span className="text-xs text-white/50 capitalize">
                              {citation.source_type}
                            </span>
                          </div>
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
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {citation.formatted_citation}
                      </p>
                      <div className="text-xs text-white/40 mt-3">
                        {new Date(citation.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )
        )}
      </div>

      {/* Upload PDF Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <Card className="bg-[#0b0c10] border-white/20 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/70 mb-2">Drag and drop or click to upload</p>
                  <p className="text-white/40 text-xs mb-4">Maximum file size: 10MB</p>
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
                    <Button as="span" disabled={uploadingPDF}>
                      {uploadingPDF ? 'Uploading...' : 'Select PDF File'}
                    </Button>
                  </label>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setUploadModal(false)}
                  disabled={uploadingPDF}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Essay Modal */}
      {newEssayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <Card className="bg-[#0b0c10] border-white/20 w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Create New Essay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Essay Name</label>
                  <input
                    type="text"
                    value={newEssayName}
                    onChange={(e) => setNewEssayName(e.target.value)}
                    placeholder="Enter essay name..."
                    className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Content</label>
                  <textarea
                    value={newEssayContent}
                    onChange={(e) => setNewEssayContent(e.target.value)}
                    placeholder="Paste or type your essay content..."
                    className="w-full h-64 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400 resize-none"
                  />
                  <div className="text-xs text-white/40 mt-1">
                    {newEssayContent.split(/\s+/).filter(w => w.length > 0).length} words
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={createNewEssay}>
                    Create Essay
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setNewEssayModal(false)
                      setNewEssayName('')
                      setNewEssayContent('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rename Modal */}
      {renameModal && currentEssay && (
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
                      await updateEssay(currentEssay.id, { name: newEssayName.trim() })
                      setRenameModal(false)
                      setCurrentEssay(null)
                    }
                  }}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setRenameModal(false)
                    setCurrentEssay(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Essay Modal */}
      {viewModal && currentEssay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="bg-[#0b0c10] border-white/20 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{currentEssay.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(currentEssay) && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(currentEssay).color}`}>
                        {getStatusBadge(currentEssay).text}
                      </span>
                    )}
                    {currentEssay.ai_detection_score !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getScoreBgColor(currentEssay.ai_detection_score)} ${getScoreColor(currentEssay.ai_detection_score)}`}>
                        {currentEssay.ai_detection_score}% AI
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setViewModal(false)
                    setCurrentEssay(null)
                  }}
                  className="text-white/60 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 whitespace-pre-wrap">{currentEssay.content}</p>
              </div>
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10 text-sm text-white/40">
                <span>{new Date(currentEssay.created_at).toLocaleDateString()}</span>
                <span>{currentEssay.content.split(/\s+/).length} words</span>
              </div>
            </CardContent>
            <div className="px-6 pb-6 flex gap-2 flex-shrink-0 border-t border-white/10 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => exportEssay(currentEssay)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setViewModal(false)
                  setCurrentEssay(null)
                }}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
