/**
 * Custom Humanizer Engine
 * Transforms AI-generated text to be more human-like
 * Works opposite to our AI detector - removes patterns that trigger detection
 */

import { detectAIAdvanced } from './customAIDetector'

/**
 * Replacement strategies for AI patterns
 */
const HUMANIZATION_REPLACEMENTS = {
  // Replace formal connectors with casual ones
  formalConnectors: {
    'furthermore': ['also', 'plus', 'and', 'besides'],
    'moreover': ['also', 'plus', 'what\'s more', 'and'],
    'however': ['but', 'though', 'still', 'yet'],
    'therefore': ['so', 'which means', 'that\'s why'],
    'nevertheless': ['still', 'even so', 'but still'],
    'consequently': ['so', 'as a result', 'which led to'],
    'thus': ['so', 'this way', 'like this'],
    'hence': ['so', 'that\'s why', 'which is why'],
    'additionally': ['also', 'plus', 'on top of that'],
    'in conclusion': ['to wrap up', 'so basically', 'in the end'],
    'in summary': ['to sum it up', 'basically', 'in short'],
    'it is worth noting that': ['interestingly,', 'note that', 'by the way,'],
    'it is important to note that': ['keep in mind that', 'remember,', 'note that'],
    'it is crucial to': ['you need to', 'it\'s important to', 'make sure to'],
    'it is essential to': ['you should', 'you need to', 'be sure to'],
  },

  // Replace overly formal words with simpler ones
  formalWords: {
    'utilize': ['use', 'work with', 'apply'],
    'implement': ['put in place', 'start', 'use'],
    'facilitate': ['help', 'make easier', 'enable'],
    'demonstrate': ['show', 'prove', 'display'],
    'substantial': ['large', 'big', 'significant'],
    'aforementioned': ['mentioned', 'above', 'previous'],
    'endeavor': ['try', 'attempt', 'effort'],
    'ascertain': ['find out', 'determine', 'figure out'],
    'constitute': ['make up', 'form', 'are'],
    'necessitate': ['need', 'require', 'call for'],
    'elucidate': ['explain', 'clarify', 'make clear'],
    'paramount': ['very important', 'key', 'crucial'],
    'myriad': ['many', 'countless', 'lots of'],
    'plethora': ['many', 'a lot of', 'tons of'],
    'ubiquitous': ['everywhere', 'common', 'widespread'],
    'ameliorate': ['improve', 'make better', 'help'],
    'exacerbate': ['make worse', 'worsen', 'aggravate'],
    'mitigate': ['reduce', 'lessen', 'ease'],
    'cognizant': ['aware', 'know', 'realize'],
  },

  // Replace vague quantifiers with specific ones
  vagueTerms: {
    'various factors': ['several things', 'a few reasons', 'some factors'],
    'numerous aspects': ['many parts', 'several points', 'different things'],
    'multiple elements': ['several parts', 'a few things', 'different pieces'],
    'a number of': ['several', 'a few', 'some'],
    'a variety of': ['different', 'several', 'various'],
    'considerable amount': ['a lot', 'quite a bit', 'plenty'],
    'significant portion': ['large part', 'big chunk', 'a lot'],
  },

  // Replace redundant phrases
  redundantPhrases: {
    'actual fact': ['fact'],
    'added bonus': ['bonus'],
    'advance planning': ['planning'],
    'completely unanimous': ['unanimous'],
    'end result': ['result'],
    'final outcome': ['outcome'],
    'free gift': ['gift'],
    'future plans': ['plans'],
    'past history': ['history'],
    'personal opinion': ['opinion'],
    'repeat again': ['repeat'],
    'revert back': ['revert'],
    'close proximity': ['near', 'close'],
  },

  // Replace AI-like openings
  stiffOpenings: {
    'In the realm of': ['When it comes to', 'Looking at', 'About'],
    'In the world of': ['In', 'When we talk about', 'Speaking of'],
    'Throughout history': ['Historically', 'In the past', 'Over time'],
    'In recent years': ['Recently', 'Lately', 'These days'],
    'It is widely acknowledged': ['Most people know', 'Everyone agrees', 'We all know'],
    'The question of': ['Asking about', 'When we ask about', 'The issue with'],
    'The concept of': ['The idea of', 'What we call', 'This thing called'],
  },
}

