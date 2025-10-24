/**
 * Free AI Detection APIs Integration
 * Combines multiple free AI detection services for comparison
 */

// Import our custom detector
import { detectAIAdvanced } from './customAIDetector'

/**
 * Sapling AI Detector (Free tier available)
 * https://sapling.ai/ai-content-detector
 */
async function detectWithSapling(text) {
  try {
    const response = await fetch('https://api.sapling.ai/api/v1/aidetect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        key: 'demo' // Demo key for testing
      })
    })

    if (response.ok) {
      const data = await response.json()
      return {
        name: 'Sapling AI',
        score: Math.round(data.score * 100),
        available: true,
        details: data
      }
    }
  } catch (error) {
    console.log('Sapling AI detector unavailable:', error.message)
  }

  return {
    name: 'Sapling AI',
    score: null,
    available: false,
    error: 'Service unavailable'
  }
}

/**
 * Writer.com AI Detector (Free, no API key needed)
 */
async function detectWithWriter(text) {
  try {
    const response = await fetch('https://enterprise-api.writer.com/content/organization/1/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text
      })
    })

    if (response.ok) {
      const data = await response.json()
      return {
        name: 'Writer.com',
        score: Math.round(data.score * 100),
        available: true,
        details: data
      }
    }
  } catch (error) {
    console.log('Writer.com detector unavailable:', error.message)
  }

  return {
    name: 'Writer.com',
    score: null,
    available: false,
    error: 'Service unavailable'
  }
}

/**
 * Hugging Face Models (Free API)
 */
async function detectWithHuggingFace(text) {
  try {
    // Using roberta-base-openai-detector model
    const response = await fetch(
      'https://api-inference.huggingface.co/models/roberta-base-openai-detector',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text.slice(0, 512) // Limit to 512 chars for free tier
        })
      }
    )

    if (response.ok) {
      const data = await response.json()
      // The model returns "LABEL_0" for human and "LABEL_1" for AI
      const aiScore = data[0]?.find(item => item.label === 'LABEL_1')?.score || 0

      return {
        name: 'HuggingFace RoBERTa',
        score: Math.round(aiScore * 100),
        available: true,
        details: data
      }
    }
  } catch (error) {
    console.log('HuggingFace detector unavailable:', error.message)
  }

  return {
    name: 'HuggingFace RoBERTa',
    score: null,
    available: false,
    error: 'Service unavailable'
  }
}

/**
 * OpenAI's own AI Text Classifier (when available)
 * Note: OpenAI discontinued this, but keeping structure for future
 */
async function detectWithOpenAIClassifier(text) {
  // OpenAI's classifier was discontinued, but we can simulate with GPT
  return {
    name: 'OpenAI Classifier',
    score: null,
    available: false,
    error: 'Discontinued by OpenAI'
  }
}

/**
 * Crossplag AI Detector (Free tier)
 */
async function detectWithCrossplag(text) {
  try {
    const response = await fetch('https://api.crossplag.com/api/v1/aicheck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        lang: 'en'
      })
    })

    if (response.ok) {
      const data = await response.json()
      return {
        name: 'Crossplag',
        score: Math.round(data.ai_probability * 100),
        available: true,
        details: data
      }
    }
  } catch (error) {
    console.log('Crossplag detector unavailable:', error.message)
  }

  return {
    name: 'Crossplag',
    score: null,
    available: false,
    error: 'Service unavailable'
  }
}

/**
 * ZeroGPT API (Limited free tier)
 */
async function detectWithZeroGPT(text) {
  try {
    const response = await fetch('https://api.zerogpt.com/api/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.slice(0, 1000), // Free tier limit
      })
    })

    if (response.ok) {
      const data = await response.json()
      return {
        name: 'ZeroGPT',
        score: Math.round(data.ai_percentage || 0),
        available: true,
        details: data
      }
    }
  } catch (error) {
    console.log('ZeroGPT detector unavailable:', error.message)
  }

  return {
    name: 'ZeroGPT',
    score: null,
    available: false,
    error: 'Service unavailable'
  }
}

/**
 * ContentAtScale AI Detector
 */
async function detectWithContentAtScale(text) {
  try {
    const response = await fetch('https://contentatscale.ai/ai-detector-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: text.slice(0, 500), // Free limit
      })
    })

    if (response.ok) {
      const data = await response.json()
      return {
        name: 'Content at Scale',
        score: Math.round(data.ai_score || 0),
        available: true,
        details: data
      }
    }
  } catch (error) {
    console.log('ContentAtScale detector unavailable:', error.message)
  }

  return {
    name: 'Content at Scale',
    score: null,
    available: false,
    error: 'Service unavailable'
  }
}

/**
 * Run all available detectors in parallel
 */
