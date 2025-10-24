// Ovara Browser Extension - Popup Script
// Handles authentication, UI navigation, and communication with content script

const SUPABASE_URL = 'https://voluiferhsehqrlwsjaq.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbHVpZmVyaHNlaHFybHdzamFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzY4NTIsImV4cCI6MjA3NTk1Mjg1Mn0.NH_4iG_aDQjd70iB-NjOumP1p8pfwDwqbRojmhmV2TQ'; // Replace with your Supabase anon key

// UI Elements
const loading = document.getElementById('loading');
const loginScreen = document.getElementById('loginScreen');
const mainScreen = document.getElementById('mainScreen');
const autotyperPanel = document.getElementById('autotyperPanel');
const errorMessage = document.getElementById('errorMessage');

// Login elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');

// Main screen elements
const userEmail = document.getElementById('userEmail');
const userTier = document.getElementById('userTier');
const logoutBtn = document.getElementById('logoutBtn');
const autotyperBtn = document.getElementById('autotyperBtn');
const humanizerBtn = document.getElementById('humanizerBtn');
const citationBtn = document.getElementById('citationBtn');
const detectorBtn = document.getElementById('detectorBtn');
const grammarBtn = document.getElementById('grammarBtn');
const coachBtn = document.getElementById('coachBtn');
const savedEssaysBtn = document.getElementById('savedEssaysBtn');
const communityBtn = document.getElementById('communityBtn');
const upgradeBtn = document.getElementById('upgradeBtn');

// Autotyper elements
const backBtn = document.getElementById('backBtn');
const autotypeText = document.getElementById('autotypeText');
const characterCounter = document.getElementById('characterCounter');
const charCount = document.getElementById('charCount');
const charLimit = document.getElementById('charLimit');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const startAutotypeBtn = document.getElementById('startAutotypeBtn');
const stopAutotypeBtn = document.getElementById('stopAutotypeBtn');
const pauseAutotypeBtn = document.getElementById('pauseAutotypeBtn');

// Humanization sliders
const variationSlider = document.getElementById('variationSlider');
const variationValue = document.getElementById('variationValue');
const mistakeSlider = document.getElementById('mistakeSlider');
const mistakeValue = document.getElementById('mistakeValue');
const pauseSlider = document.getElementById('pauseSlider');
const pauseValue = document.getElementById('pauseValue');
const perfectionMode = document.getElementById('perfectionMode');
const perfectionBadge = document.getElementById('perfectionBadge');
const humanizationControls = document.getElementById('humanizationControls');

// Essay action buttons
const saveEssayBtn = document.getElementById('saveEssayBtn');
const analyzeEssayBtn = document.getElementById('analyzeEssayBtn');
const loadEssayBtn = document.getElementById('loadEssayBtn');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Check if user is logged in
  const session = await getSession();

  if (session) {
    showMainScreen(session);
  } else {
    showLoginScreen();
  }
}

function showLoginScreen() {
  loading.style.display = 'none';
  loginScreen.classList.add('active');
  mainScreen.classList.remove('active');
  autotyperPanel.classList.remove('active');
}

async function showMainScreen(session) {
  loading.style.display = 'none';
  loginScreen.classList.remove('active');
  mainScreen.classList.add('active');
  autotyperPanel.classList.remove('active');

  // Display user info
  userEmail.textContent = session.user.email;

  // Get subscription tier
  const tier = await getUserTier(session.user.id);
  userTier.textContent = tier.toUpperCase();

  // Update badge color based on tier
  if (tier === 'premium') {
    userTier.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
    userTier.style.color = '#000';
  } else if (tier === 'pro') {
    userTier.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)';
    userTier.style.color = '#fff';
  } else {
    // No valid subscription
    userTier.style.background = 'rgba(239, 68, 68, 0.6)';
    userTier.style.color = '#fff';
    userTier.textContent = 'NO SUBSCRIPTION';
  }

  // Apply tier restrictions
  applyTierRestrictions(tier);
}

