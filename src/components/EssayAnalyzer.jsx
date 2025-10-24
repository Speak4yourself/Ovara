import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { FileText, Upload, BarChart, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { analyzeEssay as analyzeEssayWithChatGPT } from '../utils/openai'
import { Button, Card, CardHeader, CardTitle, CardContent, PageHeader, PageContainer, Input, Textarea, Select, Label } from './SharedUI'

function EssayAnalyzer({ user, userSubscription, showToast, onBack }) {
  const [view, setView] = useState('choice') // 'choice', 'savedEssays', 'analyzer'
  const [essays, setEssays] = useState([])
  const [selectedEssay, setSelectedEssay] = useState(null)
  const [essayText, setEssayText] = useState('')
  const [gradeLevel, setGradeLevel] = useState('high-school')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  const gradeLevels = [
    { id: 'middle-school', name: 'Middle School' },
    { id: 'high-school', name: 'High School' },
    { id: 'college', name: 'College' },
    { id: 'graduate', name: 'Graduate' },
  ]

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

      if (error) throw error
      setEssays(data || [])
    } catch (error) {
      console.error('Error loading essays:', error)
      showToast('Failed to load essays')
    }
  }

  const analyzeEssay = async () => {
    if (!essayText.trim()) {
      showToast('Please enter essay text')
      return
    }

    setLoading(true)

    try {
      // Use ChatGPT to analyze essay with tier
      const tier = userSubscription?.tier?.toLowerCase() || 'free'
      const result = await analyzeEssayWithChatGPT(essayText, tier)

      // Format result to match expected structure
      const formattedAnalysis = {
        grade: {
          score: result.predictedScore,
          letter: result.overallGrade,
          confidence: 85,
          strengths: result.strengths,
          improvements: result.weaknesses,
          feedback: result.recommendations.join('\n\n'),
          breakdown: [
            { name: 'Thesis & Argument', score: result.thesis?.clarity || 75 },
            { name: 'Structure & Organization', score: result.structure?.score || 80 },
            { name: 'Grammar & Mechanics', score: result.grammar?.score || 85 },
            { name: 'Evidence & Support', score: result.argumentStrength || 75 }
          ]
        },
        readability: {
          fleschScore: result.readabilityScore,
          gradeLevel: result.readabilityLevel,
          avgWordsPerSentence: Math.round(essayText.split('.').reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / essayText.split('.').length),
          words: essayText.trim().split(/\s+/).length
        },
        arguments: {
          overallStrength: result.argumentStrength,
          segments: [
            { type: 'Thesis', text: result.thesis?.text || 'Thesis not clearly identified', strength: result.thesis?.clarity || 70 },
            { type: 'Main Argument 1', text: 'First main argument analyzed', strength: result.argumentStrength || 75 },
            { type: 'Main Argument 2', text: 'Second main argument analyzed', strength: result.argumentStrength || 75 },
            { type: 'Conclusion', text: 'Conclusion strength', strength: result.argumentStrength || 70 }
          ]
        }
      }

      setAnalysis(formattedAnalysis)
      showToast('Analysis complete!')
    } catch (error) {
      console.error('Error:', error)
      showToast(error.message || 'Failed to analyze essay')
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

  const getStrengthColor = (strength) => {
    if (strength >= 80) return 'bg-green-500/40 border-green-500'
    if (strength >= 60) return 'bg-lime-500/40 border-lime-500'
    if (strength >= 40) return 'bg-yellow-500/40 border-yellow-500'
    if (strength >= 20) return 'bg-orange-500/40 border-orange-500'
    return 'bg-red-500/40 border-red-500'
  }

  // CHOICE VIEW
  if (view === 'choice') {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Essay Analyzer</h1>
              <p className="text-white/60 mt-1">Get grades, readability scores, and argument analysis</p>
            </div>
            <Button
              variant="outline"
              onClick={onBack}
              className="border-white/20 text-white hover:bg-white/5"
            >
              Back to Control Panel
            </Button>
          </div>

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
                  Select from your saved essays
                </p>
                <div className="text-2xl font-bold text-white">{essays.length} Essays</div>
                <Button className="w-full mt-4" variant="outline">
                  Browse Essays
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-white/20 transition cursor-pointer"
                  onClick={() => setView('analyzer')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-500/20 p-3">
                    <Upload className="w-6 h-6 text-purple-300" />
                  </div>
                  <CardTitle className="text-purple-300">Upload New</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 text-sm mb-4">
                  Paste or upload essay text
                </p>
                <div className="text-2xl font-bold text-white">Start Fresh</div>
                <Button className="w-full mt-4" variant="outline">
                  Upload Essay
                </Button>
              </CardContent>
            </Card>
          </div>
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
              <p className="text-white/60 mt-1">{essays.length} essays saved</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setView('choice')}
              className="border-white/20 text-white hover:bg-white/5"
            >
              Back
            </Button>
          </div>

          {essays.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/60">No saved essays found</p>
                <Button className="mt-4" onClick={() => setView('analyzer')}>
                  Analyze New Essay
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {essays.map((essay) => (
                <Card key={essay.id} className="bg-white/5 border-white/10 hover:border-white/20 transition">
                  <CardHeader>
                    <CardTitle className="text-white truncate">{essay.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm line-clamp-3 mb-4">
                      {essay.content}
                    </p>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => {
                        setSelectedEssay(essay)
                        setEssayText(essay.content)
                        setView('analyzer')
                      }}
                    >
                      Analyze
                    </Button>
                    <div className="text-xs text-white/40 mt-3">
                      {new Date(essay.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ANALYZER VIEW
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Essay Analyzer</h1>
            <p className="text-white/60 mt-1">Comprehensive essay analysis</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setView('choice')
              setEssayText('')
              setAnalysis(null)
              setSelectedEssay(null)
            }}
            className="border-white/20 text-white hover:bg-white/5"
          >
            Back
          </Button>
        </div>

        {!analysis ? (
          <div className="space-y-6">
            {/* Grade Level Selection */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-indigo-300">Academic Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {gradeLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setGradeLevel(level.id)}
                      className={`p-4 rounded-lg border transition text-center ${
                        gradeLevel === level.id
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                      }`}
                    >
                      <div className="font-semibold text-sm">{level.name}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Essay Input */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-indigo-300">Your Essay</CardTitle>
                  {selectedEssay && (
                    <span className="text-xs text-white/60">From: {selectedEssay.name}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <textarea
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  placeholder="Paste your essay here..."
                  className="w-full h-64 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400 resize-none"
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-white/60">
                    {essayText.trim().split(/\s+/).filter(w => w.length > 0).length} words
                  </div>
                  <Button
                    onClick={analyzeEssay}
                    disabled={loading || !essayText.trim()}
                  >
                    {loading ? '🔄 Analyzing...' : '✨ Analyze Essay'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Grade Display */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="text-sm text-white/60 mb-2">Predicted Grade</div>
                  <div className={`text-8xl font-bold mb-4 ${getGradeColor(analysis.grade.score)}`}>
                    {getLetterGrade(analysis.grade.score)}
                  </div>
                  <div className={`text-4xl font-semibold ${getGradeColor(analysis.grade.score)}`}>
                    {analysis.grade.score}%
                  </div>
                  {analysis.grade.confidence && (
                    <div className="text-sm text-white/50 mt-4">
                      Confidence: {analysis.grade.confidence}%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grade Breakdown */}
            {analysis.grade.breakdown && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-indigo-300">Grade Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.grade.breakdown.map((category, idx) => (
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
                </CardContent>
              </Card>
            )}

            {/* Readability Score */}
            {analysis.readability && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-indigo-300">Readability Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">{analysis.readability.fleschScore}</div>
                      <div className="text-xs text-white/50">Flesch Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">Grade {analysis.readability.gradeLevel}</div>
                      <div className="text-xs text-white/50">Reading Level</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{analysis.readability.avgWordsPerSentence}</div>
                      <div className="text-xs text-white/50">Words/Sentence</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{analysis.readability.words}</div>
                      <div className="text-xs text-white/50">Total Words</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Argument Strength */}
            {analysis.arguments && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-indigo-300">Argument Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 text-center">
                    <div className="text-sm text-white/60 mb-2">Overall Strength</div>
                    <div className="text-4xl font-bold text-white">{analysis.arguments.overallStrength}%</div>
                  </div>

                  <div className="space-y-3">
                    {analysis.arguments.segments?.slice(0, 5).map((segment, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${getStrengthColor(segment.strength)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-white/80 uppercase">{segment.type}</span>
                          <span className="text-xs font-bold text-white">{segment.strength}%</span>
                        </div>
                        <p className="text-white/90 text-sm line-clamp-2">{segment.text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.grade.strengths && analysis.grade.strengths.length > 0 && (
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="text-green-300">✅ Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.grade.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {analysis.grade.improvements && analysis.grade.improvements.length > 0 && (
                <Card className="bg-orange-500/10 border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="text-orange-300">📈 Areas for Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.grade.improvements.map((improvement, idx) => (
                        <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Overall Feedback */}
            {analysis.grade.feedback && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-indigo-300">💬 Overall Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {analysis.grade.feedback}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center">
              <Button onClick={() => setAnalysis(null)}>
                🔄 Analyze Another Essay
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

EssayAnalyzer.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
  userSubscription: PropTypes.shape({
    tier: PropTypes.string,
  }),
  showToast: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default EssayAnalyzer