export async function runAllDetectors(text) {
  // Run our custom detector
  const customResult = detectAIAdvanced(text)

  // Prepare all detector promises
  const detectorPromises = [
    // Our custom detector (synchronous, so we wrap in Promise.resolve)
    Promise.resolve({
      name: 'Ovara Custom',
      score: customResult.score,
      available: true,
      confidence: customResult.confidence,
      details: customResult.details,
      breakdown: customResult.breakdown
    }),

    // External detectors (all async)
    detectWithSapling(text),
    detectWithWriter(text),
    detectWithHuggingFace(text),
    detectWithCrossplag(text),
    detectWithZeroGPT(text),
    detectWithContentAtScale(text),
  ]

  // Run all detectors in parallel
  const results = await Promise.all(detectorPromises)

  // Calculate statistics
  const availableResults = results.filter(r => r.available && r.score !== null)
  const scores = availableResults.map(r => r.score)

  const stats = {
    average: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    median: scores.length > 0 ? Math.round(scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)]) : 0,
    min: scores.length > 0 ? Math.min(...scores) : 0,
    max: scores.length > 0 ? Math.max(...scores) : 0,
    variance: 0,
    agreement: 0,
  }

  // Calculate variance
  if (scores.length > 1) {
    const mean = stats.average
    const squareDiffs = scores.map(score => Math.pow(score - mean, 2))
    stats.variance = Math.round(Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / scores.length))
  }

  // Calculate agreement (how many agree on the classification)
  if (scores.length > 0) {
    const classifications = scores.map(s => s < 30 ? 'human' : s < 70 ? 'mixed' : 'ai')
    const mode = classifications.sort((a, b) =>
      classifications.filter(v => v === a).length - classifications.filter(v => v === b).length
    ).pop()
    stats.agreement = Math.round((classifications.filter(c => c === mode).length / classifications.length) * 100)
  }

  return {
    results,
    stats,
    customDetector: customResult,
    timestamp: new Date().toISOString()
  }
}

/**
 * Compare our detector accuracy against others
 */
export function compareAccuracy(allResults) {
  const { results, stats, customDetector } = allResults

  // Find how close our detector is to the consensus
  const ourScore = customDetector.score
  const consensus = stats.median // Use median as it's more robust to outliers

  const accuracy = {
    deviation: Math.abs(ourScore - consensus),
    percentageMatch: Math.round((1 - Math.abs(ourScore - consensus) / 100) * 100),
    ranking: 0,
    betterThan: [],
    worseThan: [],
  }

  // Rank our detector
  const validResults = results.filter(r => r.available && r.score !== null)
  validResults.sort((a, b) =>
    Math.abs(a.score - consensus) - Math.abs(b.score - consensus)
  )

  accuracy.ranking = validResults.findIndex(r => r.name === 'Ovara Custom') + 1

  // Compare with others
  validResults.forEach(result => {
    if (result.name !== 'Ovara Custom') {
      const theirDeviation = Math.abs(result.score - consensus)
      if (accuracy.deviation < theirDeviation) {
        accuracy.betterThan.push(result.name)
      } else if (accuracy.deviation > theirDeviation) {
        accuracy.worseThan.push(result.name)
      }
    }
  })

  return accuracy
}

/**
 * Training data collection
 */
export function collectTrainingData(text, allResults, userLabel = null) {
  const trainingEntry = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    text: text.slice(0, 1000), // Store first 1000 chars
    textLength: text.length,
    wordCount: text.split(/\s+/).length,

    // Our detector results
    ovaraScore: allResults.customDetector.score,
    ovaraConfidence: allResults.customDetector.confidence,
    ovaraBreakdown: allResults.customDetector.breakdown,

    // Other detector results
    otherDetectors: allResults.results.filter(r => r.name !== 'Ovara Custom').map(r => ({
      name: r.name,
      score: r.score,
      available: r.available
    })),

    // Statistics
    consensusScore: allResults.stats.median,
    averageScore: allResults.stats.average,
    variance: allResults.stats.variance,
    agreement: allResults.stats.agreement,

    // User feedback (if provided)
    userLabel: userLabel, // 'human', 'ai', or null

    // Metadata
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }

  // Store in localStorage for now (later can send to backend)
  const storedData = localStorage.getItem('ovara_training_data') || '[]'
  const trainingData = JSON.parse(storedData)
  trainingData.push(trainingEntry)

  // Keep only last 100 entries to avoid storage issues
  if (trainingData.length > 100) {
    trainingData.shift()
  }

  localStorage.setItem('ovara_training_data', JSON.stringify(trainingData))

  return trainingEntry
}

/**
 * Export training data for analysis
 */
export function exportTrainingData() {
  const storedData = localStorage.getItem('ovara_training_data') || '[]'
  const trainingData = JSON.parse(storedData)

  const blob = new Blob([JSON.stringify(trainingData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ovara-training-data-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)

  return trainingData
}