/**
 * Custom AI Detection Engine
 * Analyzes text patterns to detect AI-generated content
 */

// Common AI writing patterns and characteristics
const AI_PATTERNS = {
  // Repetitive phrase patterns commonly used by AI
  repetitivePhrases: [
    /\b(it['']s worth noting that|it is worth noting that)\b/gi,
    /\b(it['']s important to note that|it is important to note that)\b/gi,
    /\b(in conclusion|to conclude|in summary|to summarize)\b/gi,
    /\b(furthermore|moreover|additionally|in addition)\b/gi,
    /\b(however|nevertheless|nonetheless|despite this)\b/gi,
    /\b(on the other hand|conversely|alternatively|by contrast)\b/gi,
    /\b(it['']s crucial to|it is crucial to|it['']s essential to)\b/gi,
    /\b(delve into|dive into|explore the|examine the)\b/gi,
    /\b(in today['']s|in the modern|in our contemporary|in the current)\b/gi,
    /\b(comprehensive understanding|holistic approach|multifaceted nature)\b/gi,
    /\b(shed light on|bring to light|illuminate)\b/gi,
    /\b(navigate the complexities|tackle the challenges)\b/gi,
    /\b(play a crucial role|plays a vital role|serves as)\b/gi,
    /\b(it is imperative|it is vital|it is essential)\b/gi,
    /\b(underscores the importance|highlights the significance)\b/gi,
    /\b(raises important questions|poses significant challenges)\b/gi,
    /\b(offers valuable insights|provides key insights)\b/gi,
    /\b(represents a significant|marks a crucial)\b/gi,
    /\b(cannot be overstated|cannot be ignored)\b/gi,
    /\b(warrants further|merits additional|deserves careful)\b/gi,
    /\b(stands as a testament|serves as evidence)\b/gi,
    /\b(encompasses various|comprises multiple|includes numerous)\b/gi,
    /\b(paves the way|sets the stage|lays the groundwork)\b/gi,
    /\b(strikes a balance|maintains equilibrium|achieves harmony)\b/gi,
    /\b(fosters innovation|drives progress|promotes growth)\b/gi,
    /\b(yields significant results|produces notable outcomes)\b/gi,
    /\b(poses unique challenges|presents distinct obstacles)\b/gi,
    /\b(offers a unique perspective|provides a fresh viewpoint)\b/gi,
    /\b(demands careful consideration|requires thoughtful analysis)\b/gi,
    /\b(holds immense potential|possesses great promise)\b/gi,
  ],

  // Overly formal or academic phrases in casual contexts
  formalityMarkers: [
    /\b(utilize|utilization|utilized|utilizing)\b/gi,
    /\b(implement|implementation|implemented|implementing)\b/gi,
    /\b(facilitate|facilitation|facilitated|facilitating)\b/gi,
    /\b(demonstrate|demonstration|demonstrated|demonstrating)\b/gi,
    /\b(significantly|substantial|substantially)\b/gi,
    /\b(aforementioned|the latter|the former|henceforth)\b/gi,
    /\b(pertaining to|with regard to|in regard to|concerning)\b/gi,
    /\b(hence|thus|therefore|consequently|accordingly)\b/gi,
    /\b(endeavor|endeavors|endeavoring)\b/gi,
    /\b(ascertain|ascertaining|ascertained)\b/gi,
    /\b(constitute|constitutes|constituting)\b/gi,
    /\b(necessitate|necessitates|necessitating)\b/gi,
    /\b(elucidate|elucidating|elucidated)\b/gi,
    /\b(paramount|imperative|quintessential)\b/gi,
    /\b(myriad|plethora|multitude)\b/gi,
    /\b(whereby|wherein|therein|thereof)\b/gi,
    /\b(heretofore|hitherto|notwithstanding)\b/gi,
    /\b(insofar as|inasmuch as)\b/gi,
    /\b(vis-à-vis|per se|ipso facto)\b/gi,
    /\b(ubiquitous|omnipresent|pervasive)\b/gi,
    /\b(ameliorate|exacerbate|mitigate)\b/gi,
    /\b(cognizant|apprised|mindful)\b/gi,
    /\b(commensurate|concomitant|concurrent)\b/gi,
  ],

  // Perfect grammar indicators (AI rarely makes grammar mistakes)
  perfectGrammarIndicators: [
    /\b(who['']s|who is)\b/gi,  // Correct who's/whose usage
    /\b(it['']s|it is)\b/gi,     // Correct it's/its usage
    /\b(they['']re|they are)\b/gi, // Correct they're/their usage
  ],

  // Listing patterns (AI loves numbered/bulleted lists)
  listPatterns: [
    /^\s*\d+\.\s+/gm,  // Numbered lists
    /^\s*[-•]\s+/gm,   // Bullet points
    /\b(firstly|secondly|thirdly|finally)\b/gi,
    /\b(first|second|third|fourth|lastly)\b/gi,
  ],

  // Hedging language (AI tends to be cautious)
  hedgingPhrases: [
    /\b(might|may|could|would|should)\b/gi,
    /\b(perhaps|maybe|possibly|potentially)\b/gi,
    /\b(seems to|appears to|tends to)\b/gi,
    /\b(generally|typically|usually|often)\b/gi,
    /\b(in many cases|in some cases)\b/gi,
  ],

  // AI conclusion patterns
  conclusionPatterns: [
    /\b(in conclusion|to sum up|all in all|in summary)\b/gi,
    /\b(ultimately|at the end of the day|when all is said and done)\b/gi,
    /\b(it['']s clear that|it is evident that|it becomes apparent)\b/gi,
    /\b(these findings suggest|the evidence indicates)\b/gi,
    /\b(taken together|collectively|as a whole)\b/gi,
    /\b(in essence|essentially|fundamentally)\b/gi,
  ],

  // AI opening patterns
  openingPatterns: [
    /^(In the realm of|In the world of|In the landscape of)/gi,
    /^(Throughout history|Since time immemorial|From ancient times)/gi,
    /^(In recent years|In modern times|In today's society)/gi,
    /^(It is widely acknowledged|It is commonly known|It is generally accepted)/gi,
    /^(The question of|The issue of|The topic of)/gi,
    /^(When it comes to|With regard to|In terms of)/gi,
    /^(The concept of|The notion of|The idea of)/gi,
  ],

  // Redundant phrases AI loves
  redundantPhrases: [
    /\b(actual fact|added bonus|advance planning)\b/gi,
    /\b(completely unanimous|end result|final outcome)\b/gi,
    /\b(free gift|future plans|past history)\b/gi,
    /\b(personal opinion|repeat again|revert back)\b/gi,
    /\b(unexpected surprise|close proximity|joint collaboration)\b/gi,
    /\b(basic fundamentals|completely filled|entirely empty)\b/gi,
  ],

  // AI loves balanced statements
  balancedStatements: [
    /\bwhile .+ on one hand.+on the other\b/gi,
    /\balthough .+ it is also true that\b/gi,
    /\bdespite .+ there are also\b/gi,
    /\bwhereas .+ in contrast\b/gi,
    /\bnot only .+ but also\b/gi,
    /\bboth .+ and .+ equally\b/gi,
  ],

  // Meta-commentary (AI talking about what it's doing)
  metaCommentary: [
    /\b(this article will explore|this essay examines|this paper discusses)\b/gi,
    /\b(we will delve into|we will examine|we will analyze)\b/gi,
    /\b(as mentioned earlier|as previously stated|as noted above)\b/gi,
    /\b(the following section|the next part|in what follows)\b/gi,
    /\b(let us consider|let us examine|let us turn to)\b/gi,
    /\b(it should be noted|it must be emphasized|it is important to mention)\b/gi,
  ],

  // Vague quantifiers
  vagueQuantifiers: [
    /\b(various factors|numerous aspects|multiple elements)\b/gi,
    /\b(several reasons|many ways|different approaches)\b/gi,
    /\b(a number of|a variety of|a range of)\b/gi,
    /\b(certain aspects|some elements|particular features)\b/gi,
    /\b(considerable amount|significant portion|substantial number)\b/gi,
  ],

  // AI's favorite adjectives
  overusedAdjectives: [
    /\b(robust|nuanced|pivotal|seminal)\b/gi,
    /\b(compelling|comprehensive|intricate|profound)\b/gi,
    /\b(unprecedented|revolutionary|transformative|groundbreaking)\b/gi,
    /\b(innovative|cutting-edge|state-of-the-art|pioneering)\b/gi,
    /\b(crucial|vital|essential|fundamental)\b/gi,
    /\b(significant|notable|remarkable|extraordinary)\b/gi,
  ],
}

/**
 * Calculate text statistics
 */
function calculateTextStats(text) {
  const sentences = text.match(/[.!?]+/g) || []
  const words = text.match(/\b\w+\b/g) || []
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)

  // Calculate word frequencies
  const wordFreq = {}
  words.forEach(word => {
    const lower = word.toLowerCase()
    wordFreq[lower] = (wordFreq[lower] || 0) + 1
  })

  // Calculate average word length
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length

  // Calculate sentence length variance
  const sentenceLengths = text.split(/[.!?]+/).map(s => s.trim().split(/\s+/).length)
  const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
  const sentenceVariance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) / sentenceLengths.length

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgWordLength,
    avgSentenceLength,
    sentenceVariance,
    uniqueWords: Object.keys(wordFreq).length,
    lexicalDiversity: Object.keys(wordFreq).length / words.length,
    wordFrequencies: wordFreq,
  }
}