function applyTierRestrictions(tier) {
  // Features available by tier:
  // PRO: All core features with limits (70% humanizer, 80 WPM, 3 essays)
  // PREMIUM: All features unlimited (100% humanizer, 160 WPM, unlimited essays)

  const restrictedFeatures = {
    pro: ['detectorBtn', 'analyzeEssayBtn'],  // AI Detector & Analyzer are Premium-only
    premium: []  // Premium has access to everything
  };

  const tierLevel = tier.toLowerCase();

  // If user has no Pro/Premium subscription, show login wall
  if (tierLevel !== 'pro' && tierLevel !== 'premium') {
    showSubscriptionRequired();
    return;
  }

  const restricted = restrictedFeatures[tierLevel] || [];

  // Apply slider limits based on tier
  if (tierLevel === 'pro') {
    // Pro tier limits
    speedSlider.max = 80;
    variationSlider.max = 70;
    mistakeSlider.max = 70;
    pauseSlider.max = 70;

    // Show Perfection Mode as Premium feature
    perfectionBadge.style.display = 'inline';
    perfectionMode.disabled = true;
    perfectionMode.parentElement.style.opacity = '0.6';
    perfectionMode.parentElement.style.cursor = 'not-allowed';
    perfectionMode.parentElement.title = 'Premium feature - Upgrade to Premium';
  } else if (tierLevel === 'premium') {
    // Premium tier - full access
    speedSlider.max = 160;
    variationSlider.max = 100;
    mistakeSlider.max = 100;
    pauseSlider.max = 100;

    // Enable Perfection Mode for Premium
    perfectionBadge.style.display = 'none';
    perfectionMode.disabled = false;
    perfectionMode.parentElement.style.opacity = '1';
    perfectionMode.parentElement.style.cursor = 'pointer';
    perfectionMode.parentElement.title = '';
  }

  // Add lock icons and click handlers for Premium-only features (for Pro users)
  restricted.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      // Add premium badge to feature title
      const titleElement = btn.querySelector('.feature-title');
      if (titleElement && !titleElement.textContent.includes('⭐')) {
        titleElement.textContent += ' ⭐';
      }

      // Update description to show it's Premium-only
      const descElement = btn.querySelector('.feature-description');
      if (descElement) {
        const originalDesc = descElement.textContent;
        descElement.innerHTML = `<strong style="color: #ffd700;">Premium Feature</strong><br>${originalDesc}`;
        descElement.style.fontSize = '11px';
      }

      // Add visual indicator
      btn.style.border = '2px solid rgba(255, 215, 0, 0.3)';
      btn.style.cursor = 'pointer';

      // Remove existing event listeners by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      // Add click handler to show upgrade prompt
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showUpgradePrompt(tierLevel);
      });
    }
  });

  // Store tier in global scope for checking in autotyper
  window.userTier = tierLevel;
}

function showSubscriptionRequired() {
  // Replace main screen with subscription wall
  mainScreen.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
      <h2 style="font-size: 20px; margin-bottom: 10px;">Subscription Required</h2>
      <p style="font-size: 13px; opacity: 0.8; margin-bottom: 30px; line-height: 1.5;">
        Ovara Extension requires an active Pro or Premium subscription to use.
      </p>
      <button class="btn btn-primary" onclick="document.getElementById('upgradeBtn').click()" style="margin-bottom: 15px;">
        View Plans & Subscribe
      </button>
      <br>
      <a href="https://your-app-url.com" target="_blank" style="color: white; font-size: 12px; opacity: 0.8; text-decoration: underline;">
        Go to Web App
      </a>
    </div>
  `;
}

function showUpgradePrompt(currentTier) {
  const message = 'This feature is exclusive to Premium subscribers. Would you like to upgrade?';

  if (confirm(message)) {
    showUpgradePanel();
  }
}

function showAutotyperPanel() {
  mainScreen.classList.remove('active');
  autotyperPanel.classList.add('active');
  updateCharacterCounter();
}

// Character counter for autotyper
autotypeText.addEventListener('input', updateCharacterCounter);

async function updateCharacterCounter() {
  const length = autotypeText.value.length;
  charCount.textContent = length.toLocaleString();

  // Get user tier to show appropriate limit
  const session = await getSession();
  if (session) {
    const tier = await getUserTier(session.user.id);
    const tierLevel = tier.toLowerCase();

    let limit = 0;
    let limitText = '';

    if (tierLevel === 'pro') {
      limit = 10000;
      limitText = ' / 10,000 (Pro)';
    } else if (tierLevel === 'premium') {
      limitText = ' (Unlimited)';
    } else {
      limitText = ' (Subscription Required)';
    }

    charLimit.textContent = limitText;

    // Update styling based on limit
    characterCounter.classList.remove('warning', 'error');
    if (limit > 0) {
      if (length > limit) {
        characterCounter.classList.add('error');
      } else if (length > limit * 0.8) {
        characterCounter.classList.add('warning');
      }
    }
  }
}

function showMainFromAutotyper() {
  autotyperPanel.classList.remove('active');
  mainScreen.classList.add('active');
}

// Authentication functions
async function login(email, password) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Login failed');
    }

    const data = await response.json();
    await saveSession(data);
    return data;
  } catch (error) {
    throw error;
  }
}

async function signup(email, password) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Signup failed');
    }

    const data = await response.json();
    await saveSession(data);
    return data;
  } catch (error) {
    throw error;
  }
}

async function logout() {
  await chrome.storage.local.remove(['session']);
  showLoginScreen();
}

async function saveSession(session) {
  await chrome.storage.local.set({ session });
}

async function getSession() {
  const result = await chrome.storage.local.get(['session']);
  return result.session || null;
}

async function getUserTier(userId) {
  try {
    const session = await getSession();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_subscriptions?user_id=eq.${userId}&select=tier`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      return 'free';
    }

    const data = await response.json();
    return data[0]?.tier?.toLowerCase() || 'free';
  } catch (error) {
    console.error('Error getting tier:', error);
    return 'free';
  }
}

