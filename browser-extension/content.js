// Ovara Browser Extension - Content Script
// Handles auto-typing, grammar checking, and AI writing coach

let autotypeState = {
  active: false,
  paused: false,
  text: '',
  wpm: 50,
  currentIndex: 0,
  targetElement: null,
  intervalId: null,
  startTime: 0,
  // Humanization settings
  speedVariation: 30, // % variation in typing speed
  mistakeChance: 5, // % chance of making a mistake
  pauseChance: 15, // % chance of taking a break
  minPauseMs: 500, // Minimum pause duration
  maxPauseMs: 2000, // Maximum pause duration
  thinkingPauseChance: 10, // % chance of "thinking" pause (longer)
  minThinkingMs: 1000,
  maxThinkingMs: 4000
};

let grammarState = {
  enabled: false,
  activeElement: null,
  checkTimeout: null,
  suggestions: []
};

let coachState = {
  visible: false,
  context: '',
  suggestions: []
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startAutotype') {
    startAutotype(request.text, request.wpm, request.settings);
    sendResponse({ success: true });
  } else if (request.action === 'stopAutotype') {
    stopAutotype();
    sendResponse({ success: true });
  } else if (request.action === 'pauseAutotype') {
    pauseAutotype();
    sendResponse({ success: true });
  } else if (request.action === 'resumeAutotype') {
    resumeAutotype();
    sendResponse({ success: true });
  } else if (request.action === 'toggleGrammar') {
    toggleGrammarCheck(request.enabled);
    sendResponse({ success: true });
  } else if (request.action === 'toggleCoach') {
    toggleAICoach(request.enabled);
    sendResponse({ success: true });
  } else if (request.action === 'checkGrammar') {
    checkGrammarNow(request.text);
    sendResponse({ success: true });
  }
  return true; // Required for async responses
});

function startAutotype(text, wpm, settings = {}) {
  autotypeState.text = text;
  autotypeState.wpm = wpm;
  autotypeState.active = true;
  autotypeState.paused = false;
  autotypeState.currentIndex = 0;
  autotypeState.startTime = Date.now();

  // Apply humanization settings
  if (settings.speedVariation !== undefined) autotypeState.speedVariation = settings.speedVariation;
  if (settings.mistakeChance !== undefined) autotypeState.mistakeChance = settings.mistakeChance;
  if (settings.pauseChance !== undefined) autotypeState.pauseChance = settings.pauseChance;
  if (settings.minPauseMs !== undefined) autotypeState.minPauseMs = settings.minPauseMs;
  if (settings.maxPauseMs !== undefined) autotypeState.maxPauseMs = settings.maxPauseMs;

  // Add click listener to all text inputs - no overlay, direct interaction
  document.addEventListener('click', handleTextFieldClick, true);
}

function stopAutotype() {
  autotypeState.active = false;
  autotypeState.paused = false;

  if (autotypeState.intervalId) {
    clearTimeout(autotypeState.intervalId);
    autotypeState.intervalId = null;
  }

  hideAutotypeOverlay();
  hideTypingProgress();
  document.removeEventListener('click', handleTextFieldClick, true);

  // Notify popup
  chrome.runtime.sendMessage({ action: 'autotypeStopped' });
}

function pauseAutotype() {
  if (!autotypeState.active) return;
  autotypeState.paused = true;

  if (autotypeState.intervalId) {
    clearTimeout(autotypeState.intervalId);
    autotypeState.intervalId = null;
  }

  updateTypingProgress();
  chrome.runtime.sendMessage({ action: 'autotypePaused' });
}

function resumeAutotype() {
  if (!autotypeState.active || !autotypeState.paused) return;
  autotypeState.paused = false;

  typeNextCharacter();
  chrome.runtime.sendMessage({ action: 'autotypeResumed' });
}

function handleTextFieldClick(event) {
  if (!autotypeState.active) return;

  const element = event.target;

  // Check if clicked element is a text input
  const isTextInput =
    (element.tagName === 'INPUT' && ['text', 'email', 'search', 'url', 'tel', 'password'].includes(element.type)) ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable;

  if (!isTextInput) return;

  // Prevent default click behavior
  event.preventDefault();
  event.stopPropagation();

  // Start typing in this element
  autotypeState.targetElement = element;
  autotypeState.currentIndex = 0;

  // Focus the element
  element.focus();

  // Hide overlay
  hideAutotypeOverlay();

  // Start typing
  typeText();
}

function typeText() {
  // Show typing progress
  showTypingProgress();

  // Start typing first character
  typeNextCharacter();
}

function typeNextCharacter() {
  if (!autotypeState.active || autotypeState.paused) {
    return;
  }

  if (!autotypeState.targetElement) {
    stopAutotype();
    return;
  }

  const element = autotypeState.targetElement;
  const text = autotypeState.text;

  // Check if finished
  if (autotypeState.currentIndex >= text.length) {
    chrome.runtime.sendMessage({ action: 'autotypeComplete' });
    stopAutotype();
    return;
  }

  // Update progress
  updateTypingProgress();

  // Calculate next delay with humanization
  const delay = getHumanizedDelay();

  // Check for random pause/break
  if (shouldTakeBreak()) {
    const pauseDuration = getRandomPauseDuration();
    autotypeState.intervalId = setTimeout(() => {
      typeNextCharacter();
    }, pauseDuration);
    return;
  }

  // Get next character
  const char = text[autotypeState.currentIndex];

  // Check if we should make a mistake
  if (shouldMakeMistake() && autotypeState.currentIndex < text.length - 1) {
    // Type wrong character
    const wrongChar = getRandomWrongChar(char);
    typeCharacter(element, wrongChar);

    // Wait a bit, then delete and type correct character
    autotypeState.intervalId = setTimeout(() => {
      deleteCharacter(element);

      setTimeout(() => {
        typeCharacter(element, char);
        autotypeState.currentIndex++;

        setTimeout(() => {
          typeNextCharacter();
        }, delay * 0.5); // Shorter delay after correction
      }, delay * 0.8);
    }, delay * 1.5); // Pause before realizing mistake

    return;
  }

  // Type normal character
  typeCharacter(element, char);
  autotypeState.currentIndex++;

  // Schedule next character
  autotypeState.intervalId = setTimeout(() => {
    typeNextCharacter();
  }, delay);
}

function getHumanizedDelay() {
  const wpm = autotypeState.wpm;
  const baseDelay = 60000 / (wpm * 5); // Base delay in ms

  // Apply speed variation
  const variation = autotypeState.speedVariation / 100;
  const randomFactor = 1 + (Math.random() * variation * 2 - variation);

  return baseDelay * randomFactor;
}

function shouldMakeMistake() {
  return Math.random() * 100 < autotypeState.mistakeChance;
}

