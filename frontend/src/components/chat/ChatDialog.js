import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import ChatMessage from './ChatMessage';
import api from '../../utils/api';

const ChatDialog = ({ onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Generate role-specific suggestions
  useEffect(() => {
    if (!user) return;

    const baseSuggestions = [
      "What's my current points balance?",
      "What promotions are available?",
      "What events can I attend?",
    ];

    const roleSuggestions = {
      regular: [
        "How do I redeem my points?",
        "How can I transfer points?",
      ],
      cashier: [
        "How do I process a transaction?",
        "How do I create a new user?",
      ],
      manager: [
        "How do I create a promotion?",
        "How do I manage events?",
        "Show me recent transactions",
      ],
      superuser: [
        "How do I manage user roles?",
        "Show me system statistics",
        "How do I view all users?",
      ],
    };

    setSuggestions([
      ...baseSuggestions,
      ...(roleSuggestions[user.role] || []),
    ]);
  }, [user]);

  // Initialize with personalized welcome message or restore from localStorage
  useEffect(() => {
    if (!user) return;

    // Try to restore conversation history
    const savedMessages = localStorage.getItem(`chat_history_${user.id}`);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
        return;
      } catch (e) {
        console.error('Failed to parse saved messages', e);
      }
    }

    // Otherwise, show welcome message
    const roleGreetings = {
      regular: "Hi! I'm here to help with your points, transactions, and events.",
      cashier: "Hi! I can help you process transactions and manage customer accounts.",
      manager: "Hi! I can assist with users, transactions, promotions, and events management.",
      superuser: "Hi! I'm here to help with any system administration tasks.",
    };

    setMessages([
      {
        id: 1,
        text: roleGreetings[user.role] || "Hi! How can I help you with the loyalty program today?",
        sender: "bot",
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [user]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!user || messages.length === 0) return;
    localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(messages));
  }, [messages, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when dialog opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const sendMessage = async () => {
    const trimmedMessage = inputMessage.trim();

    if (!trimmedMessage) return;
    if (trimmedMessage.length > 500) {
      setError('Message is too long (max 500 characters)');
      return;
    }

    // Create user message
    const userMessage = {
      id: Date.now(),
      text: trimmedMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately (optimistic UI)
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/chat', {
        message: trimmedMessage,
        conversationId: null,
      });

      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        text: response.response,
        sender: 'bot',
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);

      // Handle specific error cases
      if (err.message.includes('Too many')) {
        setError('Too many messages. Please wait before sending another.');
      } else if (err.message.includes('too long')) {
        setError('Message is too long (max 500 characters)');
      } else if (err.message.includes('empty')) {
        setError('Message cannot be empty');
      } else {
        setError('Chat service temporarily unavailable. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setInputMessage(value);
      if (error && error.includes('too long')) {
        setError(null);
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all chat history? This cannot be undone.')) {
      localStorage.removeItem(`chat_history_${user?.id}`);
      setMessages([
        {
          id: Date.now(),
          text: user?.role
            ? {
                regular: "Hi! I'm here to help with your points, transactions, and events.",
                cashier: "Hi! I can help you process transactions and manage customer accounts.",
                manager: "Hi! I can assist with users, transactions, promotions, and events management.",
                superuser: "Hi! I'm here to help with any system administration tasks.",
              }[user.role]
            : "Hi! How can I help you with the loyalty program today?",
          sender: "bot",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="chat-header"
      className="fixed bottom-20 right-4 md:bottom-24 md:right-6 left-4 md:left-auto md:w-96 h-[32rem] max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 transition-all duration-300 ease-in-out"
    >
      {/* Header */}
      <div
        id="chat-header"
        className="bg-brand-500 dark:bg-brand-600 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between"
      >
        <h2 className="text-lg font-semibold">Customer Support</h2>
        <div className="flex items-center gap-2">
          {/* Clear history button */}
          {messages.length > 1 && (
            <button
              onClick={handleClearHistory}
              aria-label="Clear history"
              title="Clear chat history"
              className="hover:bg-brand-600 dark:hover:bg-brand-700 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          )}
          {/* Minimize button */}
          <button
            onClick={onClose}
            aria-label="Minimize chat"
            title="Minimize chat"
            className="hover:bg-brand-600 dark:hover:bg-brand-700 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close chat"
            title="Close chat"
            className="hover:bg-brand-600 dark:hover:bg-brand-700 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950"
      >
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.text}
            sender={msg.sender}
            timestamp={msg.timestamp}
            userRole={user?.role}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start mb-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg rounded-tl-none px-4 py-3 max-w-[80%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Suggestion Chips - show only when no messages from user yet */}
      {messages.length === 1 && suggestions.length > 0 && (
        <div className="px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Quick suggestions:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(suggestion)}
                className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-brand-100 dark:hover:bg-brand-900 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              aria-label="Type your message"
              rows="1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              style={{ maxHeight: '100px', minHeight: '40px' }}
              disabled={isLoading}
            />
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              {inputMessage.length}/500
            </div>
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-brand-500 dark:bg-brand-600 text-white rounded-lg hover:bg-brand-600 dark:hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 flex items-center justify-center"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDialog;