// Event listeners
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Please enter email and password');
    return;
  }

  loginBtn.textContent = 'Signing in...';
  loginBtn.disabled = true;

  try {
    const session = await login(email, password);
    showMainScreen(session);
  } catch (error) {
    showError(error.message);
  } finally {
    loginBtn.textContent = 'Sign In';
    loginBtn.disabled = false;
  }
});

signupBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Please enter email and password');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters');
    return;
  }

  signupBtn.textContent = 'Creating account...';
  signupBtn.disabled = true;

  try {
    const session = await signup(email, password);
    showMainScreen(session);
  } catch (error) {
    showError(error.message);
  } finally {
    signupBtn.textContent = 'Create Account';
    signupBtn.disabled = false;
  }
});

// Allow Enter key to submit
passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loginBtn.click();
  }
});

logoutBtn.addEventListener('click', logout);

// Feature buttons
autotyperBtn.addEventListener('click', () => {
  showAutotyperPanel();
});

humanizerBtn.addEventListener('click', () => {
  window.open('https://your-app-url.com/humanizer', '_blank');
});

citationBtn.addEventListener('click', () => {
  window.open('https://your-app-url.com/citation', '_blank');
});

detectorBtn.addEventListener('click', () => {
  window.open('https://your-app-url.com/detector', '_blank');
});

// Grammar Check Toggle
let grammarEnabled = false;
grammarBtn.addEventListener('click', async () => {
  grammarEnabled = !grammarEnabled;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {
    action: 'toggleGrammar',
    enabled: grammarEnabled
  });

  grammarBtn.style.background = grammarEnabled
    ? 'rgba(16, 185, 129, 0.3)'
    : 'rgba(255, 255, 255, 0.15)';

  grammarBtn.querySelector('.feature-description').textContent = grammarEnabled
    ? 'Grammar check is ACTIVE ✓'
    : 'Real-time grammar checking like Grammarly';

  showNotification(grammarEnabled ? 'Grammar check enabled!' : 'Grammar check disabled');
});

// Ovara Assistant Toggle
const assistantBtn = document.getElementById('assistantBtn');
let assistantEnabled = false;
assistantBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Send message to toggle assistant
  chrome.tabs.sendMessage(tab.id, {
    action: 'toggleAssistant'
  });

  assistantEnabled = !assistantEnabled;

  assistantBtn.style.background = assistantEnabled
    ? 'rgba(102, 126, 234, 0.3)'
    : 'rgba(255, 255, 255, 0.05)';

  assistantBtn.querySelector('.feature-description').textContent = assistantEnabled
    ? 'Ovara Assistant is ACTIVE ✓'
    : 'AI co-pilot that sits beside you on any webpage';

  showNotification('Press Ctrl+Space to toggle Ovara Assistant');
});