function shouldTakeBreak() {
  const chance = Math.random() * 100;

  // Check for thinking pause (longer)
  if (chance < autotypeState.thinkingPauseChance) {
    return true;
  }

  // Check for regular pause
  if (chance < autotypeState.pauseChance) {
    return true;
  }

  return false;
}

function getRandomPauseDuration() {
  const chance = Math.random() * 100;

  // Thinking pause (longer)
  if (chance < autotypeState.thinkingPauseChance) {
    return autotypeState.minThinkingMs + Math.random() * (autotypeState.maxThinkingMs - autotypeState.minThinkingMs);
  }

  // Regular pause
  return autotypeState.minPauseMs + Math.random() * (autotypeState.maxPauseMs - autotypeState.minPauseMs);
}

function getRandomWrongChar(correctChar) {
  // Keyboard proximity map for realistic typos
  const proximityMap = {
    'a': ['s', 'q', 'w', 'z'],
    'b': ['v', 'g', 'h', 'n'],
    'c': ['x', 'd', 'f', 'v'],
    'd': ['s', 'e', 'r', 'f', 'c', 'x'],
    'e': ['w', 'r', 'd', 's'],
    'f': ['d', 'r', 't', 'g', 'v', 'c'],
    'g': ['f', 't', 'y', 'h', 'b', 'v'],
    'h': ['g', 'y', 'u', 'j', 'n', 'b'],
    'i': ['u', 'o', 'k', 'j'],
    'j': ['h', 'u', 'i', 'k', 'm', 'n'],
    'k': ['j', 'i', 'o', 'l', 'm'],
    'l': ['k', 'o', 'p'],
    'm': ['n', 'j', 'k'],
    'n': ['b', 'h', 'j', 'm'],
    'o': ['i', 'p', 'l', 'k'],
    'p': ['o', 'l'],
    'q': ['w', 'a'],
    'r': ['e', 't', 'f', 'd'],
    's': ['a', 'w', 'e', 'd', 'x', 'z'],
    't': ['r', 'y', 'g', 'f'],
    'u': ['y', 'i', 'j', 'h'],
    'v': ['c', 'f', 'g', 'b'],
    'w': ['q', 'e', 's', 'a'],
    'x': ['z', 's', 'd', 'c'],
    'y': ['t', 'u', 'h', 'g'],
    'z': ['a', 's', 'x']
  };

  const lowerChar = correctChar.toLowerCase();
  const nearby = proximityMap[lowerChar];

  if (nearby && nearby.length > 0) {
    const wrongChar = nearby[Math.floor(Math.random() * nearby.length)];
    return correctChar === correctChar.toUpperCase() ? wrongChar.toUpperCase() : wrongChar;
  }

  // Fallback to random letter
  const randomLetter = String.fromCharCode(97 + Math.floor(Math.random() * 26));
  return correctChar === correctChar.toUpperCase() ? randomLetter.toUpperCase() : randomLetter;
}

function typeCharacter(element, char) {
  const isGoogleDocs = window.location.hostname.includes('docs.google.com');

  if (isGoogleDocs) {
    typeInGoogleDocs(char);
  } else if (element.isContentEditable) {
    typeInContentEditable(element, char);
  } else {
    typeInRegularInput(element, char);
  }
}

function deleteCharacter(element) {
  const isGoogleDocs = window.location.hostname.includes('docs.google.com');

  if (isGoogleDocs) {
    deleteInGoogleDocs();
  } else if (element.isContentEditable) {
    deleteInContentEditable(element);
  } else {
    deleteInRegularInput(element);
  }
}

function deleteInGoogleDocs() {
  // Simulate backspace in Google Docs
  const backspaceEvent = new KeyboardEvent('keydown', {
    key: 'Backspace',
    keyCode: 8,
    which: 8,
    bubbles: true,
    cancelable: true
  });

  document.activeElement.dispatchEvent(backspaceEvent);

  const inputEvent = new InputEvent('input', {
    inputType: 'deleteContentBackward',
    bubbles: true,
    cancelable: true
  });

  document.activeElement.dispatchEvent(inputEvent);

  const keyupEvent = new KeyboardEvent('keyup', {
    key: 'Backspace',
    keyCode: 8,
    which: 8,
    bubbles: true,
    cancelable: true
  });

  document.activeElement.dispatchEvent(keyupEvent);
}

function deleteInContentEditable(element) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.setStart(range.startContainer, Math.max(0, range.startOffset - 1));
    range.deleteContents();
  }
}