/**
 * Detect repetitive patterns
 */
function detectRepetitivePatterns(text) {
  let score = 0
  let matches = []

  // Check for repeated phrases (3+ words)
  const phrases = []
  const words = text.toLowerCase().split(/\s+/)

  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words.slice(i, i + 3).join(' ')
    phrases.push(phrase)
  }

  const phraseCount = {}
  phrases.forEach(phrase => {
    phraseCount[phrase] = (phraseCount[phrase] || 0) + 1
  })

  // Penalize repeated phrases
  Object.entries(phraseCount).forEach(([phrase, count]) => {
    if (count > 2) {
      score += count * 5
      matches.push({ type: 'repeated_phrase', text: phrase, count })
    }
  })

  return { score: Math.min(score, 100), matches }
}

/**
 * Analyze sentence structure patterns
 */
function analyzeSentenceStructure(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  let score = 0
  let patterns = []

  // Check for similar sentence beginnings
  const beginnings = sentences.map(s => s.trim().split(' ').slice(0, 3).join(' ').toLowerCase())
  const beginningCount = {}

  beginnings.forEach(begin => {
    beginningCount[begin] = (beginningCount[begin] || 0) + 1
  })

  Object.entries(beginningCount).forEach(([begin, count]) => {
    if (count > 2) {
      score += count * 10
      patterns.push({ type: 'repeated_beginning', text: begin, count })
    }
  })

  // Check for uniform sentence lengths (low variance = AI-like)
  const lengths = sentences.map(s => s.trim().split(/\s+/).length)
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length

  if (variance < 25) { // Low variance in sentence length
    score += 30
    patterns.push({ type: 'uniform_sentences', variance })
  }

  return { score: Math.min(score, 100), patterns }
}

