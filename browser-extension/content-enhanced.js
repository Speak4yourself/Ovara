// APPEND THIS TO content.js - Enhanced features for Google Docs, Grammar Check, and AI Coach

// ====================================
// ENHANCED GOOGLE DOCS SUPPORT
// ====================================

function typeTextEnhanced() {
  if (!autotypeState.targetElement || !autotypeState.active) {
    stopAutotype();
    return;
  }

  const element = autotypeState.targetElement;
  const text = autotypeState.text;
  const wpm = autotypeState.wpm;
  const delayMs = 60000 / (wpm * 5);

  const randomDelay = () => {
    const variation = delayMs * 0.2;
    return delayMs + (Math.random() * variation * 2 - variation);
  };

  let currentIndex = 0;

  const typeInterval = setInterval(() => {
    if (currentIndex >= text.length || !autotypeState.active) {
      clearInterval(typeInterval);
      autotypeState.intervalId = null;

      if (currentIndex >= text.length) {
        chrome.runtime.sendMessage({ action: 'autotypeComplete' });
        stopAutotype();
      }
      return;
    }

    const char = text[currentIndex];

    // ENHANCED: Detect Google Docs
    const isGoogleDocs = window.location.hostname.includes('docs.google.com');

    if (isGoogleDocs) {
      // Special handling for Google Docs
      typeInGoogleDocs(char);
    } else if (element.isContentEditable) {
      // For contentEditable elements
      typeInContentEditable(element, char);
    } else {
      // For regular inputs and textareas
      typeInRegularInput(element, char);
    }

    currentIndex++;
  }, randomDelay());

  autotypeState.intervalId = typeInterval;
}

// Type in Google Docs (special method)
function typeInGoogleDocs(char) {
  // Google Docs requires keyboard events
  const keyboardEvent = new KeyboardEvent('keydown', {
    key: char,
    char: char,
    keyCode: char.charCodeAt(0),
    which: char.charCodeAt(0),
    bubbles: true,
    cancelable: true
  });

  document.activeElement.dispatchEvent(keyboardEvent);

  // Also dispatch input event
  const inputEvent = new InputEvent('input', {
    data: char,
    inputType: 'insertText',
    bubbles: true,
    cancelable: true
  });

  document.activeElement.dispatchEvent(inputEvent);

  // Dispatch keyup
  const keyupEvent = new KeyboardEvent('keyup', {
    key: char,
    char: char,
    keyCode: char.charCodeAt(0),
    which: char.charCodeAt(0),
    bubbles: true,
    cancelable: true
  });

  document.activeElement.dispatchEvent(keyupEvent);
}

// Type in contentEditable
function typeInContentEditable(element, char) {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);

  const textNode = document.createTextNode(char);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);

  // Trigger input event
  element.dispatchEvent(new InputEvent('input', {
    data: char,
    inputType: 'insertText',
    bubbles: true
  }));
}

// Type in regular input
function typeInRegularInput(element, char) {
  const start = element.selectionStart || 0;
  const end = element.selectionEnd || 0;
  const currentValue = element.value || '';

  element.value = currentValue.substring(0, start) + char + currentValue.substring(end);
  element.selectionStart = element.selectionEnd = start + 1;

  // Trigger input event
  element.dispatchEvent(new InputEvent('input', {
    data: char,
    inputType: 'insertText',
    bubbles: true
  }));
}

// ====================================
// GRAMMAR CHECKER (Like Grammarly)
// ====================================

function toggleGrammarCheck(enabled) {
  grammarState.enabled = enabled;

  if (enabled) {
    startGrammarChecker();
  } else {
    stopGrammarChecker();
  }
}

function startGrammarChecker() {
  // Add listeners to all text inputs
  document.addEventListener('input', handleGrammarInput, true);
  document.addEventListener('focus', handleGrammarFocus, true);

  showGrammarIndicator();
}

function stopGrammarChecker() {
  document.removeEventListener('input', handleGrammarInput, true);
  document.removeEventListener('focus', handleGrammarFocus, true);

  hideGrammarIndicator();
  removeAllGrammarUnderlines();
}