/**
 * Add personal touches to make text more human
 */
const PERSONAL_ADDITIONS = [
  'I think',
  'I believe',
  'In my experience',
  'I\'ve found that',
  'From what I\'ve seen',
  'Personally,',
  'To be honest,',
  'Actually,',
  'You know,',
  'Let me tell you,',
  'Here\'s the thing:',
  'The way I see it,',
]

/**
 * Casual transitions for variety
 */
const CASUAL_TRANSITIONS = [
  'Anyway,',
  'So,',
  'Well,',
  'Now,',
  'Look,',
  'See,',
  'The thing is,',
  'Here\'s what happened:',
  'Funny enough,',
  'Interestingly,',
  'Turns out,',
  'Believe it or not,',
]

/**
 * Add natural imperfections
 */
const NATURAL_FILLERS = [
  'kind of',
  'sort of',
  'pretty much',
  'basically',
  'really',
  'just',
  'actually',
  'literally',
  'honestly',
]

/**
 * Main humanization function
 */
export function humanizeText(text, level = 'medium') {
  // Store original for comparison
  const original = text

  // Apply different strategies based on level
  let humanized = text

  // Step 1: Replace formal connectors and words
  humanized = replaceFormalLanguage(humanized)

  // Step 2: Vary sentence structure
  humanized = varySentenceStructure(humanized)

  // Step 3: Add personal touches
  if (level === 'medium' || level === 'heavy') {
    humanized = addPersonalTouches(humanized, level)
  }

  // Step 4: Add natural imperfections
  if (level === 'heavy') {
    humanized = addNaturalImperfections(humanized)
  }

  // Step 5: Break up long paragraphs
  humanized = breakUpParagraphs(humanized)

  // Step 6: Add contractions
  humanized = addContractions(humanized)

  // Step 7: Vary punctuation
  if (level === 'medium' || level === 'heavy') {
    humanized = varyPunctuation(humanized)
  }

  // Test the result
  const beforeScore = detectAIAdvanced(original).score
  const afterScore = detectAIAdvanced(humanized).score

  return {
    original,
    humanized,
    beforeScore,
    afterScore,
    improvement: beforeScore - afterScore,
    level
  }
}

/**
 * Replace formal language with casual alternatives
 */
function replaceFormalLanguage(text) {
  let result = text

  // Replace formal connectors
  for (const [formal, casual] of Object.entries(HUMANIZATION_REPLACEMENTS.formalConnectors)) {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi')
    result = result.replace(regex, () => {
      const alternatives = casual
      return alternatives[Math.floor(Math.random() * alternatives.length)]
    })
  }

  // Replace formal words
  for (const [formal, casual] of Object.entries(HUMANIZATION_REPLACEMENTS.formalWords)) {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi')
    result = result.replace(regex, () => {
      const alternatives = casual
      return alternatives[Math.floor(Math.random() * alternatives.length)]
    })
  }

  // Replace vague terms
  for (const [vague, specific] of Object.entries(HUMANIZATION_REPLACEMENTS.vagueTerms)) {
    const regex = new RegExp(vague, 'gi')
    result = result.replace(regex, () => {
      const alternatives = specific
      return alternatives[Math.floor(Math.random() * alternatives.length)]
    })
  }

  // Replace redundant phrases
  for (const [redundant, simple] of Object.entries(HUMANIZATION_REPLACEMENTS.redundantPhrases)) {
    const regex = new RegExp(redundant, 'gi')
    result = result.replace(regex, simple[0])
  }

  // Replace stiff openings
  for (const [stiff, natural] of Object.entries(HUMANIZATION_REPLACEMENTS.stiffOpenings)) {
    const regex = new RegExp(stiff, 'gi')
    result = result.replace(regex, () => {
      const alternatives = natural
      return alternatives[Math.floor(Math.random() * alternatives.length)]
    })
  }

  return result
}

/**
 * Vary sentence structure and length
 */