/**
 * Check for AI-specific phrases and patterns
 */
function checkAIPatterns(text) {
  let score = 0
  const detectedPatterns = []

  // Check each pattern category
  for (const [category, patterns] of Object.entries(AI_PATTERNS)) {
    patterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        const weight = {
          repetitivePhrases: 8,
          formalityMarkers: 5,
          perfectGrammarIndicators: 3,
          listPatterns: 4,
          hedgingPhrases: 6,
          conclusionPatterns: 7,
          openingPatterns: 9,
          redundantPhrases: 7,
          balancedStatements: 6,
          metaCommentary: 8,
          vagueQuantifiers: 5,
          overusedAdjectives: 4,
        }[category] || 5

        score += matches.length * weight
        detectedPatterns.push({
          category,
          pattern: pattern.source,
          matches: matches.length,
          examples: matches.slice(0, 3),
        })
      }
    })
  }

  return { score: Math.min(score, 100), patterns: detectedPatterns }
}

/**
 * Analyze burstiness (human writing has more variation)
 */
function analyzeBurstiness(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  const lengths = sentences.map(s => s.trim().split(/\s+/).length)

  // Calculate perplexity (variation in sentence length)
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length
  const stdDev = Math.sqrt(variance)

  // Low standard deviation = likely AI (too consistent)
  // High standard deviation = likely human (more varied)
  const burstiness = stdDev / avgLength // Coefficient of variation

  // Score: lower burstiness = higher AI probability
  const score = burstiness < 0.3 ? 80 :
                burstiness < 0.5 ? 50 :
                burstiness < 0.7 ? 30 : 10

  return {
    score,
    burstiness,
    avgSentenceLength: avgLength,
    stdDeviation: stdDev,
  }
}

