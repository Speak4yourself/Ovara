// Ovara Browser Extension - Background Service Worker

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Ovara extension installed');

    // Open welcome page (optional)
    // chrome.tabs.create({ url: 'https://your-app-url.com/welcome' });
  } else if (details.reason === 'update') {
    console.log('Ovara extension updated');
  }
});

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Same as in popup.js
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Same as in popup.js

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'logActivity') {
    // Log user activity for analytics (optional)
    console.log('Activity logged:', request.data);
  } else if (request.action === 'checkGrammarAPI') {
    checkGrammarAPI(request.text, request.session).then(sendResponse);
    return true; // Async response
  } else if (request.action === 'getCoachSuggestions') {
    getCoachSuggestions(request.text, request.session).then(sendResponse);
    return true; // Async response
  } else if (request.action === 'coachAction') {
    handleCoachAction(request.actionType, request.text).then(sendResponse);
    return true; // Async response
  } else if (request.action === 'generateAI') {
    generateAIResponse(request.prompt, request.context, request.user).then(sendResponse);
    return true; // Async response
  } else if (request.action === 'updateSelectedText') {
    // Store selected text in storage
    chrome.storage.local.set({ selectedText: request.text });
    sendResponse({ success: true });
  } else if (request.action === 'openAssistant') {
    // Send message to active tab to open assistant
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleAssistant' });
      }
    });
    sendResponse({ success: true });
  }

  // Always return true to indicate async response
  return true;
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

// Handle extension icon click (optional - already handled by popup)
chrome.action.onClicked.addListener((tab) => {
  // This won't fire if popup is defined, but keeping for reference
  console.log('Extension icon clicked');
});

// Context menu integration (right-click menu)
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for text selection
  chrome.contextMenus.create({
    id: 'ovara-humanize',
    title: 'Humanize with Ovara',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'ovara-detect',
    title: 'Detect AI with Ovara',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'ovara-autotype',
    title: 'Auto-Type This Text',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;

  switch (info.menuItemId) {
    case 'ovara-humanize':
      // Send selected text to web app
      chrome.tabs.create({
        url: `https://your-app-url.com/humanizer?text=${encodeURIComponent(selectedText)}`
      });
      break;

    case 'ovara-detect':
      // Send selected text to detector
      chrome.tabs.create({
        url: `https://your-app-url.com/detector?text=${encodeURIComponent(selectedText)}`
      });
      break;

    case 'ovara-autotype':
      // Store text for autotyper
      chrome.storage.local.set({
        pendingAutotype: selectedText
      });

      // Open popup to start autotyping
      chrome.action.openPopup();
      break;
  }
});

// Keyboard shortcuts (defined in manifest)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-autotyper') {
    chrome.action.openPopup();
  } else if (command === 'toggle-assistant') {
    // Toggle Ovara Assistant in active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleAssistant' });
      }
    });
  }
});

// Badge notifications (optional - show usage count, etc.)
async function updateBadge() {
  const session = await chrome.storage.local.get(['session']);

  if (session.session) {
    // User is logged in - show green indicator
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    chrome.action.setBadgeText({ text: '✓' });
  } else {
    // User is logged out
    chrome.action.setBadgeText({ text: '' });
  }
}

// Update badge on startup and when storage changes
chrome.runtime.onStartup.addListener(updateBadge);
chrome.storage.onChanged.addListener(updateBadge);

// Check for updates periodically (optional)
setInterval(() => {
  console.log('Checking for extension updates...');
  chrome.runtime.requestUpdateCheck((status) => {
    if (status === 'update_available') {
      console.log('Update available');
    }
  });
}, 1000 * 60 * 60); // Check every hour

// Handle tab updates (optional - inject content script)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Content script is already injected via manifest
    // But you can do additional setup here if needed
  }
});

// ====================================
// OVARA ASSISTANT AI GENERATION
// ====================================

async function generateAIResponse(prompt, context, user) {
  try {
    // Get user session
    const result = await chrome.storage.local.get(['session', 'userTier']);
    if (!result.session) {
      return { success: false, error: 'Please sign in to use Ovara Assistant' };
    }

    // Check rate limits based on tier
    const tier = result.userTier || 'free';
    const canProceed = await checkRateLimit(tier);

    if (!canProceed) {
      return { success: false, error: 'Daily limit reached. Upgrade to Premium for unlimited requests.' };
    }

    // Prepare the full prompt with context
    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `Context from page: "${context}"\n\nUser request: ${prompt}`;
    }

    // Call Supabase Edge Function (OpenAI API)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ovara-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${result.session.access_token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        user_id: result.session.user.id,
        tier: tier
      })
    });

    if (!response.ok) {
      // Fallback to mock response for testing
      return getMockAIResponse(prompt, context);
    }

    const data = await response.json();

    // Increment request count
    await incrementRequestCount();

    return {
      success: true,
      result: data.result || data.text || 'Response generated successfully'
    };
  } catch (error) {
    console.error('AI Generation error:', error);
    // Return mock response for testing
    return getMockAIResponse(prompt, context);
  }
}