function deleteInRegularInput(element) {
  const start = element.selectionStart || 0;
  if (start > 0) {
    element.value = element.value.substring(0, start - 1) + element.value.substring(start);
    element.selectionStart = element.selectionEnd = start - 1;
    element.dispatchEvent(new InputEvent('input', {
      inputType: 'deleteContentBackward',
      bubbles: true
    }));
  }
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

// Overlay UI
function showAutotypeOverlay() {
  // Remove existing overlay if any
  hideAutotypeOverlay();

  const overlay = document.createElement('div');
  overlay.id = 'ovara-autotype-overlay';
  overlay.innerHTML = `
    <div class="ovara-overlay-content">
      <div class="ovara-overlay-icon">⌨️</div>
      <div class="ovara-overlay-title">Auto-Typer Active</div>
      <div class="ovara-overlay-text">Click any text field to start typing</div>
      <button class="ovara-overlay-cancel" id="ovaraOverlayCancel">Cancel</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Add cancel button listener
  document.getElementById('ovaraOverlayCancel').addEventListener('click', () => {
    stopAutotype();
  });

  // Add ESC key listener
  document.addEventListener('keydown', handleEscKey);
}

function hideAutotypeOverlay() {
  const overlay = document.getElementById('ovara-autotype-overlay');
  if (overlay) {
    overlay.remove();
  }

  document.removeEventListener('keydown', handleEscKey);
}

function handleEscKey(event) {
  if (event.key === 'Escape') {
    stopAutotype();
  }
}

// Typing Progress Indicator
function showTypingProgress() {
  if (document.getElementById('ovara-typing-progress')) return;

  const progress = document.createElement('div');
  progress.id = 'ovara-typing-progress';
  progress.innerHTML = `
    <div class="ovara-progress-header">
      <span class="ovara-progress-icon">⌨️</span>
      <span class="ovara-progress-title">Auto-Typing</span>
      <button class="ovara-progress-close" id="ovaraProgressClose">×</button>
    </div>
    <div class="ovara-progress-body">
      <div class="ovara-progress-bar-container">
        <div class="ovara-progress-bar" id="ovaraProgressBar"></div>
      </div>
      <div class="ovara-progress-stats">
        <span id="ovaraProgressPercent">0%</span>
        <span id="ovaraProgressChars">0 / 0</span>
      </div>
      <div class="ovara-progress-time">
        <span id="ovaraProgressElapsed">00:00</span>
        <span id="ovaraProgressRemaining">Est: --:--</span>
      </div>
    </div>
    <div class="ovara-progress-controls">
      <button class="ovara-progress-btn ovara-progress-pause" id="ovaraProgressPause">⏸ Pause</button>
      <button class="ovara-progress-btn ovara-progress-stop" id="ovaraProgressStop">⏹ Stop</button>
    </div>
  `;

  document.body.appendChild(progress);

  // Add event listeners
  document.getElementById('ovaraProgressClose').addEventListener('click', stopAutotype);
  document.getElementById('ovaraProgressStop').addEventListener('click', stopAutotype);

  const pauseBtn = document.getElementById('ovaraProgressPause');
  pauseBtn.addEventListener('click', () => {
    if (autotypeState.paused) {
      resumeAutotype();
      pauseBtn.innerHTML = '⏸ Pause';
    } else {
      pauseAutotype();
      pauseBtn.innerHTML = '▶ Resume';
    }
  });

  // Update progress immediately
  updateTypingProgress();
}

function updateTypingProgress() {
  const progressBar = document.getElementById('ovaraProgressBar');
  const progressPercent = document.getElementById('ovaraProgressPercent');
  const progressChars = document.getElementById('ovaraProgressChars');
  const progressElapsed = document.getElementById('ovaraProgressElapsed');
  const progressRemaining = document.getElementById('ovaraProgressRemaining');

  if (!progressBar) return;

  const totalChars = autotypeState.text.length;
  const typedChars = autotypeState.currentIndex;
  const percent = Math.round((typedChars / totalChars) * 100);

  // Update progress bar
  progressBar.style.width = percent + '%';

  // Update stats
  progressPercent.textContent = percent + '%';
  progressChars.textContent = `${typedChars} / ${totalChars}`;

  // Calculate elapsed time
  const elapsedMs = Date.now() - autotypeState.startTime;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedSecondsRemainder = elapsedSeconds % 60;
  progressElapsed.textContent = `${String(elapsedMinutes).padStart(2, '0')}:${String(elapsedSecondsRemainder).padStart(2, '0')}`;

  // Estimate remaining time
  if (typedChars > 0) {
    const avgTimePerChar = elapsedMs / typedChars;
    const remainingChars = totalChars - typedChars;
    const estimatedRemainingMs = avgTimePerChar * remainingChars;
    const remainingSeconds = Math.floor(estimatedRemainingMs / 1000);
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    const remainingSecondsRemainder = remainingSeconds % 60;
    progressRemaining.textContent = `Est: ${String(remainingMinutes).padStart(2, '0')}:${String(remainingSecondsRemainder).padStart(2, '0')}`;
  }
}

function hideTypingProgress() {
  const progress = document.getElementById('ovara-typing-progress');
  if (progress) {
    progress.remove();
  }
}

// Inject overlay styles
const style = document.createElement('style');
style.textContent = `
  #ovara-autotype-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(102, 126, 234, 0.95);
    backdrop-filter: blur(10px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    animation: ovara-fade-in 0.3s ease-out;
  }

  @keyframes ovara-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .ovara-overlay-content {
    text-align: center;
    color: white;
    max-width: 400px;
    padding: 40px;
  }

  .ovara-overlay-icon {
    font-size: 64px;
    margin-bottom: 20px;
    animation: ovara-pulse 2s ease-in-out infinite;
  }

  @keyframes ovara-pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  .ovara-overlay-title {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .ovara-overlay-text {
    font-size: 16px;
    opacity: 0.9;
    margin-bottom: 30px;
    line-height: 1.5;
  }

  .ovara-overlay-cancel {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid white;
    color: white;
    padding: 12px 30px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ovara-overlay-cancel:hover {
    background: white;
    color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  /* Highlight text fields when autotyper is active */
  #ovara-autotype-overlay ~ * input[type="text"]:not([type="hidden"]),
  #ovara-autotype-overlay ~ * input[type="email"],
  #ovara-autotype-overlay ~ * input[type="search"],
  #ovara-autotype-overlay ~ * input[type="url"],
  #ovara-autotype-overlay ~ * input[type="tel"],
  #ovara-autotype-overlay ~ * textarea,
  #ovara-autotype-overlay ~ * [contenteditable="true"] {
    outline: 3px solid rgba(255, 255, 255, 0.5) !important;
    outline-offset: 2px !important;
  }

  /* ====================================
     TYPING PROGRESS INDICATOR
     ==================================== */

  #ovara-typing-progress {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 320px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 999998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: ovara-slide-up 0.3s ease-out;
  }

  @keyframes ovara-slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .ovara-progress-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 12px 12px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ovara-progress-icon {
    font-size: 18px;
    margin-right: 8px;
  }

  .ovara-progress-title {
    font-weight: 600;
    font-size: 14px;
    flex: 1;
  }

  .ovara-progress-close {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    line-height: 1;
  }

  .ovara-progress-close:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .ovara-progress-body {
    padding: 16px;
  }

  .ovara-progress-bar-container {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .ovara-progress-bar {
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .ovara-progress-stats {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    margin-bottom: 8px;
  }

  #ovaraProgressPercent {
    font-weight: 600;
    color: #667eea;
  }

  #ovaraProgressChars {
    color: #6b7280;
    font-size: 13px;
  }

  .ovara-progress-time {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 12px;
  }

  .ovara-progress-controls {
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 8px;
  }

  .ovara-progress-btn {
    flex: 1;
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ovara-progress-pause {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }

  .ovara-progress-pause:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }

  .ovara-progress-stop {
    background: #f3f4f6;
    color: #374151;
  }

  .ovara-progress-stop:hover {
    background: #e5e7eb;
  }
`;

document.head.appendChild(style);

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

  const statWords = document.getElementById('statWords');
  const statChars = document.getElementById('statChars');
  const statReadability = document.getElementById('statReadability');

  if (statWords) statWords.textContent = words;
  if (statChars) statChars.textContent = chars;
  if (statReadability) statReadability.textContent = readability;
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
  if (suggestionsContainer) {
    suggestionsContainer.innerHTML = '<div class="coach-loading">Thinking... 🤔</div>';
  }

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
  if (!suggestionsContainer) return;

  let title = '';
  if (action === 'improve') title = '✨ Improved Version';
  if (action === 'expand') title = '📝 Expanded Ideas';
  if (action === 'summarize') title = '📊 Summary';

  const escapedResult = result.replace(/'/g, "\\'").replace(/\n/g, '\\n');

  suggestionsContainer.innerHTML = `
    <div class="coach-result">
      <div class="result-title">${title}</div>
      <div class="result-text">${result}</div>
      <button class="result-copy" onclick="navigator.clipboard.writeText('${escapedResult}'); this.textContent='Copied!'">Copy</button>
    </div>
  `;
}

// ====================================
// OVARA ASSISTANT SIDEBAR
// ====================================

let assistantState = {
  visible: false,
  iframe: null,
  selectedText: '',
  lastActiveElement: null,
  pageContext: {
    url: '',
    title: '',
    mainContent: '',
    pageType: '',
    focusedField: null,
    readability: {}
  },
  settings: {
    theme: 'auto',
    position: 'right',
    size: 'medium',
    customSize: 380,
    autoOpen: false,
    rememberState: true
  }
};

// Load settings on page load and analyze page
(async () => {
  try {
    const result = await chrome.storage.local.get(['assistantSettings']);
    if (result.assistantSettings) {
      assistantState.settings = { ...assistantState.settings, ...result.assistantSettings };

      // Auto-open if enabled
      if (assistantState.settings.autoOpen) {
        setTimeout(() => showAssistant(), 1000);
      }
    } else {
      // First time - detect theme and save
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      assistantState.settings.theme = 'auto';

      await chrome.storage.local.set({ assistantSettings: assistantState.settings });
    }

    // Analyze page content
    analyzePageContext();

    // Monitor for page changes
    observePageChanges();
  } catch (error) {
    console.error('Error loading assistant settings:', error);
  }
})();

// ====================================
// PAGE CONTEXT ANALYSIS
// ====================================

// Analyze current page context
function analyzePageContext() {
  try {
    // Basic page info
    assistantState.pageContext.url = window.location.href;
    assistantState.pageContext.title = document.title;

    // Detect page type
    assistantState.pageContext.pageType = detectPageType();

    // Extract main content
    assistantState.pageContext.mainContent = extractMainContent();

    // Calculate readability
    assistantState.pageContext.readability = calculatePageReadability();

    // Send context to assistant if open
    if (assistantState.iframe) {
      sendContextToAssistant();
    }

    console.log('📄 Page Context:', assistantState.pageContext);
  } catch (error) {
    console.error('Error analyzing page:', error);
  }
}

// Detect what type of page this is
function detectPageType() {
  const url = window.location.href.toLowerCase();
  const hostname = window.location.hostname.toLowerCase();

  // Google Docs
  if (hostname.includes('docs.google.com')) {
    if (url.includes('/document/')) return 'google-docs';
    if (url.includes('/spreadsheets/')) return 'google-sheets';
    if (url.includes('/presentation/')) return 'google-slides';
  }

  // Writing platforms
  if (hostname.includes('medium.com')) return 'medium';
  if (hostname.includes('notion.so')) return 'notion';
  if (hostname.includes('wordpress.com') || hostname.includes('wp-admin')) return 'wordpress';
  if (hostname.includes('substack.com')) return 'substack';

  // Email
  if (hostname.includes('mail.google.com')) return 'gmail';
  if (hostname.includes('outlook.') || hostname.includes('office.com')) return 'outlook';

  // Social Media
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
  if (hostname.includes('linkedin.com')) return 'linkedin';
  if (hostname.includes('facebook.com')) return 'facebook';
  if (hostname.includes('reddit.com')) return 'reddit';

  // Forms
  if (hostname.includes('typeform.com')) return 'form';
  if (hostname.includes('surveymonkey.com')) return 'survey';
  if (document.querySelectorAll('form').length > 2) return 'form-heavy';

  // Articles/News
  if (document.querySelector('article')) return 'article';

  // Check for common blog/article indicators
  const hasArticle = document.querySelector('article, .article, .post, .blog-post');
  if (hasArticle) return 'blog';

  return 'general';
}

// Extract main content from page
function extractMainContent() {
  try {
    let content = '';

    // Try semantic HTML first
    const article = document.querySelector('article');
    const main = document.querySelector('main');
    const contentDiv = document.querySelector('[role="main"], .content, .main-content, #content');

    if (article) {
      content = article.innerText;
    } else if (main) {
      content = main.innerText;
    } else if (contentDiv) {
      content = contentDiv.innerText;
    } else {
      // Fallback: get all paragraph text
      const paragraphs = Array.from(document.querySelectorAll('p'));
      content = paragraphs.map(p => p.innerText).join('\n');
    }

    // Limit to first 5000 characters
    return content.substring(0, 5000).trim();
  } catch (error) {
    return '';
  }
}

// Calculate page readability metrics
function calculatePageReadability() {
  try {
    const content = assistantState.pageContext.mainContent;

    if (!content) return {};

    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

    // Reading time (avg 200 words per minute)
    const readingTimeMinutes = Math.ceil(wordCount / 200);

    return {
      wordCount,
      sentenceCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence),
      readingTime: readingTimeMinutes,
      difficulty: avgWordsPerSentence > 20 ? 'Complex' : avgWordsPerSentence > 15 ? 'Medium' : 'Easy'
    };
  } catch (error) {
    return {};
  }
}

// Observe page changes
function observePageChanges() {
  // Watch for URL changes (SPAs)
  let lastUrl = window.location.href;

  const urlObserver = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      setTimeout(() => analyzePageContext(), 500); // Delay to let page load
    }
  });

  urlObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Watch for focus changes
  document.addEventListener('focusin', (e) => {
    const element = e.target;
    const isTextField =
      (element.tagName === 'INPUT' && ['text', 'email', 'search', 'url', 'tel'].includes(element.type)) ||
      element.tagName === 'TEXTAREA' ||
      element.isContentEditable;

    if (isTextField) {
      assistantState.pageContext.focusedField = {
        type: element.tagName.toLowerCase(),
        placeholder: element.placeholder || '',
        value: element.value || element.innerText || '',
        id: element.id,
        name: element.name
      };

      // Send updated context to assistant
      if (assistantState.iframe) {
        sendContextToAssistant();
      }
    }
  });
}

// Send context to assistant iframe
function sendContextToAssistant() {
  if (!assistantState.iframe) return;

  try {
    assistantState.iframe.contentWindow.postMessage({
      action: 'pageContextUpdate',
      context: assistantState.pageContext
    }, '*');
  } catch (error) {
    console.error('Error sending context to assistant:', error);
  }
}

// Listen for messages to toggle assistant
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleAssistant') {
    toggleAssistant();
    sendResponse({ success: true });
  } else if (request.action === 'closeSidebar') {
    hideAssistant();
    sendResponse({ success: true });
  } else if (request.action === 'insertText') {
    insertTextIntoPage(request.text);
    sendResponse({ success: true });
  } else if (request.action === 'activateSelection') {
    activateTextSelection();
    sendResponse({ success: true });
  } else if (request.action === 'updateSettings') {
    // Update settings when changed from settings page
    assistantState.settings = { ...assistantState.settings, ...request.settings };
    if (assistantState.visible) {
      // Reapply position and size
      hideAssistant();
      setTimeout(() => showAssistant(), 100);
    }
    sendResponse({ success: true });
  }
});

// Toggle assistant sidebar
function toggleAssistant() {
  if (assistantState.visible) {
    hideAssistant();
  } else {
    showAssistant();
  }
}

// Show assistant sidebar
function showAssistant() {
  if (assistantState.visible) return;

  const settings = assistantState.settings;

  // Calculate size
  let size = 380;
  if (settings.size === 'small') size = 300;
  else if (settings.size === 'medium') size = 380;
  else if (settings.size === 'large') size = 480;
  else if (settings.size === 'custom') size = settings.customSize;

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'ovara-assistant-sidebar';
  iframe.src = chrome.runtime.getURL('assistant-sidebar.html');

  // Base styles
  let styles = {
    position: 'fixed',
    border: 'none',
    'z-index': '2147483647',
    'box-shadow': '0 0 20px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease-out'
  };

  // Position-specific styles
  switch (settings.position) {
    case 'right':
      styles = {
        ...styles,
        top: '0',
        right: '0',
        width: `${size}px`,
        height: '100vh',
        'border-left': '1px solid rgba(255, 255, 255, 0.1)',
        animation: 'ovara-slide-in-right 0.3s ease-out'
      };
      // Adjust page margin
      document.body.style.marginRight = `${size}px`;
      break;

    case 'left':
      styles = {
        ...styles,
        top: '0',
        left: '0',
        width: `${size}px`,
        height: '100vh',
        'border-right': '1px solid rgba(255, 255, 255, 0.1)',
        animation: 'ovara-slide-in-left 0.3s ease-out'
      };
      // Adjust page margin
      document.body.style.marginLeft = `${size}px`;
      break;

    case 'top':
      styles = {
        ...styles,
        top: '0',
        left: '0',
        width: '100vw',
        height: `${size}px`,
        'border-bottom': '1px solid rgba(255, 255, 255, 0.1)',
        animation: 'ovara-slide-in-top 0.3s ease-out'
      };
      // Adjust page margin
      document.body.style.marginTop = `${size}px`;
      break;

    case 'bottom':
      styles = {
        ...styles,
        bottom: '0',
        left: '0',
        width: '100vw',
        height: `${size}px`,
        'border-top': '1px solid rgba(255, 255, 255, 0.1)',
        animation: 'ovara-slide-in-bottom 0.3s ease-out'
      };
      // Adjust page margin
      document.body.style.marginBottom = `${size}px`;
      break;

    case 'split':
      styles = {
        ...styles,
        top: '0',
        right: '0',
        width: '50vw',
        height: '100vh',
        'border-left': '1px solid rgba(255, 255, 255, 0.1)',
        animation: 'ovara-slide-in-right 0.3s ease-out'
      };
      // Adjust page margin
      document.body.style.marginRight = '50vw';
      break;
  }

  // Apply styles
  iframe.style.cssText = Object.entries(styles)
    .map(([key, value]) => `${key}: ${value} !important`)
    .join('; ') + ';';

  document.body.appendChild(iframe);
  assistantState.iframe = iframe;
  assistantState.visible = true;

  // Add transition to body
  document.body.style.transition = 'all 0.3s ease-out';

  // Send page context to assistant after iframe loads
  setTimeout(() => {
    sendContextToAssistant();
  }, 500);
}

// Hide assistant sidebar
function hideAssistant() {
  if (!assistantState.visible) return;

  if (assistantState.iframe) {
    assistantState.iframe.remove();
    assistantState.iframe = null;
  }

  assistantState.visible = false;

  // Reset all page margins
  document.body.style.marginRight = '0';
  document.body.style.marginLeft = '0';
  document.body.style.marginTop = '0';
  document.body.style.marginBottom = '0';
}

// Activate text selection mode
function activateTextSelection() {
  // Add selection listener
  document.addEventListener('mouseup', handleTextSelection);

  // Show instruction
  showSelectionInstruction();
}

// Handle text selection
function handleTextSelection(event) {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text) {
    assistantState.selectedText = text;

    // Send message to assistant iframe
    if (assistantState.iframe) {
      assistantState.iframe.contentWindow.postMessage({
        action: 'selectedTextUpdate',
        text: text
      }, '*');
    }

    // Also send to background script for storage
    chrome.runtime.sendMessage({
      action: 'updateSelectedText',
      text: text
    });

    hideSelectionInstruction();
    document.removeEventListener('mouseup', handleTextSelection);
  }
}

// Show selection instruction
function showSelectionInstruction() {
  if (document.getElementById('ovara-selection-instruction')) return;

  const instruction = document.createElement('div');
  instruction.id = 'ovara-selection-instruction';
  instruction.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #6366f1 0%, #764ba2 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: ovara-fade-in 0.3s ease-out;
    ">
      <span>✨</span>
      <span>Select any text on this page</span>
    </div>
  `;

  document.body.appendChild(instruction);
}

// Hide selection instruction
function hideSelectionInstruction() {
  const instruction = document.getElementById('ovara-selection-instruction');
  if (instruction) instruction.remove();
}

// Insert text into the active element on page
function insertTextIntoPage(text) {
  // Try to find the last active text input
  const activeElement = document.activeElement;

  const isTextInput =
    (activeElement.tagName === 'INPUT' && ['text', 'email', 'search', 'url', 'tel'].includes(activeElement.type)) ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.isContentEditable;

  if (!isTextInput) {
    // Try to find any focused or recently focused element
    const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="search"], textarea, [contenteditable="true"]');

    if (textInputs.length > 0) {
      const target = textInputs[0];
      target.focus();
      insertTextIntoElement(target, text);
    } else {
      alert('Please click on a text field first!');
    }
  } else {
    insertTextIntoElement(activeElement, text);
  }
}

// Insert text into specific element
function insertTextIntoElement(element, text) {
  if (element.isContentEditable) {
    // ContentEditable element
    element.focus();
    document.execCommand('insertText', false, text);
  } else {
    // Regular input/textarea
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const currentValue = element.value || '';

    element.value = currentValue.substring(0, start) + text + currentValue.substring(end);
    element.selectionStart = element.selectionEnd = start + text.length;

    // Trigger input event
    element.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true
    }));
  }
}