function handleGrammarInput(event) {
  if (!grammarState.enabled) return;

  const element = event.target;
  const isTextInput =
    (element.tagName === 'INPUT' && ['text', 'email', 'search', 'url'].includes(element.type)) ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable;

  if (!isTextInput) return;

  grammarState.activeElement = element;

  // Debounce grammar checking (wait 1 second after typing stops)
  clearTimeout(grammarState.checkTimeout);
  grammarState.checkTimeout = setTimeout(() => {
    checkGrammarNow(getElementText(element));
  }, 1000);
}

function handleGrammarFocus(event) {
  if (!grammarState.enabled) return;

  const element = event.target;
  const isTextInput =
    (element.tagName === 'INPUT' && ['text', 'email', 'search', 'url'].includes(element.type)) ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable;

  if (!isTextInput) return;

  grammarState.activeElement = element;
}

async function checkGrammarNow(text) {
  if (!text || text.trim().length < 10) return;

  try {
    // Get session from storage
    const result = await chrome.storage.local.get(['session']);
    if (!result.session) return;

    // Call your API to check grammar
    chrome.runtime.sendMessage({
      action: 'checkGrammarAPI',
      text: text,
      session: result.session
    }, (response) => {
      if (response && response.suggestions) {
        grammarState.suggestions = response.suggestions;
        displayGrammarSuggestions(response.suggestions);
      }
    });
  } catch (error) {
    console.error('Grammar check error:', error);
  }
}

function displayGrammarSuggestions(suggestions) {
  removeAllGrammarUnderlines();

  if (!grammarState.activeElement) return;

  suggestions.forEach(suggestion => {
    addGrammarUnderline(suggestion);
  });
}

function addGrammarUnderline(suggestion) {
  // For contentEditable, add underline span
  if (grammarState.activeElement.isContentEditable) {
    const range = findTextRange(grammarState.activeElement, suggestion.text);
    if (!range) return;

    const span = document.createElement('span');
    span.className = 'ovara-grammar-error';
    span.setAttribute('data-suggestion', suggestion.corrected);
    span.setAttribute('data-explanation', suggestion.explanation);

    span.style.borderBottom = '2px dotted #ef4444';
    span.style.cursor = 'pointer';

    span.addEventListener('click', () => {
      showGrammarPopup(span, suggestion);
    });

    try {
      range.surroundContents(span);
    } catch (e) {
      // If surroundContents fails, just add the underline inline
      console.log('Could not add underline:', e);
    }
  }
}

function findTextRange(element, text) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    const index = node.textContent.indexOf(text);
    if (index !== -1) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + text.length);
      return range;
    }
  }
  return null;
}

function showGrammarPopup(element, suggestion) {
  // Remove existing popup
  const existing = document.getElementById('ovara-grammar-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'ovara-grammar-popup';
  popup.innerHTML = `
    <div class="ovara-grammar-header">
      <span class="ovara-grammar-icon">✏️</span>
      <span class="ovara-grammar-title">Grammar Suggestion</span>
    </div>
    <div class="ovara-grammar-body">
      <div class="ovara-grammar-original">${suggestion.text}</div>
      <div class="ovara-grammar-arrow">↓</div>
      <div class="ovara-grammar-corrected">${suggestion.corrected}</div>
      <div class="ovara-grammar-explanation">${suggestion.explanation}</div>
    </div>
    <div class="ovara-grammar-actions">
      <button class="ovara-grammar-btn ovara-grammar-accept">Accept</button>
      <button class="ovara-grammar-btn ovara-grammar-ignore">Ignore</button>
    </div>
  `;

  document.body.appendChild(popup);

  // Position popup near the underlined text
  const rect = element.getBoundingClientRect();
  popup.style.position = 'fixed';
  popup.style.left = rect.left + 'px';
  popup.style.top = (rect.bottom + 10) + 'px';

  // Accept button
  popup.querySelector('.ovara-grammar-accept').addEventListener('click', () => {
    // Replace text
    element.textContent = suggestion.corrected;
    element.classList.remove('ovara-grammar-error');
    popup.remove();
  });

  // Ignore button
  popup.querySelector('.ovara-grammar-ignore').addEventListener('click', () => {
    element.classList.remove('ovara-grammar-error');
    popup.remove();
  });

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function closePopup(e) {
      if (!popup.contains(e.target) && e.target !== element) {
        popup.remove();
        document.removeEventListener('click', closePopup);
      }
    });
  }, 100);
}

