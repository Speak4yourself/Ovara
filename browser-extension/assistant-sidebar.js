// Ovara Assistant Sidebar - Core Logic
let selectedText = '';
let currentUser = null;
let userTier = 'free';
let requestsToday = 0;
let dailyLimit = 10;
let lastActiveElement = null;
let pageContext = null;
let voiceRecognition = null;
let isRecording = false;
let voiceEnabled = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserData();
  await loadSettings();
  await loadVoicePermission();
  setupEventListeners();
  updateUI();
  applyTheme();
  initializeVoiceRecognition();
});

// Load settings
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['assistantSettings']);

    if (result.assistantSettings) {
      const settings = result.assistantSettings;

      // Apply theme
      let theme = settings.theme;
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
      }

      if (theme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Apply theme function
function applyTheme() {
  // Listen for theme changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.assistantSettings) {
      const settings = changes.assistantSettings.newValue;
      let theme = settings.theme;

      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
      }

      if (theme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  });
}

// Load user data from storage
async function loadUserData() {
  try {
    const result = await chrome.storage.local.get(['user', 'userTier', 'requestsToday', 'lastRequestDate']);

    if (result.user) {
      currentUser = result.user;
      userTier = result.userTier || 'free';

      // Reset requests if it's a new day
      const today = new Date().toDateString();
      if (result.lastRequestDate !== today) {
        requestsToday = 0;
        await chrome.storage.local.set({ requestsToday: 0, lastRequestDate: today });
      } else {
        requestsToday = result.requestsToday || 0;
      }
    }

    // Set limits based on tier
    if (userTier === 'premium') {
      dailyLimit = 999999; // Unlimited
    } else if (userTier === 'pro') {
      dailyLimit = 500;
    } else {
      dailyLimit = 10;
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Close button
  document.getElementById('closeBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'closeSidebar' });
  });

  // Quick action buttons
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      handleQuickAction(action);
    });
  });

  // Generate button
  document.getElementById('generateBtn').addEventListener('click', handleGenerate);

  // Select text button
  document.getElementById('selectTextBtn').addEventListener('click', handleSelectText);

  // Copy button
  document.getElementById('copyBtn').addEventListener('click', handleCopy);

  // Insert button
  document.getElementById('insertBtn').addEventListener('click', handleInsert);

  // Permission buttons
  document.getElementById('allowBtn').addEventListener('click', () => {
    hidePermissionPrompt(true);
  });

  document.getElementById('denyBtn').addEventListener('click', () => {
    hidePermissionPrompt(false);
  });

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'selectedTextUpdate') {
      selectedText = message.text;
      updateContextText(message.text);
    }
  });

  // Listen for page context messages from content script
  window.addEventListener('message', (event) => {
    if (event.data.action === 'pageContextUpdate') {
      pageContext = event.data.context;
      updatePageContext(pageContext);
    }
  });

  // Page action buttons
  document.getElementById('summarizePageBtn').addEventListener('click', handleSummarizePage);
  document.getElementById('explainPageBtn').addEventListener('click', handleExplainPage);
}

// Update UI elements
function updateUI() {
  // Update tier badge
  const tierBadge = document.getElementById('tierBadge');
  tierBadge.textContent = userTier.toUpperCase();
  if (userTier === 'premium') {
    tierBadge.classList.add('premium');
  }

  // Update usage stats
  document.getElementById('requestsToday').textContent = requestsToday;
  document.getElementById('dailyLimit').textContent = dailyLimit === 999999 ? '∞' : dailyLimit;
}

// Handle quick actions
function handleQuickAction(action) {
  const promptInput = document.getElementById('promptInput');

  if (!selectedText) {
    alert('Please select text from the page first!');
    return;
  }

  let prompt = '';
  switch (action) {
    case 'rewrite':
      prompt = `Rewrite the following text to make it better:\n\n${selectedText}`;
      break;
    case 'summarize':
      prompt = `Summarize the following text:\n\n${selectedText}`;
      break;
    case 'humanize':
      prompt = `Make the following text sound more human and natural:\n\n${selectedText}`;
      break;
    case 'detect':
      prompt = `Analyze if the following text was written by AI:\n\n${selectedText}`;
      break;
    case 'grammar':
      prompt = `Check and fix grammar in the following text:\n\n${selectedText}`;
      break;
    case 'expand':
      prompt = `Expand and elaborate on the following text:\n\n${selectedText}`;
      break;
  }

  promptInput.value = prompt;
  promptInput.focus();
}

