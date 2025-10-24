import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import axios from 'axios';

const API_URL = 'https://your-backend.railway.app/api';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface AIAnswer {
  answer: string;
  sources: Array<{ title: string; url: string }>;
  confidence: string;
}

function App(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiAnswer, setAiAnswer] = useState<AIAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [chatInput, setChatInput] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/search`, {
        query,
        aiEnabled: true,
      });

      setResults(response.data.results || []);
      setAiAnswer(response.data.aiAnswer);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openChat = () => {
    setChatVisible(true);
    if (aiAnswer) {
      setChatMessages([
        { role: 'assistant', content: aiAnswer.answer }
      ]);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const newMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // Here you would call your AI API for follow-up questions
    // For now, just echo
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'This is where follow-up AI responses would appear. Connect to your OpenAI endpoint!'
      }]);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Screen */}
      <View style={styles.header}>
        <Text style={styles.logo}>Ovara</Text>
        <Text style={styles.subtitle}>AI-Enhanced Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search the web..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}>
          <Text style={styles.searchButtonText}>
            {loading ? '⌛' : '🔍'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <ScrollView style={styles.resultsContainer}>
        {/* AI Answer Card */}
        {aiAnswer && (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiTitle}>🤖 AI Answer</Text>
              <Text style={[styles.aiBadge,
                aiAnswer.confidence === 'high' ? styles.highConfidence :
                aiAnswer.confidence === 'medium' ? styles.mediumConfidence :
                styles.lowConfidence
              ]}>
                {aiAnswer.confidence.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.aiAnswer}>{aiAnswer.answer}</Text>
            {aiAnswer.sources && aiAnswer.sources.length > 0 && (
              <View style={styles.aiSources}>
                <Text style={styles.sourcesLabel}>Sources:</Text>
                {aiAnswer.sources.map((source, i) => (
                  <Text key={i} style={styles.sourceLink}>[{i + 1}] {source.title}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Search Results */}
        {results.map((result, index) => (
          <View key={index} style={styles.resultCard}>
            <Text style={styles.resultTitle}>{result.title}</Text>
            <Text style={styles.resultUrl}>{result.url}</Text>
            <Text style={styles.resultSnippet}>{result.snippet}</Text>
            <View style={styles.sourceTag}>
              <Text style={styles.sourceTagText}>{result.source}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Chat Button (ChatGPT Style) */}
      {(results.length > 0 || aiAnswer) && !chatVisible && (
        <TouchableOpacity
          style={styles.chatButton}
          onPress={openChat}>
          <Text style={styles.chatButtonText}>💬</Text>
        </TouchableOpacity>
      )}

      {/* Chat Modal (Full Screen Overlay) */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        presentationStyle="fullScreen">
        <SafeAreaView style={styles.chatContainer}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>AI Assistant</Text>
            <TouchableOpacity onPress={() => setChatVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <ScrollView style={styles.chatMessages}>
            {chatMessages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.messageContainer,
                  msg.role === 'user' ? styles.userMessage : styles.aiMessage
                ]}>
                <Text style={styles.messageText}>{msg.content}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Chat Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask a follow-up question..."
              placeholderTextColor="#888"
              value={chatInput}
              onChangeText={setChatInput}
              multiline
              onSubmitEditing={sendChatMessage}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendChatMessage}>
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  subtitle: {
    fontSize: 14,
    color: '#c5c6c7',
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#1f2833',
    borderRadius: 25,
    padding: 5,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 20,
    color: '#fff',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  aiCard: {
    backgroundColor: '#1f2833',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiTitle: {
    color: '#66fcf1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiBadge: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    overflow: 'hidden',
  },
  highConfidence: {
    backgroundColor: '#22c55e',
    color: '#000',
  },
  mediumConfidence: {
    backgroundColor: '#eab308',
    color: '#000',
  },
  lowConfidence: {
    backgroundColor: '#ef4444',
    color: '#fff',
  },
  aiAnswer: {
    color: '#c5c6c7',
    fontSize: 14,
    lineHeight: 20,
  },
  aiSources: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  sourcesLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  sourceLink: {
    color: '#6366f1',
    fontSize: 12,
    marginTop: 3,
  },
  resultCard: {
    backgroundColor: '#1f2833',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  resultTitle: {
    color: '#66fcf1',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultUrl: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  resultSnippet: {
    color: '#c5c6c7',
    fontSize: 14,
    lineHeight: 20,
  },
  sourceTag: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  sourceTagText: {
    color: '#fff',
    fontSize: 10,
  },
  chatButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  chatButtonText: {
    fontSize: 28,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#0b0c10',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1f2833',
  },
  chatTitle: {
    color: '#66fcf1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#fff',
    fontSize: 24,
  },
  chatMessages: {
    flex: 1,
    padding: 20,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f2833',
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1f2833',
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#0b0c10',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
  },
});

export default App;