function varySentenceStructure(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  const varied = []

  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i].trim()

    // Occasionally combine short sentences
    if (i < sentences.length - 1 && sentence.split(' ').length < 8 && Math.random() > 0.7) {
      const next = sentences[i + 1].trim()
      if (next.split(' ').length < 8) {
        // Combine with a casual connector
        const connectors = [' and ', ' but ', ' so ', ' - ', ', ']
        const connector = connectors[Math.floor(Math.random() * connectors.length)]
        sentence = sentence.replace(/[.!?]$/, '') + connector + next.charAt(0).toLowerCase() + next.slice(1)
        i++ // Skip the next sentence since we combined it
      }
    }

    // Occasionally split long sentences
    if (sentence.split(' ').length > 20 && sentence.includes(',')) {
      const parts = sentence.split(',')
      if (parts.length > 2 && Math.random() > 0.6) {
        const midpoint = Math.floor(parts.length / 2)
        const first = parts.slice(0, midpoint).join(',')
        const second = parts.slice(midpoint).join(',')
        varied.push(first + '.')
        varied.push(second.trim().charAt(0).toUpperCase() + second.trim().slice(1))
        continue
      }
    }

    varied.push(sentence)
  }

  return varied.join(' ')
}

/**
 * Add personal touches and conversational elements
 */
function addPersonalTouches(text, level) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  const enhanced = []

  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i].trim()

    // Add personal phrases occasionally
    if (Math.random() < (level === 'heavy' ? 0.25 : 0.15)) {
      if (i === 0 || (i > 0 && Math.random() > 0.5)) {
        const personal = PERSONAL_ADDITIONS[Math.floor(Math.random() * PERSONAL_ADDITIONS.length)]
        sentence = personal + ' ' + sentence.charAt(0).toLowerCase() + sentence.slice(1)
      }
    }

    // Add casual transitions
    if (i > 0 && Math.random() < (level === 'heavy' ? 0.2 : 0.1)) {
      const transition = CASUAL_TRANSITIONS[Math.floor(Math.random() * CASUAL_TRANSITIONS.length)]
      sentence = transition + ' ' + sentence
    }

    enhanced.push(sentence)
  }

  return enhanced.join(' ')
}

/**
 * Add natural imperfections and fillers
 */
function addNaturalImperfections(text) {
  let result = text

  // Add fillers occasionally
  const words = result.split(' ')
  const enhanced = []

  for (let i = 0; i < words.length; i++) {
    enhanced.push(words[i])

    // Add filler words occasionally
    if (i > 0 && i < words.length - 1 && Math.random() < 0.05) {
      const filler = NATURAL_FILLERS[Math.floor(Math.random() * NATURAL_FILLERS.length)]
      // Don't add before punctuation
      if (!/[.!?,;:]/.test(words[i + 1])) {
        enhanced.push(filler)
      }
    }
  }

  // Occasionally use dashes for emphasis
  result = enhanced.join(' ')
  result = result.replace(/(\w+), (\w+)/g, (match, p1, p2) => {
    if (Math.random() < 0.1) {
      return `${p1} - ${p2}`
    }
    return match
  })

  // Add occasional parenthetical thoughts
  const sentences = result.match(/[^.!?]+[.!?]+/g) || []
  const withParentheses = []

  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i]
    if (Math.random() < 0.1 && sentence.length > 50) {
      const thoughts = [
        '(which is interesting)',
        '(I know, right?)',
        '(trust me on this)',
        '(more on that later)',
        '(but that\'s another story)',
      ]
      const thought = thoughts[Math.floor(Math.random() * thoughts.length)]
      const words = sentence.split(' ')
      const insertPoint = Math.floor(words.length / 2)
      words.splice(insertPoint, 0, thought)
      sentence = words.join(' ')
    }
    withParentheses.push(sentence)
  }

  return withParentheses.join(' ')
}

/**
 * Break up long paragraphs
 */
function breakUpParagraphs(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []

  if (sentences.length <= 3) return text

  const paragraphs = []
  let currentParagraph = []

  for (let i = 0; i < sentences.length; i++) {
    currentParagraph.push(sentences[i])

    // Create paragraph breaks at natural points
    const shouldBreak = (
      currentParagraph.length >= 3 &&
      currentParagraph.length <= 5 &&
      Math.random() > 0.6
    ) || currentParagraph.length >= 6

    if (shouldBreak && i < sentences.length - 1) {
      paragraphs.push(currentParagraph.join(' '))
      currentParagraph = []
    }
  }

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' '))
  }

  return paragraphs.join('\n\n')
}

