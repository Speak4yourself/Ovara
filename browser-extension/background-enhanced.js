// APPEND THIS TO background.js - API Handlers for Grammar Check and AI Coach

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Same as in popup.js
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Same as in popup.js

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkGrammarAPI') {
    checkGrammarAPI(request.text, request.session).then(sendResponse);
    return true; // Async response
  } else if (request.action === 'getCoachSuggestions') {
    getCoachSuggestions(request.text, request.session).then(sendResponse);
    return true; // Async response
  } else if (request.action === 'coachAction') {
    handleCoachAction(request.actionType, request.text).then(sendResponse);
    return true; // Async response
  }
});

// Grammar Check API
async function checkGrammarAPI(text, session) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/check-grammar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      // Fallback to mock data for testing
      return getMockGrammarSuggestions(text);
    }

    const data = await response.json();
    return { suggestions: data.suggestions || [] };
  } catch (error) {
    console.error('Grammar API error:', error);
    // Return mock data for testing
    return getMockGrammarSuggestions(text);
  }
}

// Mock grammar suggestions for testing
function getMockGrammarSuggestions(text) {
  const suggestions = [];

  // Simple grammar checks (for demo purposes)
  if (text.toLowerCase().includes('your welcome')) {
    suggestions.push({
      text: 'your welcome',
      corrected: "you're welcome",
      explanation: "Use 'you're' (you are) instead of 'your' (possessive)"
    });
  }

  if (text.toLowerCase().includes('its great')) {
    suggestions.push({
      text: 'its great',
      corrected: "it's great",
      explanation: "Use 'it's' (it is) instead of 'its' (possessive)"
    });
  }

  if (text.toLowerCase().includes('alot')) {
    suggestions.push({
      text: 'alot',
      corrected: 'a lot',
      explanation: "'Alot' is not a word. Use 'a lot' (two words)"
    });
  }

  if (text.toLowerCase().includes('their going')) {
    suggestions.push({
      text: 'their going',
      corrected: "they're going",
      explanation: "Use 'they're' (they are) for actions, not 'their' (possessive)"
    });
  }

  return { suggestions };
}

// AI Coach Suggestions API
async function getCoachSuggestions(text, session) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/coach-suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      // Fallback to mock data
      return getMockCoachSuggestions(text);
    }

    const data = await response.json();
    return { suggestions: data.suggestions || [] };
  } catch (error) {
    console.error('Coach API error:', error);
    return getMockCoachSuggestions(text);
  }
}

// Mock coach suggestions
function getMockCoachSuggestions(text) {
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  const suggestions = [];

  if (wordCount < 50) {
    suggestions.push({
      icon: '📝',
      text: 'Your essay is quite short. Consider expanding your ideas with more details and examples.'
    });
  }

  if (wordCount > 500) {
    suggestions.push({
      icon: '✅',
      text: 'Good length! You have substantial content. Make sure each paragraph has a clear point.'
    });
  }

  if (sentences.length > 0) {
    const avgWordsPerSentence = wordCount / sentences.length;

    if (avgWordsPerSentence > 25) {
      suggestions.push({
        icon: '✂️',
        text: 'Some sentences are quite long. Consider breaking them into shorter, clearer sentences.'
      });
    }

    if (avgWordsPerSentence < 10) {
      suggestions.push({
        icon: '🔗',
        text: 'Your sentences are very short. Try varying sentence length for better flow.'
      });
    }
  }

  // Check for common issues
  if (text.toLowerCase().includes('very')) {
    suggestions.push({
      icon: '💪',
      text: 'Replace "very" + adjective with a stronger single word (e.g., "very good" → "excellent").'
    });
  }

  if ((text.match(/\bI\b/g) || []).length > wordCount * 0.05) {
    suggestions.push({
      icon: '👤',
      text: 'You use "I" frequently. Consider using more objective language for academic writing.'
    });
  }

  const passiveCount = (text.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || []).length;
  if (passiveCount > 3) {
    suggestions.push({
      icon: '⚡',
      text: 'Try using more active voice. Active sentences are clearer and more engaging.'
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      icon: '🎯',
      text: 'Looking good! Keep writing and develop your ideas further.'
    });
  }

  return { suggestions };
}

// Handle Coach Actions (Improve, Expand, Summarize)
async function handleCoachAction(actionType, text) {
  try {
    const session = await chrome.storage.local.get(['session']);
    if (!session.session) {
      return { result: 'Please login first' };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/coach-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action: actionType, text })
    });

    if (!response.ok) {
      // Fallback to mock results
      return getMockCoachAction(actionType, text);
    }

    const data = await response.json();
    return { result: data.result };
  } catch (error) {
    console.error('Coach action error:', error);
    return getMockCoachAction(actionType, text);
  }
}

// Mock coach actions
function getMockCoachAction(actionType, text) {
  if (actionType === 'improve') {
    return {
      result: `Enhanced version: ${text.substring(0, 100)}... [This would be improved by AI]`
    };
  } else if (actionType === 'expand') {
    return {
      result: `Expanded ideas: The key points to explore further include... [AI would expand on the text] ${text.substring(0, 50)}...`
    };
  } else if (actionType === 'summarize') {
    const words = text.trim().split(/\s+/);
    const summary = words.slice(0, 30).join(' ') + '...';
    return {
      result: `Summary: ${summary} [AI would provide a concise summary]`
    };
  }

  return { result: 'Action completed!' };
}

console.log('Ovara enhanced background service worker loaded');
