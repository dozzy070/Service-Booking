import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../api';
import { formatDistanceToNow, format } from 'date-fns';

export default function Chat() {
  const { user } = useAuth();
  const { emit, on, off } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/conversations');
        setConversations(res.data);
        if (res.data.length > 0) setActiveConversation(res.data[0]);
      } catch (err) {
        console.error('Failed to fetch conversations', err);
      }
    };
    fetchConversations();
  }, []);

  // Fetch available users for new chat
  useEffect(() => {
    if (!showNewChatModal) return;
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users/available-for-chat');
        setAvailableUsers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, [showNewChatModal]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!activeConversation) return;
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/conversations/${activeConversation.id}/messages`);
        setMessages(res.data);
        scrollToBottom();
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };
    fetchMessages();
    emit('join-conversation', activeConversation.id);
  }, [activeConversation, emit]);

  // Socket listeners
  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (msg.conversation_id === activeConversation?.id) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      } else {
        setConversations(prev =>
          prev.map(conv =>
            conv.id === msg.conversation_id
              ? { ...conv, last_message: msg.message, last_message_time: msg.created_at }
              : conv
          )
        );
      }
    };
    const handleTyping = ({ userId, isTyping }) => {
      if (userId !== user?.id && activeConversation) setOtherUserTyping(isTyping);
    };
    on('new-message', handleNewMessage);
    on('user-typing', handleTyping);
    return () => {
      off('new-message', handleNewMessage);
      off('user-typing', handleTyping);
    };
  }, [activeConversation, on, off, user?.id]);

  const startNewConversation = async () => {
    if (!selectedRecipient) return;
    try {
      const res = await api.post('/conversations', { otherPartyId: selectedRecipient.id });
      const convRes = await api.get('/conversations');
      setConversations(convRes.data);
      const newConv = convRes.data.find(c => c.id === res.data.conversationId);
      if (newConv) setActiveConversation(newConv);
      setShowNewChatModal(false);
      setSelectedRecipient(null);
    } catch (err) {
      console.error('Failed to create conversation', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    emit('send-message', {
      conversationId: activeConversation.id,
      message: newMessage,
      receiverId: activeConversation.other_party_id,
    });
    setNewMessage('');
  };

  const handleTypingStart = () => {
    if (!typing && activeConversation) {
      setTyping(true);
      emit('typing', { conversationId: activeConversation.id, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
        emit('typing', { conversationId: activeConversation.id, isTyping: false });
      }, 1000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return format(date, 'h:mm a');
    if (date > new Date(now - 86400000)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Messages</h2>
          <button className="new-chat-btn" onClick={() => setShowNewChatModal(true)}>+ New Chat</button>
        </div>
        <div className="conversations-list">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => { setActiveConversation(conv); setSidebarOpen(false); }}
              className={`conversation-item ${activeConversation?.id === conv.id ? 'active' : ''}`}
            >
              <div className="avatar">{conv.other_party_name?.charAt(0).toUpperCase()}</div>
              <div className="conv-info">
                <div className="conv-name">{conv.other_party_name}</div>
                <div className="conv-last-msg">{conv.last_message || 'No messages yet'}</div>
              </div>
              {conv.last_message_time && (
                <div className="conv-time">
                  {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                </div>
              )}
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="empty-state">No conversations yet.<br />Click "New Chat" to start one.</div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {activeConversation ? (
          <>
            <div className="chat-header">
              <div className="avatar large">{activeConversation.other_party_name?.charAt(0).toUpperCase()}</div>
              <div>
                <div className="chat-header-name">{activeConversation.other_party_name}</div>
                <div className="chat-header-role">
                  {activeConversation.other_party_role === 'provider' ? 'Service Provider' : 
                   activeConversation.other_party_role === 'admin' ? 'Admin' : 'Customer'}
                </div>
              </div>
            </div>
            <div className="messages-area">
              {messages.map(msg => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`message ${isOwn ? 'own' : 'other'}`}>
                    <div className="message-bubble">
                      <p>{msg.message}</p>
                      <div className="message-time">{formatMessageTime(msg.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              {otherUserTyping && (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form className="message-input-form" onSubmit={sendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyUp={handleTypingStart}
                placeholder="Type a message..."
              />
              <button type="submit" disabled={!newMessage.trim()}>Send</button>
            </form>
          </>
        ) : (
          <div className="empty-chat">
            <div className="empty-icon">💬</div>
            <h3>No conversation selected</h3>
            <p>Choose a chat from the sidebar or start a new one</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Start a new conversation</h3>
            <div className="users-list">
              {availableUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelectedRecipient(u)}
                  className={`user-item ${selectedRecipient?.id === u.id ? 'selected' : ''}`}
                >
                  <div className="avatar small">{u.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div>{u.name}</div>
                    <div className="user-role">{u.role}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowNewChatModal(false)}>Cancel</button>
              <button onClick={startNewConversation} disabled={!selectedRecipient}>Start Chat</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* GLOBAL RESET / BASE */
        .chat-container {
          display: flex;
          height: 100vh;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%);
        }
        /* SIDEBAR */
        .chat-sidebar {
          width: 320px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
          z-index: 20;
          box-shadow: 4px 0 20px rgba(0,0,0,0.05);
        }
        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sidebar-header h2 {
          margin: 0;
          font-size: 1.5rem;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .new-chat-btn {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border: none;
          color: white;
          padding: 8px 14px;
          border-radius: 40px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
        }
        .new-chat-btn:hover { transform: scale(1.02); opacity: 0.9; }
        .conversations-list {
          flex: 1;
          overflow-y: auto;
        }
        .conversation-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }
        .conversation-item:hover { background: rgba(99,102,241,0.05); }
        .conversation-item.active {
          background: linear-gradient(90deg, rgba(99,102,241,0.1), transparent);
          border-left-color: #6366f1;
        }
        .avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .avatar.large { width: 56px; height: 56px; font-size: 1.5rem; }
        .avatar.small { width: 40px; height: 40px; font-size: 1rem; }
        .conv-info { flex: 1; min-width: 0; }
        .conv-name { font-weight: 600; color: #1f2937; }
        .conv-last-msg { font-size: 0.8rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-time { font-size: 0.7rem; color: #9ca3af; }
        .empty-state { padding: 30px 20px; text-align: center; color: #9ca3af; font-size: 0.9rem; }

        /* MAIN CHAT */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(255,255,255,0.4);
          backdrop-filter: blur(4px);
        }
        .chat-header {
          padding: 16px 24px;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .chat-header-name { font-weight: 700; color: #1f2937; }
        .chat-header-role { font-size: 0.75rem; color: #6b7280; text-transform: capitalize; }
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .message { display: flex; }
        .message.own { justify-content: flex-end; }
        .message-bubble {
          max-width: 70%;
          padding: 10px 16px;
          border-radius: 24px;
          background: white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .own .message-bubble {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: white;
        }
        .message-time {
          font-size: 0.65rem;
          margin-top: 4px;
          opacity: 0.7;
          text-align: right;
        }
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 8px 16px;
          background: white;
          width: fit-content;
          border-radius: 40px;
          margin-top: 8px;
        }
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .message-input-form {
          padding: 16px 24px;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          border-top: 1px solid rgba(0,0,0,0.05);
          display: flex;
          gap: 12px;
        }
        .message-input-form input {
          flex: 1;
          padding: 12px 20px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 40px;
          background: white;
          outline: none;
          font-size: 0.9rem;
        }
        .message-input-form input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
        .message-input-form button {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border: none;
          color: white;
          padding: 0 24px;
          border-radius: 40px;
          font-weight: 500;
          cursor: pointer;
          transition: 0.2s;
        }
        .message-input-form button:disabled { opacity: 0.5; cursor: not-allowed; }
        .empty-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #9ca3af;
        }
        .empty-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
        .empty-chat h3 { margin: 0; color: #4b5563; }
        .empty-chat p { margin-top: 8px; font-size: 0.9rem; }

        /* MODAL */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 28px;
          width: 400px;
          max-width: 90%;
          padding: 24px;
          box-shadow: 0 20px 35px rgba(0,0,0,0.2);
        }
        .modal-content h3 { margin-top: 0; color: #1f2937; }
        .users-list { max-height: 300px; overflow-y: auto; margin: 20px 0; }
        .user-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 16px;
          cursor: pointer;
          transition: 0.1s;
        }
        .user-item:hover { background: #f3f4f6; }
        .user-item.selected { background: #e0e7ff; }
        .user-role { font-size: 0.7rem; color: #6b7280; text-transform: capitalize; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
        .modal-actions button {
          padding: 8px 16px;
          border-radius: 40px;
          border: none;
          cursor: pointer;
        }
        .modal-actions button:first-child { background: #f3f4f6; }
        .modal-actions button:last-child { background: #6366f1; color: white; }
        .modal-actions button:disabled { opacity: 0.5; }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .chat-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            height: 100%;
            transform: translateX(-100%);
          }
          .chat-sidebar.open { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}