/**
 * Check for lack of personal pronouns and experiences
 */
function analyzePersonalization(text) {
  const personalPronouns = /\b(I|me|my|mine|myself|we|us|our|ours|ourselves)\b/gi
  const personalExperiences = /\b(I remember|I think|I believe|I feel|In my experience|I once|I've been)\b/gi
  const emotionalLanguage = /\b(love|hate|excited|scared|happy|sad|angry|frustrated|amazed)\b/gi

  const pronounMatches = text.match(personalPronouns) || []
  const experienceMatches = text.match(personalExperiences) || []
  const emotionMatches = text.match(emotionalLanguage) || []

  const wordCount = text.split(/\s+/).length
  const pronounDensity = pronounMatches.length / wordCount

  // Low personal pronoun density = likely AI
  const score = pronounDensity < 0.01 ? 70 :
                pronounDensity < 0.02 ? 40 :
                pronounDensity < 0.03 ? 20 : 5

  return {
    score,
    personalPronouns: pronounMatches.length,
    personalExperiences: experienceMatches.length,
    emotionalExpressions: emotionMatches.length,
    pronounDensity,
  }
}

/**
 * Main detection function
 */
export function detectAI(text) {
  if (!text || text.length < 100) {
    return {
      isAI: false,
      confidence: 0,
      score: 0,
      message: 'Text too short for accurate analysis (minimum 100 characters)',
      details: {},
    }
  }

  // Run all analysis functions
  const stats = calculateTextStats(text)
  const repetitive = detectRepetitivePatterns(text)
  const structure = analyzeSentenceStructure(text)
  const aiPatterns = checkAIPatterns(text)
  const burstiness = analyzeBurstiness(text)
  const personalization = analyzePersonalization(text)

  // Calculate weighted scores
  const weights = {
    repetitive: 0.15,
    structure: 0.15,
    aiPatterns: 0.25,
    burstiness: 0.20,
    personalization: 0.15,
    lexicalDiversity: 0.10,
  }

  // Lexical diversity score (low diversity = likely AI)
  const lexicalScore = stats.lexicalDiversity < 0.3 ? 80 :
                       stats.lexicalDiversity < 0.4 ? 50 :
                       stats.lexicalDiversity < 0.5 ? 30 : 10

  // Calculate final score
  const finalScore =
    repetitive.score * weights.repetitive +
    structure.score * weights.structure +
    aiPatterns.score * weights.aiPatterns +
    burstiness.score * weights.burstiness +
    personalization.score * weights.personalization +
    lexicalScore * weights.lexicalDiversity

  // Determine confidence based on how many indicators agree
  const indicators = [
    repetitive.score > 50,
    structure.score > 50,
    aiPatterns.score > 50,
    burstiness.score > 50,
    personalization.score > 50,
    lexicalScore > 50,
  ]

  const agreementCount = indicators.filter(x => x).length
  const confidence = (agreementCount / indicators.length) * 100

  const isAI = finalScore > 50

  return {
    isAI,
    confidence: Math.round(confidence),
    score: Math.round(finalScore),
    probability: {
      ai: Math.round(finalScore),
      human: Math.round(100 - finalScore),
    },
    details: {
      statistics: stats,
      repetitivePatterns: repetitive,
      sentenceStructure: structure,
      aiPatterns: aiPatterns,
      burstiness: burstiness,
      personalization: personalization,
      lexicalDiversity: {
        score: lexicalScore,
        value: stats.lexicalDiversity,
      },
    },
    breakdown: {
      'Repetitive Patterns': `${repetitive.score}%`,
      'Sentence Structure': `${structure.score}%`,
      'AI Phrases': `${aiPatterns.score}%`,
      'Text Burstiness': `${burstiness.score}%`,
      'Personalization': `${personalization.score}%`,
      'Lexical Diversity': `${lexicalScore}%`,
    },
    warnings: generateWarnings(aiPatterns, repetitive, structure, burstiness, personalization),
  }
}

/**
 * Generate specific warnings about detected patterns
 */
function generateWarnings(aiPatterns, repetitive, structure, burstiness, personalization) {
  const warnings = []

  if (aiPatterns.score > 70) {
    warnings.push({
      level: 'high',
      message: 'High concentration of typical AI phrases detected',
      examples: aiPatterns.patterns.slice(0, 3).map(p => p.examples[0]),
    })
  }

  if (repetitive.score > 60) {
    warnings.push({
      level: 'medium',
      message: 'Repetitive phrase patterns detected',
      examples: repetitive.matches.slice(0, 2).map(m => m.text),
    })
  }

  if (burstiness.burstiness < 0.3) {
    warnings.push({
      level: 'high',
      message: 'Unusually consistent sentence lengths (low burstiness)',
      detail: `Variance: ${burstiness.burstiness.toFixed(2)}`,
    })
  }

  if (personalization.pronounDensity < 0.01) {
    warnings.push({
      level: 'medium',
      message: 'Lack of personal pronouns and experiences',
      detail: `Only ${personalization.personalPronouns} personal references found`,
    })
  }

  return warnings
}

/**
 * Advanced detection with machine learning features
 */
export function detectAIAdvanced(text) {
  const basicAnalysis = detectAI(text)

  // Additional advanced features
  const advancedFeatures = {
    // Check for perfect punctuation
    perfectPunctuation: checkPerfectPunctuation(text),

    // Analyze transition words
    transitionDensity: analyzeTransitions(text),

    // Check for clichés
    clicheScore: detectCliches(text),

    // Analyze paragraph structure
    paragraphUniformity: analyzeParagraphStructure(text),
  }

  // Adjust score based on advanced features
  let adjustedScore = basicAnalysis.score

  if (advancedFeatures.perfectPunctuation > 90) adjustedScore += 5
  if (advancedFeatures.transitionDensity > 0.05) adjustedScore += 10
  if (advancedFeatures.clicheScore > 50) adjustedScore += 8
  if (advancedFeatures.paragraphUniformity > 70) adjustedScore += 7

  adjustedScore = Math.min(100, adjustedScore)

  return {
    ...basicAnalysis,
    score: adjustedScore,
    isAI: adjustedScore > 50,
    advancedFeatures,
  }
}

function checkPerfectPunctuation(text) {
  // Check for correct punctuation usage
  const errors = 0
  const checks = [
    /\s+[,;:.!?]/g, // Space before punctuation (error)
    /[.!?]\s+[a-z]/g, // Lowercase after sentence end (error)
    /,,|;;|::|\.\.(?!\.)/g, // Double punctuation (error)
  ]

  let errorCount = 0
  checks.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) errorCount += matches.length
  })

  const sentenceCount = (text.match(/[.!?]+/g) || []).length
  const errorRate = errorCount / Math.max(sentenceCount, 1)

  // Low error rate = likely AI
  return errorRate < 0.05 ? 95 : errorRate < 0.1 ? 50 : 20
}