// AI Coach Toggle
let coachEnabled = false;
coachBtn.addEventListener('click', async () => {
  coachEnabled = !coachEnabled;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {
    action: 'toggleCoach',
    enabled: coachEnabled
  });

  coachBtn.style.background = coachEnabled
    ? 'rgba(102, 126, 234, 0.3)'
    : 'rgba(255, 255, 255, 0.15)';

  coachBtn.querySelector('.feature-description').textContent = coachEnabled
    ? 'AI Coach is ACTIVE ✓'
    : 'Get AI assistance while you write with sidebar';

  showNotification(coachEnabled ? 'AI Coach enabled!' : 'AI Coach disabled');
});

// Save Essay
saveEssayBtn.addEventListener('click', async () => {
  const text = autotypeText.value.trim();

  if (!text) {
    alert('Please enter some text to save');
    return;
  }

  // Check tier restrictions for essay count
  const session = await getSession();
  const tier = await getUserTier(session.user.id);
  const tierLevel = tier.toLowerCase();

  // Count existing essays
  const response = await fetch(`${SUPABASE_URL}/rest/v1/saved_essays?user_id=eq.${session.user.id}&select=id`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`
    }
  });

  const essays = await response.json();

  // Pro tier: 3 essays max
  if (tierLevel === 'pro' && essays.length >= 3) {
    alert('Pro tier is limited to 3 saved essays. Upgrade to Premium for unlimited storage!\n\nCurrent essays: ' + essays.length);
    if (confirm('Would you like to upgrade to Premium now?')) {
      showUpgradePanel();
    }
    return;
  }

  // Prompt for essay title
  const title = prompt('Enter a title for your essay:', 'My Essay');
  if (!title) return;

  // Save to Supabase
  saveEssayBtn.textContent = 'Saving...';
  saveEssayBtn.disabled = true;

  try {
    const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/saved_essays`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: session.user.id,
        title: title,
        content: text,
        word_count: text.split(/\s+/).length
      })
    });

    if (!saveResponse.ok) {
      throw new Error('Failed to save essay');
    }

    showNotification('Essay saved successfully!');
    saveEssayBtn.textContent = '💾 Save Essay';
    saveEssayBtn.disabled = false;
  } catch (error) {
    console.error('Error saving essay:', error);
    alert('Failed to save essay. Please try again.');
    saveEssayBtn.textContent = '💾 Save Essay';
    saveEssayBtn.disabled = false;
  }
});

// Load Saved Essay
loadEssayBtn.addEventListener('click', () => {
  showSavedEssaysPanel();
});

// Analyze Essay (Premium only)
analyzeEssayBtn.addEventListener('click', async () => {
  const session = await getSession();
  const tier = await getUserTier(session.user.id);
  const tierLevel = tier.toLowerCase();

  if (tierLevel !== 'premium') {
    showUpgradePrompt(tierLevel);
    return;
  }

  const text = autotypeText.value.trim();

  if (!text) {
    alert('Please enter some text to analyze');
    return;
  }

  // Show analyzer panel (to be created)
  showEssayAnalyzerPanel(text);
});

// Saved Essays
savedEssaysBtn.addEventListener('click', () => {
  showSavedEssaysPanel();
});

// Community
communityBtn.addEventListener('click', () => {
  showCommunityPanel();
});

// Settings
const settingsBtn = document.getElementById('settingsBtn');
settingsBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

// Upgrade
upgradeBtn.addEventListener('click', () => {
  showUpgradePanel();
});

backBtn.addEventListener('click', showMainFromAutotyper);

// Saved Essays Panel Elements
const savedEssaysPanel = document.getElementById('savedEssaysPanel');
const essaysBackBtn = document.getElementById('essaysBackBtn');
const essaysList = document.getElementById('essaysList');

// Community Panel Elements
const communityPanel = document.getElementById('communityPanel');
const communityBackBtn = document.getElementById('communityBackBtn');
const joinDiscordBtn = document.getElementById('joinDiscordBtn');

// Upgrade Panel Elements
const upgradePanel = document.getElementById('upgradePanel');
const upgradeBackBtn = document.getElementById('upgradeBackBtn');

// Analyzer Panel Elements
const analyzerPanel = document.getElementById('analyzerPanel');
const analyzerBackBtn = document.getElementById('analyzerBackBtn');
const analyzerLoading = document.getElementById('analyzerLoading');
const analyzerResults = document.getElementById('analyzerResults');