// Add keyboard shortcut listener (Ctrl+Space)
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.code === 'Space') {
    event.preventDefault();
    toggleAssistant();
  }
});

// Add slide-in animations for all positions
const assistantStyle = document.createElement('style');
assistantStyle.textContent = `
  @keyframes ovara-slide-in-right {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes ovara-slide-in-left {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes ovara-slide-in-top {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes ovara-slide-in-bottom {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes ovara-fade-in {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
document.head.appendChild(assistantStyle);

// ====================================
// CLIPBOARD MONITOR
// ====================================

let clipboardState = {
  enabled: false,
  lastClipboardText: '',
  notificationTimeout: null
};

// Load clipboard permission
async function loadClipboardPermission() {
  try {
    const result = await chrome.storage.local.get(['permissions']);
    if (result.permissions && result.permissions.clipboard) {
      clipboardState.enabled = true;
      startClipboardMonitoring();
    }
  } catch (error) {
    console.error('Error loading clipboard permission:', error);
  }
}

// Start clipboard monitoring
function startClipboardMonitoring() {
  if (!clipboardState.enabled) return;

  // Listen for copy events
  document.addEventListener('copy', handleCopyEvent);

  // Also listen for keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+C or Cmd+C
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      setTimeout(checkClipboard, 100);
    }
  });

  console.log('📋 Clipboard monitor enabled');
}

// Handle copy event
async function handleCopyEvent(e) {
  // Wait a bit for clipboard to update
  setTimeout(checkClipboard, 100);
}

// Check clipboard content
async function checkClipboard() {
  if (!clipboardState.enabled) return;

  try {
    const text = await navigator.clipboard.readText();

    // Only show notification if text is different and substantial
    if (text && text.length > 10 && text !== clipboardState.lastClipboardText) {
      clipboardState.lastClipboardText = text;
      showClipboardNotification(text);
    }
  } catch (error) {
    // Permission denied or clipboard empty
    console.log('Clipboard access denied or empty');
  }
}

// Show clipboard notification with quick actions
function showClipboardNotification(text) {
  // Remove existing notification
  const existing = document.getElementById('ovara-clipboard-notification');
  if (existing) existing.remove();

  // Create notification
  const notification = document.createElement('div');
  notification.id = 'ovara-clipboard-notification';
  notification.innerHTML = `
    <div class="clipboard-header">
      <span class="clipboard-icon">📋</span>
      <span class="clipboard-title">Text Copied!</span>
      <button class="clipboard-close" id="clipboardCloseBtn">×</button>
    </div>
    <div class="clipboard-preview">${text.substring(0, 100)}${text.length > 100 ? '...' : ''}</div>
    <div class="clipboard-actions">
      <button class="clipboard-action-btn" data-action="rewrite">✏️ Rewrite</button>
      <button class="clipboard-action-btn" data-action="summarize">📝 Summarize</button>
      <button class="clipboard-action-btn" data-action="humanize">✨ Humanize</button>
      <button class="clipboard-action-btn" data-action="grammar">📚 Fix Grammar</button>
    </div>
  `;

  // Add styles
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 350px;
    background: linear-gradient(135deg, rgba(11, 12, 16, 0.98), rgba(31, 41, 55, 0.98));
    border: 1px solid rgba(99, 102, 241, 0.5);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 999998;
    animation: ovara-slide-in-bottom 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  document.body.appendChild(notification);

  // Add close button handler
  document.getElementById('clipboardCloseBtn').addEventListener('click', () => {
    notification.remove();
  });

  // Add action buttons handlers
  notification.querySelectorAll('.clipboard-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      handleClipboardAction(action, text);
      notification.remove();
    });
  });

  // Auto-hide after 10 seconds
  clearTimeout(clipboardState.notificationTimeout);
  clipboardState.notificationTimeout = setTimeout(() => {
    notification.remove();
  }, 10000);
}

// Handle clipboard action
function handleClipboardAction(action, text) {
  // Open assistant if not open
  if (!assistantState.visible) {
    toggleOvaraAssistant();
  }

  // Wait for assistant to open, then fill prompt
  setTimeout(() => {
    const promptInput = assistantState.iframe?.contentDocument?.getElementById('promptInput');
    if (promptInput) {
      let prompt = '';
      switch (action) {
        case 'rewrite':
          prompt = `Rewrite the following text to make it better:\n\n${text}`;
          break;
        case 'summarize':
          prompt = `Summarize the following text:\n\n${text}`;
          break;
        case 'humanize':
          prompt = `Make the following text sound more human and natural:\n\n${text}`;
          break;
        case 'grammar':
          prompt = `Check and fix grammar in the following text:\n\n${text}`;
          break;
      }
      promptInput.value = prompt;
      promptInput.focus();
    }
  }, 300);
}

// Add clipboard notification styles
const clipboardStyles = document.createElement('style');
clipboardStyles.textContent = `
  #ovara-clipboard-notification .clipboard-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  #ovara-clipboard-notification .clipboard-icon {
    font-size: 20px;
  }

  #ovara-clipboard-notification .clipboard-title {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  }

  #ovara-clipboard-notification .clipboard-close {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  #ovara-clipboard-notification .clipboard-close:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }

  #ovara-clipboard-notification .clipboard-preview {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    padding: 10px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.4;
    margin-bottom: 12px;
    max-height: 60px;
    overflow: hidden;
  }

  #ovara-clipboard-notification .clipboard-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  #ovara-clipboard-notification .clipboard-action-btn {
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid rgba(99, 102, 241, 0.4);
    border-radius: 6px;
    padding: 8px;
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  #ovara-clipboard-notification .clipboard-action-btn:hover {
    background: rgba(99, 102, 241, 0.4);
    border-color: #6366f1;
    transform: translateY(-2px);
  }