// Handle generate button
async function handleGenerate() {
  const prompt = document.getElementById('promptInput').value.trim();

  if (!prompt) {
    alert('Please enter a prompt!');
    return;
  }

  if (!currentUser) {
    alert('Please sign in to use Ovara Assistant!');
    return;
  }

  if (requestsToday >= dailyLimit) {
    alert('You have reached your daily limit! Upgrade to Premium for unlimited requests.');
    return;
  }

  try {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    // Show loading in results
    const resultsSection = document.getElementById('resultsSection');
    const resultText = document.getElementById('resultText');
    resultsSection.classList.add('active');
    resultText.innerHTML = '<div class="loading"><div class="spinner"></div>Processing your request...</div>';

    // Send message to background script to make API call
    chrome.runtime.sendMessage({
      action: 'generateAI',
      prompt: prompt,
      context: selectedText,
      user: currentUser
    }, (response) => {
      if (response.success) {
        resultText.textContent = response.result;

        // Update request count
        requestsToday++;
        chrome.storage.local.set({ requestsToday: requestsToday });
        updateUI();
      } else {
        resultText.textContent = `Error: ${response.error}`;
      }

      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate';
    });
  } catch (error) {
    console.error('Error generating:', error);
    alert('An error occurred. Please try again.');

    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate';
  }
}

// Handle select text from page
function handleSelectText() {
  // Send message to content script to activate selection mode
  chrome.runtime.sendMessage({ action: 'activateSelection' });

  // Show instruction
  alert('Select any text on the page. It will be automatically captured.');
}

// Update context text display
function updateContextText(text) {
  const contextText = document.getElementById('contextText');
  if (text && text.trim()) {
    const preview = text.substring(0, 200) + (text.length > 200 ? '...' : '');
    contextText.textContent = preview;
  } else {
    contextText.textContent = 'No text selected';
  }
}

// Handle copy result
function handleCopy() {
  const resultText = document.getElementById('resultText').textContent;

  if (!resultText || resultText.includes('loading')) {
    return;
  }

  navigator.clipboard.writeText(resultText).then(() => {
    const copyBtn = document.getElementById('copyBtn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Error copying:', err);
    alert('Failed to copy text');
  });
}

// Handle insert result into page
async function handleInsert() {
  const resultText = document.getElementById('resultText').textContent;

  if (!resultText || resultText.includes('loading')) {
    return;
  }

  // Show permission prompt
  showPermissionPrompt();
}

// Show permission prompt
function showPermissionPrompt() {
  const prompt = document.getElementById('permissionPrompt');
  prompt.classList.add('active');
}

// Hide permission prompt
function hidePermissionPrompt(allowed) {
  const prompt = document.getElementById('permissionPrompt');
  prompt.classList.remove('active');

  if (allowed) {
    const resultText = document.getElementById('resultText').textContent;

    // Send message to content script to insert text
    chrome.runtime.sendMessage({
      action: 'insertText',
      text: resultText
    }, (response) => {
      if (response && response.success) {
        alert('Text inserted successfully!');
      } else {
        alert('Failed to insert text. Please make sure a text field is focused.');
      }
    });
  }
}

// ====================================
// PAGE CONTEXT FUNCTIONS
// ====================================