function analyzeTransitions(text) {
  const transitions = [
    'however', 'therefore', 'moreover', 'furthermore',
    'additionally', 'consequently', 'nevertheless', 'thus',
    'hence', 'accordingly', 'subsequently', 'meanwhile',
  ]

  const words = text.toLowerCase().split(/\s+/)
  const transitionCount = words.filter(w => transitions.includes(w)).length

  return transitionCount / words.length
}

function detectCliches(text) {
  const cliches = [
    /\bin this day and age\b/gi,
    /\bat the end of the day\b/gi,
    /\bfood for thought\b/gi,
    /\bthe bottom line\b/gi,
    /\bthink outside the box\b/gi,
    /\bparadigm shift\b/gi,
    /\bsynergy\b/gi,
    /\bleverage\b/gi,
    /\bmoving forward\b/gi,
    /\bgoing forward\b/gi,
  ]

  let clicheCount = 0
  cliches.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) clicheCount += matches.length
  })

  const wordCount = text.split(/\s+/).length
  const clicheDensity = clicheCount / wordCount * 100

  return clicheDensity > 0.5 ? 80 : clicheDensity > 0.2 ? 50 : 20
}

function analyzeParagraphStructure(text) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)

  if (paragraphs.length < 2) return 0

  const lengths = paragraphs.map(p => p.split(/\s+/).length)
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length

  // Low variance = uniform paragraphs = likely AI
  return variance < 100 ? 80 : variance < 200 ? 50 : 20
}

// Export for testing
export const _testFunctions = {
  calculateTextStats,
  detectRepetitivePatterns,
  analyzeSentenceStructure,
  checkAIPatterns,
  analyzeBurstiness,
  analyzePersonalization,
}