// Mock AI Response for testing
function getMockAIResponse(prompt, context) {
  let response = '';

  if (prompt.toLowerCase().includes('rewrite')) {
    response = 'Here is the rewritten version:\n\n[AI would provide a rewritten version of your text here. This is a mock response for testing.]';
  } else if (prompt.toLowerCase().includes('summarize')) {
    response = 'Summary:\n\n[AI would provide a concise summary of the text. This is a mock response for testing.]';
  } else if (prompt.toLowerCase().includes('humanize')) {
    response = '[AI would rewrite the text to sound more natural and human. This is a mock response for testing.]';
  } else if (prompt.toLowerCase().includes('detect')) {
    response = 'AI Detection Result:\n\nThis text shows characteristics of AI-generated content with 68% confidence.\n\n[This is a mock response for testing.]';
  } else if (prompt.toLowerCase().includes('grammar')) {
    response = 'Grammar Check:\n\n[AI would provide grammar corrections and suggestions. This is a mock response for testing.]';
  } else if (prompt.toLowerCase().includes('expand')) {
    response = 'Expanded version:\n\n[AI would expand on your ideas with more details and examples. This is a mock response for testing.]';
  } else {
    response = `I received your request: "${prompt}"\n\n[This is a mock AI response. Once connected to the API, I will provide real AI-generated responses here.]`;
  }

  if (context) {
    response += `\n\nContext used: "${context.substring(0, 50)}..."`;
  }

  return {
    success: true,
    result: response
  };
}

// Check rate limit based on tier
async function checkRateLimit(tier) {
  const today = new Date().toDateString();
  const result = await chrome.storage.local.get(['requestsToday', 'lastRequestDate']);

  // Reset if new day
  if (result.lastRequestDate !== today) {
    await chrome.storage.local.set({ requestsToday: 0, lastRequestDate: today });
    return true;
  }

  const requestsToday = result.requestsToday || 0;

  // Check limits
  if (tier === 'premium') {
    return true; // Unlimited
  } else if (tier === 'pro') {
    return requestsToday < 500;
  } else {
    return requestsToday < 10;
  }
}

// Increment request count
async function incrementRequestCount() {
  const result = await chrome.storage.local.get(['requestsToday']);
  const count = (result.requestsToday || 0) + 1;
  await chrome.storage.local.set({ requestsToday: count });
}

// ====================================
// CONTEXT MENU (RIGHT-CLICK)
// ====================================

let contextMenuEnabled = false;

// Load context menu permission
async function loadContextMenuPermission() {
  try {
    const result = await chrome.storage.local.get(['permissions']);
    if (result.permissions && result.permissions.contextMenu) {
      contextMenuEnabled = true;
      createContextMenus();
    }
  } catch (error) {
    console.error('Error loading context menu permission:', error);
  }
}

// Create context menus
function createContextMenus() {
  if (!contextMenuEnabled) return;

  // Remove existing menus first
  chrome.contextMenus.removeAll(() => {
    // Parent menu
    chrome.contextMenus.create({
      id: 'ovara-parent',
      title: '✨ Ask Ovara',
      contexts: ['selection']
    });

    // Quick actions
    chrome.contextMenus.create({
      id: 'ovara-rewrite',
      parentId: 'ovara-parent',
      title: '✏️ Rewrite',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ovara-summarize',
      parentId: 'ovara-parent',
      title: '📝 Summarize',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ovara-humanize',
      parentId: 'ovara-parent',
      title: '✨ Humanize',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ovara-grammar',
      parentId: 'ovara-parent',
      title: '📚 Check Grammar',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ovara-separator',
      parentId: 'ovara-parent',
      type: 'separator',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ovara-explain',
      parentId: 'ovara-parent',
      title: '💡 Explain This',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ovara-translate',
      parentId: 'ovara-parent',
      title: '🌍 Translate',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ovara-custom',
      parentId: 'ovara-parent',
      title: '🎯 Custom Prompt...',
      contexts: ['selection']
    });

    console.log('🖱️ Context menus created');
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;
  let action = '';
  let prompt = '';

  switch (info.menuItemId) {
    case 'ovara-rewrite':
      action = 'rewrite';
      prompt = `Rewrite the following text to make it better:\n\n${selectedText}`;
      break;
    case 'ovara-summarize':
      action = 'summarize';
      prompt = `Summarize the following text:\n\n${selectedText}`;
      break;
    case 'ovara-humanize':
      action = 'humanize';
      prompt = `Make the following text sound more human and natural:\n\n${selectedText}`;
      break;
    case 'ovara-grammar':
      action = 'grammar';
      prompt = `Check and fix grammar in the following text:\n\n${selectedText}`;
      break;
    case 'ovara-explain':
      action = 'explain';
      prompt = `Explain the following text in simple terms:\n\n${selectedText}`;
      break;
    case 'ovara-translate':
      action = 'translate';
      prompt = `Translate the following text to English:\n\n${selectedText}`;
      break;
    case 'ovara-custom':
      action = 'custom';
      prompt = selectedText; // Just pass the text, user will write their own prompt
      break;
    default:
      return;
  }

  // Send message to content script
  chrome.tabs.sendMessage(tab.id, {
    action: 'contextMenuAction',
    menuAction: action,
    text: selectedText,
    prompt: prompt
  });
});

// Listen for permission updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'permissionsUpdated') {
    if (message.permissions.contextMenu && !contextMenuEnabled) {
      contextMenuEnabled = true;
      createContextMenus();
    } else if (!message.permissions.contextMenu && contextMenuEnabled) {
      contextMenuEnabled = false;
      chrome.contextMenus.removeAll();
    }
  }
});

// Initialize context menus
loadContextMenuPermission();

console.log('Ovara background service worker initialized');