`;
document.head.appendChild(clipboardStyles);

// Initialize clipboard monitoring
loadClipboardPermission();

// Listen for permission updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'permissionsUpdated') {
    if (message.permissions.clipboard) {
      clipboardState.enabled = true;
      startClipboardMonitoring();
    } else {
      clipboardState.enabled = false;
    }
  } else if (message.action === 'contextMenuAction') {
    handleContextMenuAction(message.menuAction, message.text, message.prompt);
    sendResponse({ success: true });
  }
  return true;
});

// Handle context menu actions
function handleContextMenuAction(action, text, prompt) {
  // Open assistant if not open
  if (!assistantState.visible) {
    toggleOvaraAssistant();
  }

  // Wait for assistant to open, then fill prompt
  setTimeout(() => {
    const promptInput = assistantState.iframe?.contentDocument?.getElementById('promptInput');
    if (promptInput) {
      if (action === 'custom') {
        // For custom, just fill with the selected text
        promptInput.value = '';
        promptInput.placeholder = `Ask anything about: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`;
        // Also store the context
        assistantState.selectedText = text;
      } else {
        // For quick actions, fill with the full prompt
        promptInput.value = prompt;
      }
      promptInput.focus();
    }
  }, 300);
}

// ====================================
// GRAMMARLY-STYLE INLINE GRAMMAR CHECKER
// ====================================

let grammarCheckerState = {
  enabled: false,
  activeElement: null,
  checkTimeout: null,
  overlay: null,
  currentSuggestions: [],
  hoveredSuggestion: null
};

// Grammar rules database
const grammarRules = {
  // Common spelling errors
  spelling: {
    'teh': 'the',
    'recieve': 'receive',
    'occured': 'occurred',
    'seperate': 'separate',
    'definately': 'definitely',
    'accomodate': 'accommodate',
    'alot': 'a lot',
    'untill': 'until',
    'occassion': 'occasion',
    'embarass': 'embarrass'
  },

  // Common grammar patterns
  patterns: [
    {
      regex: /\bi\s+(?!am|can|will|would|should|could|have|had|do|did)/gi,
      error: 'Lowercase "i" should be capitalized',
      suggestion: 'I',
      type: 'capitalization'
    },
    {
      regex: /\b(their|there|they're)\b/gi,
      check: (match, context) => {
        // Basic context checking for their/there/they're
        if (match.toLowerCase() === 'their' && /\s+(are|were|is|was)\b/i.test(context)) {
          return { error: 'Did you mean "they\'re" (they are)?', suggestion: "they're" };
        }
        if (match.toLowerCase() === 'there' && /\s+(house|car|dog|cat|book|phone)\b/i.test(context)) {
          return { error: 'Did you mean "their" (possessive)?', suggestion: 'their' };
        }
        return null;
      },
      type: 'word-choice'
    },
    {
      regex: /\b(your|you're)\b/gi,
      check: (match, context) => {
        if (match.toLowerCase() === 'your' && /\s+(going|coming|being|doing)\b/i.test(context)) {
          return { error: 'Did you mean "you\'re" (you are)?', suggestion: "you're" };
        }
        if (match.toLowerCase() === "you're" && /\s+(house|car|dog|cat|book|phone)\b/i.test(context)) {
          return { error: 'Did you mean "your" (possessive)?', suggestion: 'your' };
        }
        return null;
      },
      type: 'word-choice'
    },
    {
      regex: /\b(its|it's)\b/gi,
      check: (match, context) => {
        if (match.toLowerCase() === 'its' && /\s+(going|coming|being)\b/i.test(context)) {
          return { error: 'Did you mean "it\'s" (it is)?', suggestion: "it's" };
        }
        if (match.toLowerCase() === "it's" && /\s+(purpose|color|size)\b/i.test(context)) {
          return { error: 'Did you mean "its" (possessive)?', suggestion: 'its' };
        }
        return null;
      },
      type: 'word-choice'
    },
    {
      regex: /\.\s+[a-z]/g,
      error: 'Sentence should start with a capital letter',
      type: 'capitalization'
    },
    {
      regex: /\s{2,}/g,
      error: 'Multiple spaces detected',
      suggestion: ' ',
      type: 'spacing'
    },
    {
      regex: /([.!?]){2,}/g,
      error: 'Multiple punctuation marks',
      type: 'punctuation'
    },
    {
      regex: /\b(very|really|quite|just|actually)\s+(very|really|quite|just|actually)\b/gi,
      error: 'Redundant intensifiers',
      type: 'style'
    },
    {
      regex: /\s+([.!?,;:])/g,
      error: 'Space before punctuation',
      type: 'punctuation'
    },
    {
      regex: /([.!?])\w/g,
      error: 'Missing space after punctuation',
      type: 'spacing'
    }
  ]
};

// Load grammar checker permission
async function loadGrammarCheckerPermission() {
  try {
    const result = await chrome.storage.local.get(['permissions']);
    if (result.permissions && result.permissions.grammarChecker) {
      grammarCheckerState.enabled = true;
      startGrammarChecker();
    }
  } catch (error) {
    console.error('Error loading grammar checker permission:', error);
  }
}

// Start grammar checker
function startGrammarChecker() {
  if (!grammarCheckerState.enabled) return;

  // Monitor all text inputs and contenteditable elements
  document.addEventListener('focusin', handleGrammarFocus);
  document.addEventListener('input', handleGrammarInput);
  document.addEventListener('focusout', handleGrammarBlur);

  console.log('✍️ Grammar checker enabled');
}

// Handle focus on text elements
function handleGrammarFocus(e) {
  if (!grammarCheckerState.enabled) return;

  const element = e.target;

  // Check if it's a text input
  if (isTextInput(element)) {
    grammarCheckerState.activeElement = element;

    // Check grammar if there's already text
    if (element.value || element.textContent) {
      scheduleGrammarCheck(element);
    }
  }
}

// Handle input events
function handleGrammarInput(e) {
  if (!grammarCheckerState.enabled) return;

  const element = e.target;

  if (isTextInput(element)) {
    scheduleGrammarCheck(element);
  }
}

// Handle blur
function handleGrammarBlur(e) {
  if (!grammarCheckerState.enabled) return;

  // Clear highlights when leaving field
  clearGrammarTimeout();
  removeGrammarOverlay();
}

// Schedule grammar check (debounced)
function scheduleGrammarCheck(element) {
  clearGrammarTimeout();

  grammarCheckerState.checkTimeout = setTimeout(() => {
    performGrammarCheck(element);
  }, 800); // Check 800ms after user stops typing
}

// Clear timeout
function clearGrammarTimeout() {
  if (grammarCheckerState.checkTimeout) {
    clearTimeout(grammarCheckerState.checkTimeout);
    grammarCheckerState.checkTimeout = null;
  }
}

// Perform grammar check
function performGrammarCheck(element) {
  const text = element.value || element.textContent || '';

  if (!text || text.length < 3) {
    removeGrammarOverlay();
    return;
  }

  // Find all grammar issues
  const issues = findGrammarIssues(text);

  if (issues.length === 0) {
    removeGrammarOverlay();
    return;
  }

  // Show inline suggestions
  showGrammarSuggestions(element, issues);
}

// Find grammar issues
function findGrammarIssues(text) {
  const issues = [];

  // Check spelling errors
  const words = text.split(/\s+/);
  words.forEach((word, index) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
    if (grammarRules.spelling[cleanWord]) {
      const start = text.indexOf(word);
      if (start !== -1) {
        issues.push({
          start: start,
          end: start + word.length,
          text: word,
          error: `Spelling: "${word}" might be misspelled`,
          suggestion: grammarRules.spelling[cleanWord],
          type: 'spelling'
        });
      }
    }
  });

  // Check pattern-based rules
  grammarRules.patterns.forEach(rule => {
    let match;
    const regex = new RegExp(rule.regex.source, rule.regex.flags);

    while ((match = regex.exec(text)) !== null) {
      let issue = {
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type: rule.type
      };

      // If rule has a check function, use it
      if (rule.check) {
        const contextStart = Math.max(0, match.index - 20);
        const contextEnd = Math.min(text.length, match.index + match[0].length + 20);
        const context = text.substring(contextStart, contextEnd);

        const result = rule.check(match[0], context);
        if (result) {
          issue.error = result.error;
          issue.suggestion = result.suggestion;
          issues.push(issue);
        }
      } else {
        issue.error = rule.error;
        issue.suggestion = rule.suggestion;
        issues.push(issue);
      }
    }
  });

  return issues;
}

// Show grammar suggestions overlay
function showGrammarSuggestions(element, issues) {
  // Remove existing overlay
  removeGrammarOverlay();

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'ovara-grammar-overlay';
  overlay.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 999997;
  `;

  // Position overlay
  const rect = element.getBoundingClientRect();
  overlay.style.top = rect.top + window.scrollY + 'px';
  overlay.style.left = rect.left + window.scrollX + 'px';
  overlay.style.width = rect.width + 'px';
  overlay.style.height = rect.height + 'px';

  // Add underlines for each issue
  issues.forEach((issue, index) => {
    const underline = createGrammarUnderline(element, issue, index);
    if (underline) {
      overlay.appendChild(underline);
    }
  });

  document.body.appendChild(overlay);
  grammarCheckerState.overlay = overlay;
  grammarCheckerState.currentSuggestions = issues;
}