// Update page context display
function updatePageContext(context) {
  if (!context) return;

  // Update page title
  const pageTitle = document.getElementById('pageTitle');
  if (context.title) {
    pageTitle.textContent = context.title.substring(0, 40) + (context.title.length > 40 ? '...' : '');
    pageTitle.title = context.title; // Full title on hover
  }

  // Update page type with emoji
  const pageType = document.getElementById('pageType');
  const typeEmoji = getPageTypeEmoji(context.pageType);
  pageType.textContent = `${typeEmoji} ${formatPageType(context.pageType)}`;

  // Update readability info
  if (context.readability && context.readability.wordCount > 0) {
    const readabilityInfo = document.getElementById('readabilityInfo');
    const readabilityText = document.getElementById('readabilityText');
    readabilityInfo.style.display = 'flex';
    readabilityText.textContent = `${context.readability.wordCount} words, ${context.readability.readingTime} min read`;
  }

  // Update focused field info
  if (context.focusedField) {
    const focusedFieldInfo = document.getElementById('focusedFieldInfo');
    const focusedFieldText = document.getElementById('focusedFieldText');
    focusedFieldInfo.style.display = 'flex';
    focusedFieldText.textContent = context.focusedField.placeholder || 'Text field';
  } else {
    document.getElementById('focusedFieldInfo').style.display = 'none';
  }

  // Show proactive suggestions based on page type
  showProactiveSuggestions(context);
}

// Get emoji for page type
function getPageTypeEmoji(pageType) {
  const emojiMap = {
    'google-docs': '📝',
    'google-sheets': '📊',
    'google-slides': '📽️',
    'gmail': '📧',
    'outlook': '📧',
    'medium': '✍️',
    'notion': '📓',
    'wordpress': '📰',
    'substack': '📰',
    'twitter': '🐦',
    'linkedin': '💼',
    'facebook': '👥',
    'reddit': '🤖',
    'article': '📰',
    'blog': '📝',
    'form': '📋',
    'form-heavy': '📋',
    'survey': '📊',
    'general': '🌐'
  };
  return emojiMap[pageType] || '🌐';
}

// Format page type for display
function formatPageType(pageType) {
  const nameMap = {
    'google-docs': 'Google Docs',
    'google-sheets': 'Google Sheets',
    'google-slides': 'Google Slides',
    'gmail': 'Gmail',
    'outlook': 'Outlook',
    'medium': 'Medium',
    'notion': 'Notion',
    'wordpress': 'WordPress',
    'substack': 'Substack',
    'twitter': 'Twitter/X',
    'linkedin': 'LinkedIn',
    'facebook': 'Facebook',
    'reddit': 'Reddit',
    'article': 'Article',
    'blog': 'Blog Post',
    'form': 'Form',
    'form-heavy': 'Forms',
    'survey': 'Survey',
    'general': 'Web Page'
  };
  return nameMap[pageType] || 'Web Page';
}

// Show proactive suggestions based on page type
function showProactiveSuggestions(context) {
  const suggestionsSection = document.getElementById('suggestionsSection');
  const suggestionsContainer = document.getElementById('suggestionsContainer');

  // Get suggestions based on page type
  const suggestions = getSuggestionsForPageType(context.pageType, context);

  if (suggestions.length === 0) {
    suggestionsSection.style.display = 'none';
    return;
  }

  // Clear existing suggestions
  suggestionsContainer.innerHTML = '';

  // Add new suggestions
  suggestions.forEach(suggestion => {
    const suggestionEl = document.createElement('div');
    suggestionEl.className = 'suggestion-item';
    suggestionEl.innerHTML = `
      <div class="suggestion-icon">${suggestion.icon}</div>
      <div class="suggestion-content">
        <div class="suggestion-title">${suggestion.title}</div>
        <div class="suggestion-desc">${suggestion.description}</div>
      </div>
    `;

    // Click handler to auto-fill prompt
    suggestionEl.addEventListener('click', () => {
      const promptInput = document.getElementById('promptInput');
      promptInput.value = suggestion.prompt;
      promptInput.focus();

      // If suggestion should auto-generate, click the button
      if (suggestion.autoGenerate) {
        setTimeout(() => {
          document.getElementById('generateBtn').click();
        }, 300);
      }
    });

    suggestionsContainer.appendChild(suggestionEl);
  });

  // Show suggestions section
  suggestionsSection.style.display = 'block';
}