essaysBackBtn.addEventListener('click', () => {
  savedEssaysPanel.classList.remove('active');
  mainScreen.classList.add('active');
});

communityBackBtn.addEventListener('click', () => {
  communityPanel.classList.remove('active');
  mainScreen.classList.add('active');
});

upgradeBackBtn.addEventListener('click', () => {
  upgradePanel.classList.remove('active');
  mainScreen.classList.add('active');
});

analyzerBackBtn.addEventListener('click', () => {
  analyzerPanel.classList.remove('active');
  autotyperPanel.classList.add('active');
});

function showSavedEssaysPanel() {
  mainScreen.classList.remove('active');
  autotyperPanel.classList.remove('active');
  communityPanel.classList.remove('active');
  upgradePanel.classList.remove('active');
  savedEssaysPanel.classList.add('active');
  loadSavedEssays();
}

function showCommunityPanel() {
  mainScreen.classList.remove('active');
  autotyperPanel.classList.remove('active');
  savedEssaysPanel.classList.remove('active');
  upgradePanel.classList.remove('active');
  communityPanel.classList.add('active');
}

function showUpgradePanel() {
  mainScreen.classList.remove('active');
  autotyperPanel.classList.remove('active');
  savedEssaysPanel.classList.remove('active');
  communityPanel.classList.remove('active');
  analyzerPanel.classList.remove('active');
  upgradePanel.classList.add('active');
}

async function showEssayAnalyzerPanel(text) {
  autotyperPanel.classList.remove('active');
  analyzerPanel.classList.add('active');

  // Show loading state
  analyzerLoading.style.display = 'block';
  analyzerResults.style.display = 'none';

  // Simulate analysis (replace with real API call later)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Calculate mock scores based on text
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const paragraphs = text.split(/\n\n+/).length;

  // Mock scoring algorithm
  const structureScore = Math.min(100, Math.max(50, 60 + (paragraphs > 3 ? 20 : 0) + (sentences > 5 ? 10 : 0)));
  const grammarScore = Math.min(100, Math.max(60, 70 + Math.random() * 25));
  const readabilityScore = Math.min(100, Math.max(55, words > 100 ? 75 : 65 + Math.random() * 20));
  const coherenceScore = Math.min(100, Math.max(60, 70 + Math.random() * 25));

  const overallScore = Math.round((structureScore + grammarScore + readabilityScore + coherenceScore) / 4);

  // Hide loading, show results
  analyzerLoading.style.display = 'none';
  analyzerResults.style.display = 'block';

  // Animate overall score circle
  const scoreCircle = document.getElementById('scoreCircle');
  const scoreNumber = document.getElementById('overallScore');
  const circumference = 314;
  const offset = circumference - (overallScore / 100) * circumference;

  scoreCircle.style.strokeDashoffset = offset;
  let currentScore = 0;
  const scoreInterval = setInterval(() => {
    currentScore++;
    scoreNumber.textContent = currentScore;
    if (currentScore >= overallScore) clearInterval(scoreInterval);
  }, 20);

  // Update category scores
  updateCategoryScore('structure', structureScore);
  updateCategoryScore('grammar', grammarScore);
  updateCategoryScore('readability', readabilityScore);
  updateCategoryScore('coherence', coherenceScore);

  // Generate suggestions
  const suggestions = [];

  if (structureScore < 80) {
    suggestions.push('Consider adding a clear thesis statement in your introduction.');
    suggestions.push('Organize your paragraphs with topic sentences.');
  }

  if (grammarScore < 85) {
    suggestions.push('Review for subject-verb agreement and verb tense consistency.');
  }

  if (readabilityScore < 75) {
    suggestions.push('Vary your sentence length to improve readability.');
    suggestions.push('Use transition words to connect ideas smoothly.');
  }

  if (coherenceScore < 80) {
    suggestions.push('Ensure each paragraph relates back to your main argument.');
  }

  if (words < 300) {
    suggestions.push('Consider expanding your essay with more detailed examples and analysis.');
  }

  // Display suggestions
  const suggestionsList = document.getElementById('suggestionsList');
  suggestionsList.innerHTML = suggestions.map(s =>
    `<div class="suggestion-item">${s}</div>`
  ).join('');
}

