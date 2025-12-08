import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const ChatMessage = ({ message, sender, timestamp, userRole }) => {
  const isBot = sender === 'bot';
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Detect keywords and suggest actions
  const getActionButtons = () => {
    if (!isBot) return null;

    const messageLower = message.toLowerCase();
    const actions = [];

    // Points-related actions
    if (messageLower.includes('point') || messageLower.includes('balance')) {
      actions.push({ label: 'View Points', path: '/regular/points', icon: '💎' });
    }

    // Transaction-related actions
    if (messageLower.includes('transaction') || messageLower.includes('history')) {
      if (userRole === 'manager' || userRole === 'superuser') {
        actions.push({ label: 'View All Transactions', path: '/manager/transactions', icon: '📊' });
      } else {
        actions.push({ label: 'View My Transactions', path: '/regular/transactions', icon: '📊' });
      }
    }

    // Promotion-related actions
    if (messageLower.includes('promotion') || messageLower.includes('deal') || messageLower.includes('offer')) {
      if (userRole === 'manager' || userRole === 'superuser') {
        actions.push({ label: 'Manage Promotions', path: '/manager/promotions', icon: '🎁' });
      }
      actions.push({ label: 'View Promotions', path: '/regular/promotions', icon: '🎁' });
    }

    // Event-related actions
    if (messageLower.includes('event')) {
      if (userRole === 'manager' || userRole === 'superuser') {
        actions.push({ label: 'Manage Events', path: '/manager/events', icon: '📅' });
      }
      actions.push({ label: 'View Events', path: '/regular/events', icon: '📅' });
    }

    // User management actions (manager/superuser only)
    if ((messageLower.includes('user') || messageLower.includes('account')) && (userRole === 'manager' || userRole === 'superuser')) {
      actions.push({ label: 'Manage Users', path: '/manager/users', icon: '👥' });
    }

    // QR code actions
    if (messageLower.includes('qr') || messageLower.includes('redeem')) {
      actions.push({ label: 'My QR Code', path: '/regular/qr', icon: '📱' });
    }

    // Transfer actions
    if (messageLower.includes('transfer')) {
      actions.push({ label: 'Transfer Points', path: '/regular/transfer', icon: '💸' });
    }

    return actions.length > 0 ? actions : null;
  };

  const actionButtons = getActionButtons();

  return (
    <div className={`flex flex-col mb-4 ${isBot ? 'items-start' : 'items-end'} group`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-lg relative ${
          isBot
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none mr-auto'
            : 'bg-brand-500 dark:bg-brand-600 text-white rounded-tr-none ml-auto'
        }`}
      >
        {isBot ? (
          <div className="text-sm">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-sm">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-sm">{children}</ol>,
                li: ({ children }) => <li className="mb-1 text-sm">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded text-xs font-mono overflow-x-auto my-2">
                    {children}
                  </pre>
                ),
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
        )}
        {isBot && (
          <button
            onClick={handleCopy}
            className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Copy message"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Action Buttons */}
      {actionButtons && actionButtons.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 max-w-[80%]">
          {actionButtons.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full hover:bg-brand-200 dark:hover:bg-brand-900/50 transition-colors border border-brand-300 dark:border-brand-700"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}

      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
        {formatTime(timestamp)}
      </span>
    </div>
  );
};

export default ChatMessage;
