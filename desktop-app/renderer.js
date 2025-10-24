const axios = require('axios');
const { shell } = require('electron');

// API Configuration
const API_URL = 'https://your-backend.railway.app/api';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchIcon = document.getElementById('searchIcon');
const searchResults = document.getElementById('searchResults');
const aiAnswerCard = document.getElementById('aiAnswerCard');
const aiAnswerText = document.getElementById('aiAnswerText');
const aiConfidence = document.getElementById('aiConfidence');
const aiSources = document.getElementById('aiSources');
const loadingIndicator = document.getElementById('loadingIndicator');
const noResults = document.getElementById('noResults');
const chatButton = document.getElementById('chatButton');
const chatPanel = document.getElementById('chatPanel');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

// State
let currentResults = [];
let currentAiAnswer = null;
let currentQuery = '';

// Search function
async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    currentQuery = query;

    // Show loading
    searchResults.innerHTML = '';
    aiAnswerCard.style.display = 'none';
    noResults.style.display = 'none';
    loadingIndicator.style.display = 'flex';
    chatButton.style.display = 'none';
    searchBtn.disabled = true;
    searchIcon.textContent = '⌛';

    try {
        const response = await axios.post(`${API_URL}/search`, {
            query: query,
            type: 'web',
            count: 10,
            aiEnabled: true
        });

        currentResults = response.data.results || [];
        currentAiAnswer = response.data.aiAnswer;

        displayResults(currentResults, currentAiAnswer);

    } catch (error) {
        console.error('Search error:', error);
        showError('Failed to search. Please check your connection and try again.');
    } finally {
        loadingIndicator.style.display = 'none';
        searchBtn.disabled = false;
        searchIcon.textContent = '🔍';
    }
}

// Display results
function displayResults(results, aiAnswer) {
    searchResults.innerHTML = '';

    // Show AI Answer
    if (aiAnswer) {
        aiAnswerCard.style.display = 'block';
        aiAnswerText.textContent = aiAnswer.answer;

        // Confidence badge
        aiConfidence.textContent = aiAnswer.confidence.toUpperCase();
        aiConfidence.className = 'ai-badge ' + aiAnswer.confidence;

        // Sources
        if (aiAnswer.sources && aiAnswer.sources.length > 0) {
            aiSources.innerHTML = '<span class="sources-label">Sources:</span>';
            aiAnswer.sources.forEach((source, i) => {
                const link = document.createElement('a');
                link.href = '#';
                link.className = 'source-link';
                link.textContent = `[${i + 1}] ${source.title}`;
                link.onclick = (e) => {
                    e.preventDefault();
                    shell.openExternal(source.url);
                };
                aiSources.appendChild(link);
            });
        }

        // Show chat button with pulse animation
        chatButton.style.display = 'block';
        chatButton.classList.add('pulse');
        setTimeout(() => chatButton.classList.remove('pulse'), 2000);
    }

    // Show search results
    if (results.length > 0) {
        results.forEach((result, index) => {
            const card = createResultCard(result, index + 1);
            searchResults.appendChild(card);
        });
    } else {
        noResults.style.display = 'block';
    }
}

// Create result card
function createResultCard(result, index) {
    const card = document.createElement('div');
    card.className = 'result-card';

    card.innerHTML = `
        <div class="result-title">${index}. ${escapeHtml(result.title)}</div>
        <div class="result-url">${escapeHtml(result.displayUrl || result.url)}</div>
        <div class="result-snippet">${escapeHtml(result.snippet)}</div>
        <span class="result-source">${result.source}</span>
    `;

    card.onclick = () => {
        shell.openExternal(result.url);
    };

    return card;
}

// Show error
function showError(message) {
    searchResults.innerHTML = `
        <div class="no-results">
            <p style="color: #ef4444;">❌ ${escapeHtml(message)}</p>
        </div>
    `;
}

// Open chat panel
function openChat() {
    chatPanel.classList.add('open');
    chatButton.style.display = 'none';

    // Add initial AI answer to chat if available
    if (currentAiAnswer && chatMessages.children.length <= 1) {
        addChatMessage('assistant', currentAiAnswer.answer);
    }

    chatInput.focus();
}

// Close chat panel
function closeChat() {
    chatPanel.classList.remove('open');
    chatButton.style.display = 'block';
}

// Send chat message
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addChatMessage('user', message);
    chatInput.value = '';

    // Send to AI (placeholder - connect to your backend)
    try {
        // Here you would call your AI endpoint for follow-up questions
        // For now, just echo back
        setTimeout(() => {
            addChatMessage('assistant', 'This is where AI follow-up responses would appear. Connect this to your OpenAI endpoint for real conversations!');
        }, 500);
    } catch (error) {
        console.error('Chat error:', error);
        addChatMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    }
}

// Add chat message
function addChatMessage(role, content) {
    // Remove welcome message if present
    const welcome = chatMessages.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const message = document.createElement('div');
    message.className = `chat-message ${role}`;
    message.textContent = content;
    chatMessages.appendChild(message);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

searchBtn.addEventListener('click', performSearch);

chatButton.addEventListener('click', openChat);

closeChatBtn.addEventListener('click', closeChat);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendChatBtn.addEventListener('click', sendMessage);

// Auto-resize chat input
chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
});

// Settings button (placeholder)
document.getElementById('settingsBtn').addEventListener('click', () => {
    alert('Settings panel coming soon!');
});

// History button (placeholder)
document.getElementById('historyBtn').addEventListener('click', () => {
    alert('Search history coming soon!');
});

// Focus search input on load
window.addEventListener('load', () => {
    searchInput.focus();
});