// Get context-aware suggestions based on page type
function getSuggestionsForPageType(pageType, context) {
  const suggestions = [];

  switch (pageType) {
    case 'google-docs':
      suggestions.push({
        icon: '✍️',
        title: 'Writing Assistant',
        description: 'I can help you write, edit, or improve your document',
        prompt: 'Help me improve my writing style and clarity',
        autoGenerate: false
      });
      suggestions.push({
        icon: '🎯',
        title: 'Structure Helper',
        description: 'Get suggestions for better document organization',
        prompt: 'Suggest ways to improve the structure and flow of this document',
        autoGenerate: false
      });
      break;

    case 'gmail':
    case 'outlook':
      suggestions.push({
        icon: '📧',
        title: 'Email Composer',
        description: 'Help compose professional emails',
        prompt: 'Help me write a professional email about: ',
        autoGenerate: false
      });
      suggestions.push({
        icon: '🎨',
        title: 'Tone Adjustment',
        description: 'Make your email more formal or casual',
        prompt: 'Rewrite this email to be more professional and polite',
        autoGenerate: false
      });
      break;

    case 'medium':
    case 'wordpress':
    case 'substack':
    case 'blog':
      suggestions.push({
        icon: '📝',
        title: 'Blog Post Helper',
        description: 'Get ideas for your blog post or article',
        prompt: 'Suggest engaging headlines and opening paragraphs for a blog post about: ',
        autoGenerate: false
      });
      suggestions.push({
        icon: '🔍',
        title: 'SEO Optimization',
        description: 'Improve your content for search engines',
        prompt: 'Suggest SEO improvements and keywords for this content',
        autoGenerate: false
      });
      break;

    case 'twitter':
      suggestions.push({
        icon: '🐦',
        title: 'Tweet Helper',
        description: 'Craft engaging tweets (280 characters)',
        prompt: 'Write an engaging tweet (max 280 characters) about: ',
        autoGenerate: false
      });
      suggestions.push({
        icon: '🔥',
        title: 'Thread Creator',
        description: 'Break down ideas into a Twitter thread',
        prompt: 'Turn this into a compelling Twitter thread with multiple tweets',
        autoGenerate: false
      });
      break;

    case 'linkedin':
      suggestions.push({
        icon: '💼',
        title: 'Professional Post',
        description: 'Create engaging LinkedIn content',
        prompt: 'Write a professional LinkedIn post about: ',
        autoGenerate: false
      });
      suggestions.push({
        icon: '🎯',
        title: 'Career Content',
        description: 'Highlight achievements and insights',
        prompt: 'Help me write about my professional experience or insights on: ',
        autoGenerate: false
      });
      break;

    case 'reddit':
      suggestions.push({
        icon: '💬',
        title: 'Reddit Post',
        description: 'Create engaging Reddit posts and comments',
        prompt: 'Help me write a Reddit post that will spark discussion about: ',
        autoGenerate: false
      });
      break;

    case 'notion':
      suggestions.push({
        icon: '📓',
        title: 'Notes Organizer',
        description: 'Structure and organize your notes',
        prompt: 'Help me organize and structure these notes better',
        autoGenerate: false
      });
      break;

    case 'article':
      if (context.mainContent && context.readability.wordCount > 100) {
        suggestions.push({
          icon: '📚',
          title: 'Quick Summary',
          description: 'Get a concise summary of this article',
          prompt: `Summarize the following article:\n\n${context.mainContent}`,
          autoGenerate: false
        });
        suggestions.push({
          icon: '💡',
          title: 'Key Takeaways',
          description: 'Extract the main points and insights',
          prompt: `List the key takeaways and main insights from this article:\n\n${context.mainContent}`,
          autoGenerate: false
        });
      }
      break;

    case 'form':
    case 'form-heavy':
    case 'survey':
      suggestions.push({
        icon: '📋',
        title: 'Form Helper',
        description: 'Get help filling out forms professionally',
        prompt: 'Help me write professional responses for this form about: ',
        autoGenerate: false
      });
      break;

    default:
      // General suggestions for any page
      if (context.mainContent && context.readability.wordCount > 100) {
        suggestions.push({
          icon: '📝',
          title: 'Summarize This Page',
          description: 'Get a quick summary of the content',
          prompt: `Summarize the main points of this page:\n\n${context.mainContent}`,
          autoGenerate: false
        });
      }

      if (context.focusedField) {
        suggestions.push({
          icon: '✍️',
          title: 'Writing Help',
          description: 'Get help with what you\'re writing',
          prompt: 'Help me write about: ',
          autoGenerate: false
        });
      }
      break;
  }

  return suggestions;
}