function updateCategoryScore(category, score) {
  const bar = document.getElementById(`${category}Bar`);
  const value = document.getElementById(`${category}Score`);

  setTimeout(() => {
    bar.style.width = `${score}%`;
    value.textContent = `${Math.round(score)}%`;
  }, 300);
}

async function loadSavedEssays() {
  try {
    const session = await getSession();
    if (!session) {
      essaysList.innerHTML = '<div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.7);">Please login to view saved essays</div>';
      return;
    }

    // Fetch saved essays from Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/saved_essays?user_id=eq.${session.user.id}&order=created_at.desc&limit=50`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load essays');
    }

    const essays = await response.json();

    if (essays.length === 0) {
      essaysList.innerHTML = '<div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.7);">No saved essays yet</div>';
      return;
    }

    // Display essays
    essaysList.innerHTML = essays.map(essay => {
      const preview = essay.content.substring(0, 100);
      const date = new Date(essay.created_at).toLocaleDateString();
      const words = essay.content.split(/\s+/).length;

      return `
        <div class="essay-item" data-content="${essay.content.replace(/"/g, '&quot;')}">
          <div class="essay-title">${essay.title || 'Untitled Essay'}</div>
          <div class="essay-meta">
            <span>${date}</span>
            <span>${words} words</span>
          </div>
          <div class="essay-preview">${preview}...</div>
        </div>
      `;
    }).join('');

    // Add click listeners to essays
    document.querySelectorAll('.essay-item').forEach(item => {
      item.addEventListener('click', () => {
        const content = item.getAttribute('data-content').replace(/&quot;/g, '"');
        autotypeText.value = content;
        savedEssaysPanel.classList.remove('active');
        autotyperPanel.classList.add('active');
        showNotification('Essay loaded into auto-typer!');
      });
    });
  } catch (error) {
    console.error('Error loading essays:', error);
    essaysList.innerHTML = '<div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.7);">Error loading essays</div>';
  }
}

// Speed slider
speedSlider.addEventListener('input', (e) => {
  speedValue.textContent = `${e.target.value} WPM`;
});

// Humanization sliders
variationSlider.addEventListener('input', (e) => {
  variationValue.textContent = `${e.target.value}%`;
});

mistakeSlider.addEventListener('input', (e) => {
  mistakeValue.textContent = `${e.target.value}%`;
});

pauseSlider.addEventListener('input', (e) => {
  pauseValue.textContent = `${e.target.value}%`;
});

// Perfection Mode toggle
perfectionMode.addEventListener('change', (e) => {
  if (e.target.checked) {
    // Disable humanization controls and set to perfect
    humanizationControls.classList.add('disabled');
    mistakeSlider.value = 0;
    mistakeValue.textContent = '0%';
    variationSlider.value = 0;
    variationValue.textContent = '0%';
    pauseSlider.value = 0;
    pauseValue.textContent = '0%';
  } else {
    // Re-enable humanization controls
    humanizationControls.classList.remove('disabled');
    mistakeSlider.value = 5;
    mistakeValue.textContent = '5%';
    variationSlider.value = 30;
    variationValue.textContent = '30%';
    pauseSlider.value = 15;
    pauseValue.textContent = '15%';
  }
});