function removeAllGrammarUnderlines() {
  document.querySelectorAll('.ovara-grammar-error').forEach(el => {
    const text = el.textContent;
    el.replaceWith(text);
  });
}

function showGrammarIndicator() {
  if (document.getElementById('ovara-grammar-indicator')) return;

  const indicator = document.createElement('div');
  indicator.id = 'ovara-grammar-indicator';
  indicator.innerHTML = `
    <div class="ovara-indicator-icon">✓</div>
    <div class="ovara-indicator-text">Grammar Check Active</div>
  `;

  document.body.appendChild(indicator);
}

function hideGrammarIndicator() {
  const indicator = document.getElementById('ovara-grammar-indicator');
  if (indicator) indicator.remove();
}

function getElementText(element) {
  if (element.isContentEditable) {
    return element.textContent || element.innerText || '';
  } else {
    return element.value || '';
  }
}

// ====================================
// AI WRITING COACH (Sidebar)
// ====================================

function toggleAICoach(enabled) {
  coachState.visible = enabled;

  if (enabled) {
    showAICoachSidebar();
    startCoachMonitoring();
  } else {
    hideAICoachSidebar();
    stopCoachMonitoring();
  }
}

function showAICoachSidebar() {
  if (document.getElementById('ovara-coach-sidebar')) return;

  const sidebar = document.createElement('div');
  sidebar.id = 'ovara-coach-sidebar';
  sidebar.innerHTML = `
    <div class="ovara-coach-header">
      <div class="ovara-coach-title">
        <span class="ovara-coach-icon">🤖</span>
        <span>AI Writing Coach</span>
      </div>
      <button class="ovara-coach-close" id="ovaraCoachClose">×</button>
    </div>

    <div class="ovara-coach-body">
      <div class="ovara-coach-section">
        <h3>📊 Writing Stats</h3>
        <div id="ovaraCoachStats">
          <div class="stat-item">
            <span class="stat-label">Words:</span>
            <span class="stat-value" id="statWords">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Characters:</span>
            <span class="stat-value" id="statChars">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Readability:</span>
            <span class="stat-value" id="statReadability">-</span>
          </div>
        </div>
      </div>

      <div class="ovara-coach-section">
        <h3>💡 Suggestions</h3>
        <div id="ovaraCoachSuggestions">
          <div class="coach-suggestion">Start typing to get AI suggestions...</div>
        </div>
      </div>

      <div class="ovara-coach-section">
        <h3>🎯 Quick Actions</h3>
        <div class="coach-actions">
          <button class="coach-action-btn" id="coachImprove">Improve This</button>
          <button class="coach-action-btn" id="coachExpand">Expand Ideas</button>
          <button class="coach-action-btn" id="coachSummarize">Summarize</button>
        </div>
      </div>

      <div class="ovara-coach-section">
        <h3>✍️ Writing Tips</h3>
        <div id="ovaraCoachTips">
          <div class="coach-tip">💬 Vary your sentence structure</div>
          <div class="coach-tip">📝 Use active voice</div>
          <div class="coach-tip">✨ Be specific and concise</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(sidebar);

  // Add event listeners
  document.getElementById('ovaraCoachClose').addEventListener('click', () => {
    toggleAICoach(false);
  });

  document.getElementById('coachImprove').addEventListener('click', () => {
    handleCoachAction('improve');
  });

  document.getElementById('coachExpand').addEventListener('click', () => {
    handleCoachAction('expand');
  });

  document.getElementById('coachSummarize').addEventListener('click', () => {
    handleCoachAction('summarize');
  });
}

function hideAICoachSidebar() {
  const sidebar = document.getElementById('ovara-coach-sidebar');
  if (sidebar) sidebar.remove();
}

function startCoachMonitoring() {
  document.addEventListener('input', handleCoachInput, true);
  document.addEventListener('focus', handleCoachFocus, true);
}

function stopCoachMonitoring() {
  document.removeEventListener('input', handleCoachInput, true);
  document.removeEventListener('focus', handleCoachFocus, true);
}

let coachUpdateTimeout;

function handleCoachInput(event) {
  if (!coachState.visible) return;

  const element = event.target;
  const isTextInput =
    (element.tagName === 'INPUT' && ['text', 'email', 'search', 'url'].includes(element.type)) ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable;

  if (!isTextInput) return;

  const text = getElementText(element);
  coachState.context = text;

  // Update stats immediately
  updateCoachStats(text);

  // Debounce AI suggestions
  clearTimeout(coachUpdateTimeout);
  coachUpdateTimeout = setTimeout(() => {
    getAISuggestions(text);
  }, 2000);
}

function handleCoachFocus(event) {
  if (!coachState.visible) return;

  const element = event.target;
  const isTextInput =
    (element.tagName === 'INPUT' && ['text', 'email', 'search', 'url'].includes(element.type)) ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable;

  if (!isTextInput) return;

  const text = getElementText(element);
  coachState.context = text;
  updateCoachStats(text);
}

function updateCoachStats(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const chars = text.length;
  const readability = calculateReadability(text);

  document.getElementById('statWords').textContent = words;
  document.getElementById('statChars').textContent = chars;
  document.getElementById('statReadability').textContent = readability;
}

function calculateReadability(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  if (sentences === 0) return '-';

  const avgWordsPerSentence = words / sentences;

  if (avgWordsPerSentence < 15) return 'Easy';
  if (avgWordsPerSentence < 20) return 'Medium';
  return 'Complex';
}

async function getAISuggestions(text) {
  if (!text || text.trim().length < 20) {
    updateCoachSuggestions([{ text: 'Keep writing to get AI suggestions...' }]);
    return;
  }

  try {
    // Get session
    const result = await chrome.storage.local.get(['session']);
    if (!result.session) return;

    // Call your API for AI suggestions
    chrome.runtime.sendMessage({
      action: 'getCoachSuggestions',
      text: text,
      session: result.session
    }, (response) => {
      if (response && response.suggestions) {
        updateCoachSuggestions(response.suggestions);
      }
    });
  } catch (error) {
    console.error('Coach suggestions error:', error);
  }
}

function updateCoachSuggestions(suggestions) {
  const container = document.getElementById('ovaraCoachSuggestions');
  if (!container) return;

  container.innerHTML = suggestions.map(s => `
    <div class="coach-suggestion">
      <div class="suggestion-icon">${s.icon || '💡'}</div>
      <div class="suggestion-text">${s.text}</div>
    </div>
  `).join('');
}

function handleCoachAction(action) {
  const text = coachState.context;

  if (!text || text.trim().length < 10) {
    alert('Please write some text first!');
    return;
  }

  // Show loading
  const suggestionsContainer = document.getElementById('ovaraCoachSuggestions');
  suggestionsContainer.innerHTML = '<div class="coach-loading">Thinking... 🤔</div>';

  // Call API
  chrome.runtime.sendMessage({
    action: 'coachAction',
    actionType: action,
    text: text
  }, (response) => {
    if (response && response.result) {
      showCoachActionResult(action, response.result);
    }
  });
}

function showCoachActionResult(action, result) {
  const suggestionsContainer = document.getElementById('ovaraCoachSuggestions');

  let title = '';
  if (action === 'improve') title = '✨ Improved Version';
  if (action === 'expand') title = '📝 Expanded Ideas';
  if (action === 'summarize') title = '📊 Summary';

  suggestionsContainer.innerHTML = `
    <div class="coach-result">
      <div class="result-title">${title}</div>
      <div class="result-text">${result}</div>
      <button class="result-copy" onclick="navigator.clipboard.writeText('${result.replace(/'/g, "\\'")}'); this.textContent='Copied!'">Copy</button>
    </div>
  `;
}

// Helper to get active text element
function getActiveTextElement() {
  const active = document.activeElement;

  const isTextInput =
    (active.tagName === 'INPUT' && ['text', 'email', 'search', 'url'].includes(active.type)) ||
    active.tagName === 'TEXTAREA' ||
    active.isContentEditable;

  return isTextInput ? active : null;
}

// Initialize
console.log('Ovara Enhanced Features Loaded: Grammar Check + AI Coach');