/**
 * Add contractions to make text more casual
 */
function addContractions(text) {
  const contractions = {
    'it is': "it's",
    'that is': "that's",
    'what is': "what's",
    'where is': "where's",
    'who is': "who's",
    'how is': "how's",
    'here is': "here's",
    'there is': "there's",
    'I am': "I'm",
    'you are': "you're",
    'we are': "we're",
    'they are': "they're",
    'I have': "I've",
    'you have': "you've",
    'we have': "we've",
    'they have': "they've",
    'would not': "wouldn't",
    'should not': "shouldn't",
    'could not': "couldn't",
    'cannot': "can't",
    'will not': "won't",
    'do not': "don't",
    'does not': "doesn't",
    'did not': "didn't",
    'is not': "isn't",
    'are not': "aren't",
    'was not': "wasn't",
    'were not': "weren't",
    'have not': "haven't",
    'has not': "hasn't",
    'had not': "hadn't",
  }

  let result = text
  for (const [full, contraction] of Object.entries(contractions)) {
    // Use word boundaries and case-insensitive matching
    const regex = new RegExp(`\\b${full}\\b`, 'gi')
    result = result.replace(regex, (match) => {
      // Apply contraction 70% of the time to maintain variety
      if (Math.random() < 0.7) {
        // Preserve original case
        if (match[0] === match[0].toUpperCase()) {
          return contraction.charAt(0).toUpperCase() + contraction.slice(1)
        }
        return contraction
      }
      return match
    })
  }

  return result
}

/**
 * Vary punctuation for more natural flow
 */
function varyPunctuation(text) {
  let result = text

  // Occasionally replace periods with exclamation marks (sparingly)
  const sentences = result.match(/[^.!?]+[.!?]+/g) || []
  const varied = []

  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i]

    // Add exclamation marks for emphasis (rarely)
    if (Math.random() < 0.05 && sentence.includes('.')) {
      sentence = sentence.replace(/\.$/, '!')
    }

    // Add questions occasionally
    if (Math.random() < 0.03 && sentence.includes('.')) {
      sentence = sentence.replace(/\.$/, '?')
    }

    // Use ellipsis for trailing thoughts
    if (Math.random() < 0.02 && sentence.includes('.')) {
      sentence = sentence.replace(/\.$/, '...')
    }

    varied.push(sentence)
  }

  return varied.join(' ')
}

/**
 * Advanced humanization with multiple passes
 */
export function humanizeAdvanced(text, targetScore = 30) {
  let currentText = text
  let currentScore = detectAIAdvanced(currentText).score
  let attempts = 0
  const maxAttempts = 5
  const results = []

  while (currentScore > targetScore && attempts < maxAttempts) {
    const level = currentScore > 70 ? 'heavy' : currentScore > 50 ? 'medium' : 'light'
    const result = humanizeText(currentText, level)

    results.push({
      attempt: attempts + 1,
      text: result.humanized,
      score: result.afterScore,
      improvement: result.improvement,
      level
    })

    currentText = result.humanized
    currentScore = result.afterScore
    attempts++

    // Break if we're close enough or not improving
    if (currentScore <= targetScore || result.improvement < 5) {
      break
    }
  }

  return {
    original: text,
    final: currentText,
    originalScore: detectAIAdvanced(text).score,
    finalScore: currentScore,
    targetScore,
    attempts: results,
    success: currentScore <= targetScore
  }
}

/**
 * Batch humanization for multiple texts
 */
export function humanizeBatch(texts, level = 'medium') {
  return texts.map(text => humanizeText(text, level))
}

/**
 * Export humanization strategies for training
 */
export function getHumanizationStrategies() {
  return {
    replacements: HUMANIZATION_REPLACEMENTS,
    personalAdditions: PERSONAL_ADDITIONS,
    casualTransitions: CASUAL_TRANSITIONS,
    naturalFillers: NATURAL_FILLERS,
  }
}