// Handle summarize page button
async function handleSummarizePage() {
  if (!pageContext || !pageContext.mainContent) {
    alert('No content available to summarize on this page.');
    return;
  }

  if (!currentUser) {
    alert('Please sign in to use this feature!');
    return;
  }

  const promptInput = document.getElementById('promptInput');
  promptInput.value = `Summarize the following content:\n\n${pageContext.mainContent}`;

  // Auto-click generate
  document.getElementById('generateBtn').click();
}

// Handle explain page button
async function handleExplainPage() {
  if (!pageContext || !pageContext.mainContent) {
    alert('No content available to explain on this page.');
    return;
  }

  if (!currentUser) {
    alert('Please sign in to use this feature!');
    return;
  }

  const promptInput = document.getElementById('promptInput');
  promptInput.value = `Explain the following content in simple terms:\n\n${pageContext.mainContent}`;

  // Auto-click generate
  document.getElementById('generateBtn').click();
}

// ====================================
// VOICE INPUT
// ====================================

// Load voice permission
async function loadVoicePermission() {
  try {
    const result = await chrome.storage.local.get(['permissions']);
    if (result.permissions && result.permissions.voiceInput) {
      voiceEnabled = true;
    }
  } catch (error) {
    console.error('Error loading voice permission:', error);
  }
}

// Initialize voice recognition
function initializeVoiceRecognition() {
  // Check if browser supports speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.log('Speech recognition not supported in this browser');
    document.getElementById('voiceInputBtn').style.display = 'none';
    return;
  }

  voiceRecognition = new SpeechRecognition();
  voiceRecognition.continuous = true;
  voiceRecognition.interimResults = true;
  voiceRecognition.lang = 'en-US';

  let finalTranscript = '';

  voiceRecognition.onresult = (event) => {
    let interimTranscript = '';
    finalTranscript = '';

    for (let i = 0; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    // Update prompt input
    const promptInput = document.getElementById('promptInput');
    promptInput.value = finalTranscript + interimTranscript;
  };

  voiceRecognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    stopVoiceRecording();

    if (event.error === 'not-allowed') {
      alert('Microphone access denied. Please enable it in your browser settings.');
    }
  };

  voiceRecognition.onend = () => {
    if (isRecording) {
      stopVoiceRecording();
    }
  };

  // Voice input button listener (added to existing setupEventListeners)
  document.getElementById('voiceInputBtn').addEventListener('click', toggleVoiceRecording);
}

// Toggle voice recording
function toggleVoiceRecording() {
  if (!voiceEnabled) {
    alert('Voice input is disabled. Enable it in Settings → Privacy & Permissions.');
    return;
  }

  if (!voiceRecognition) {
    alert('Speech recognition is not supported in your browser.');
    return;
  }

  if (isRecording) {
    stopVoiceRecording();
  } else {
    startVoiceRecording();
  }
}

// Start voice recording
function startVoiceRecording() {
  try {
    voiceRecognition.start();
    isRecording = true;

    // Update UI
    const voiceBtn = document.getElementById('voiceInputBtn');
    const voiceIcon = document.getElementById('voiceBtnIcon');
    voiceBtn.classList.add('recording');
    voiceIcon.textContent = '⏹️';

    // Clear prompt input for fresh voice input
    const promptInput = document.getElementById('promptInput');
    promptInput.value = '';
    promptInput.placeholder = 'Listening... Speak your prompt';
  } catch (error) {
    console.error('Error starting voice recognition:', error);
    isRecording = false;
  }
}

// Stop voice recording
function stopVoiceRecording() {
  try {
    if (voiceRecognition && isRecording) {
      voiceRecognition.stop();
    }
  } catch (error) {
    console.error('Error stopping voice recognition:', error);
  }

  isRecording = false;

  // Update UI
  const voiceBtn = document.getElementById('voiceInputBtn');
  const voiceIcon = document.getElementById('voiceBtnIcon');
  voiceBtn.classList.remove('recording');
  voiceIcon.textContent = '🎤';

  // Restore placeholder
  const promptInput = document.getElementById('promptInput');
  if (!promptInput.value) {
    promptInput.placeholder = 'Ask me to write, edit, or analyze anything...';
  }
}