// Create underline for grammar issue
function createGrammarUnderline(element, issue, index) {
  const text = element.value || element.textContent || '';
  const beforeText = text.substring(0, issue.start);
  const issueText = text.substring(issue.start, issue.end);

  // Create temporary span to measure position
  const temp = document.createElement('span');
  temp.style.cssText = `
    position: absolute;
    visibility: hidden;
    white-space: pre;
    font: ${window.getComputedStyle(element).font};
  `;
  temp.textContent = beforeText;
  document.body.appendChild(temp);

  const startX = temp.offsetWidth;
  temp.textContent = beforeText + issueText;
  const endX = temp.offsetWidth;
  document.body.removeChild(temp);

  // Create underline
  const underline = document.createElement('div');
  underline.className = 'ovara-grammar-underline';
  underline.dataset.issueIndex = index;

  // Color based on type
  let color = '#ef4444'; // red for errors
  if (issue.type === 'style') color = '#3b82f6'; // blue for style
  if (issue.type === 'spelling') color = '#ef4444'; // red for spelling

  underline.style.cssText = `
    position: absolute;
    left: ${startX}px;
    top: ${element.offsetHeight - 4}px;
    width: ${endX - startX}px;
    height: 2px;
    background: ${color};
    border-bottom: 2px wavy ${color};
    pointer-events: all;
    cursor: pointer;
  `;

  // Add click handler to show suggestion card
  underline.addEventListener('click', (e) => {
    e.stopPropagation();
    showSuggestionCard(element, issue, underline);
  });

  return underline;
}