// Autotyper
startAutotypeBtn.addEventListener('click', async () => {
  const text = autotypeText.value.trim();

  if (!text) {
    alert('Please enter text to auto-type');
    return;
  }

  // Check tier restrictions
  const session = await getSession();
  const tier = await getUserTier(session.user.id);
  const tierLevel = tier.toLowerCase();

  // Only Pro and Premium have access
  if (tierLevel !== 'pro' && tierLevel !== 'premium') {
    alert('This feature requires a Pro or Premium subscription.');
    showUpgradePanel();
    return;
  }

  // Pro tier limits: 10000 characters max
  if (tierLevel === 'pro' && text.length > 10000) {
    alert('Pro tier is limited to 10,000 characters. Upgrade to Premium for unlimited auto-typing!\n\nCurrent text length: ' + text.length + ' characters');
    if (confirm('Would you like to upgrade to Premium now?')) {
      showUpgradePanel();
    }
    return;
  }

  const wpm = parseInt(speedSlider.value);

  // Collect humanization settings
  const settings = {
    speedVariation: parseInt(variationSlider.value),
    mistakeChance: parseInt(mistakeSlider.value),
    pauseChance: parseInt(pauseSlider.value)
  };

  // Show countdown before starting
  startAutotypeBtn.disabled = true;
  let countdown = 3;
  const originalText = startAutotypeBtn.textContent;
  startAutotypeBtn.textContent = `Starting in ${countdown}...`;

  const countdownInterval = setInterval(()=> {
    countdown--;
    if (countdown > 0) {
      startAutotypeBtn.textContent = `Starting in ${countdown}...`;
    } else {
      clearInterval(countdownInterval);
      startAutotypeBtn.textContent = originalText;

      // Send message to content script to start autotyping
      chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'startAutotype',
          text: text,
          wpm: wpm,
          settings: settings
        });
      });

      // Update UI
      startAutotypeBtn.style.display = 'none';
      pauseAutotypeBtn.style.display = 'block';
      stopAutotypeBtn.style.display = 'block';
      autotypeText.disabled = true;
      speedSlider.disabled = true;
      variationSlider.disabled = true;
      mistakeSlider.disabled = true;
      pauseSlider.disabled = true;
      startAutotypeBtn.disabled = false;

      // Show notification
      showNotification('Auto-typer active! Click any text field to start typing.');
    }
  }, 1000);
});

pauseAutotypeBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (pauseAutotypeBtn.textContent === 'Pause') {
    chrome.tabs.sendMessage(tab.id, { action: 'pauseAutotype' });
    pauseAutotypeBtn.textContent = 'Resume';
    showNotification('Auto-typer paused');
  } else {
    chrome.tabs.sendMessage(tab.id, { action: 'resumeAutotype' });
    pauseAutotypeBtn.textContent = 'Pause';
    showNotification('Auto-typer resumed');
  }
});

stopAutotypeBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, {
    action: 'stopAutotype'
  });

  // Reset UI
  startAutotypeBtn.style.display = 'block';
  pauseAutotypeBtn.style.display = 'none';
  stopAutotypeBtn.style.display = 'none';
  pauseAutotypeBtn.textContent = 'Pause';
  autotypeText.disabled = false;
  speedSlider.disabled = false;
  variationSlider.disabled = false;
  mistakeSlider.disabled = false;
  pauseSlider.disabled = false;
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autotypeComplete') {
    // Reset UI when autotyping is complete
    startAutotypeBtn.style.display = 'block';
    pauseAutotypeBtn.style.display = 'none';
    stopAutotypeBtn.style.display = 'none';
    pauseAutotypeBtn.textContent = 'Pause';
    autotypeText.disabled = false;
    speedSlider.disabled = false;
    variationSlider.disabled = false;
    mistakeSlider.disabled = false;
    pauseSlider.disabled = false;
    showNotification('Auto-typing complete!');
  } else if (request.action === 'autotypeStopped') {
    // Reset UI when autotyping is stopped
    startAutotypeBtn.style.display = 'block';
    pauseAutotypeBtn.style.display = 'none';
    stopAutotypeBtn.style.display = 'none';
    pauseAutotypeBtn.textContent = 'Pause';
    autotypeText.disabled = false;
    speedSlider.disabled = false;
    variationSlider.disabled = false;
    mistakeSlider.disabled = false;
    pauseSlider.disabled = false;
  } else if (request.action === 'autotypePaused') {
    pauseAutotypeBtn.textContent = 'Resume';
  } else if (request.action === 'autotypeResumed') {
    pauseAutotypeBtn.textContent = 'Pause';
  }
});

// Helper functions
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('active');
  setTimeout(() => {
    errorMessage.classList.remove('active');
  }, 5000);
}

function showNotification(message) {
  // You can implement a custom notification here
  // For now, we'll just use the browser's notification API
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Ovara',
    message: message
  });
}

// Community Panel - Discord button
joinDiscordBtn.addEventListener('click', () => {
  window.open('https://discord.gg/ovara', '_blank');
  showNotification('Opening Discord server...');
});

// Upgrade Panel - Plan buttons
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('upgrade-plan-btn')) {
    const tier = e.target.getAttribute('data-tier');
    window.open(`https://your-app-url.com/upgrade?plan=${tier}`, '_blank');
    showNotification(`Redirecting to ${tier.toUpperCase()} upgrade page...`);
  }
});