// Show suggestion card
function showSuggestionCard(element, issue, underline) {
  // Remove existing card
  const existing = document.getElementById('ovara-grammar-card');
  if (existing) existing.remove();

  // Create card
  const card = document.createElement('div');
  card.id = 'ovara-grammar-card';
  card.innerHTML = `
    <div class="grammar-card-header">
      <span class="grammar-card-type">${issue.type}</span>
      <button class="grammar-card-close">×</button>
    </div>
    <div class="grammar-card-error">${issue.error}</div>
    ${issue.suggestion ? `
      <div class="grammar-card-suggestion">
        <strong>Suggestion:</strong> "${issue.suggestion}"
      </div>
      <button class="grammar-card-fix">Apply Fix</button>
    ` : ''}
    <button class="grammar-card-ignore">Ignore</button>
  `;

  // Position card
  const rect = underline.getBoundingClientRect();
  card.style.cssText = `
    position: fixed;
    top: ${rect.bottom + 5}px;
    left: ${rect.left}px;
    min-width: 250px;
    max-width: 350px;
    background: linear-gradient(135deg, rgba(11, 12, 16, 0.98), rgba(31, 41, 55, 0.98));
    border: 1px solid rgba(99, 102, 241, 0.5);
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  document.body.appendChild(card);

  // Add event listeners
  card.querySelector('.grammar-card-close').addEventListener('click', () => {
    card.remove();
  });

  card.querySelector('.grammar-card-ignore')?.addEventListener('click', () => {
    card.remove();
    underline.remove();
  });

  if (issue.suggestion) {
    card.querySelector('.grammar-card-fix')?.addEventListener('click', () => {
      applyGrammarFix(element, issue);
      card.remove();
      underline.remove();
    });
  }
}

// Apply grammar fix
function applyGrammarFix(element, issue) {
  const text = element.value || element.textContent || '';
  const fixed = text.substring(0, issue.start) + issue.suggestion + text.substring(issue.end);

  if (element.value !== undefined) {
    element.value = fixed;
  } else {
    element.textContent = fixed;
  }

  // Trigger input event
  element.dispatchEvent(new Event('input', { bubbles: true }));

  // Recheck grammar
  setTimeout(() => {
    performGrammarCheck(element);
  }, 100);
}

// Remove grammar overlay
function removeGrammarOverlay() {
  if (grammarCheckerState.overlay) {
    grammarCheckerState.overlay.remove();
    grammarCheckerState.overlay = null;
  }

  const card = document.getElementById('ovara-grammar-card');
  if (card) card.remove();

  grammarCheckerState.currentSuggestions = [];
}

// Add grammar checker styles
const grammarStyles = document.createElement('style');
grammarStyles.textContent = `
  .ovara-grammar-underline {
    animation: ovara-grammar-pulse 2s infinite;
  }

  @keyframes ovara-grammar-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  #ovara-grammar-card {
    animation: ovara-grammar-fade-in 0.2s ease-out;
  }

  @keyframes ovara-grammar-fade-in {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  #ovara-grammar-card .grammar-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  #ovara-grammar-card .grammar-card-type {
    display: inline-block;
    padding: 3px 8px;
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid rgba(99, 102, 241, 0.4);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #a5b4fc;
    text-transform: uppercase;
  }

  #ovara-grammar-card .grammar-card-close {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #ovara-grammar-card .grammar-card-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  #ovara-grammar-card .grammar-card-error {
    color: rgba(255, 255, 255, 0.9);
    font-size: 13px;
    margin-bottom: 10px;
    line-height: 1.4;
  }

  #ovara-grammar-card .grammar-card-suggestion {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 6px;
    padding: 8px;
    margin-bottom: 10px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
  }

  #ovara-grammar-card .grammar-card-suggestion strong {
    color: #22c55e;
  }

  #ovara-grammar-card .grammar-card-fix {
    width: 100%;
    padding: 8px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 6px;
    transition: all 0.2s;
  }

  #ovara-grammar-card .grammar-card-fix:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  }

  #ovara-grammar-card .grammar-card-ignore {
    width: 100%;
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  #ovara-grammar-card .grammar-card-ignore:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;
document.head.appendChild(grammarStyles);

// Initialize grammar checker
loadGrammarCheckerPermission();

// Listen for permission updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'permissionsUpdated') {
    if (message.permissions.grammarChecker && !grammarCheckerState.enabled) {
      grammarCheckerState.enabled = true;
      startGrammarChecker();
    } else if (!message.permissions.grammarChecker && grammarCheckerState.enabled) {
      grammarCheckerState.enabled = false;
      removeGrammarOverlay();
    }
  }
});

// Initialize
console.log('Ovara Extension Loaded: Auto-Typer + Grammar Check + AI Coach + Ovara Assistant + Clipboard Monitor + Real-time Grammar');
