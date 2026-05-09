import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import { LoginForm } from './components/LoginForm';
import { OnlineUsers } from './components/OnlineUsers';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { PrivateChatWindow } from './components/PrivateChatWindow';
import './App.css';

function App() {
  const {
    isConnected,
    isJoining,
    reconnectAttempts,
    error: socketError,
    join,
    sendPublicMessage,
    sendPrivateMessage,
    getPrivateHistory,
    typing,
    stopTyping,
    on,
    off
  } = useSocket();

  const [currentUser, setCurrentUser] = useState(null);
  const [publicMessages, setPublicMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  const [privateMessages, setPrivateMessages] = useState({});
  const [unreadPrivateMessages, setUnreadPrivateMessages] = useState({});
  const [publicTypingUsers, setPublicTypingUsers] = useState([]);
  const [privateTypingUsers, setPrivateTypingUsers] = useState({});

  const handleJoin = async (name) => {
    try {
      const data = await join(name);
      setCurrentUser({ id: data.userId, name: data.name });
      setPublicMessages(data.publicMessages);
      setUsers(data.onlineUsers);
    } catch (err) {
      console.error('Join error:', err);
    }
  };

  const handleStartPrivateChat = useCallback((user) => {
    setActivePrivateChat(user);
    setUnreadPrivateMessages(prev => ({
      ...prev,
      [user.id]: 0
    }));
    
    if (!privateMessages[user.id]) {
      getPrivateHistory(user.id);
    }
  }, [privateMessages, getPrivateHistory]);

  const handleSendPublicMessage = useCallback((content) => {
    sendPublicMessage(content);
  }, [sendPublicMessage]);

  const handleSendPrivateMessage = useCallback((recipientId, recipientName, content) => {
    sendPrivateMessage(recipientId, recipientName, content);
  }, [sendPrivateMessage]);

  useEffect(() => {
    if (!currentUser) return;

    const handlePublicMessage = (message) => {
      setPublicMessages(prev => [...prev, message]);
    };

    const handlePrivateMessage = (message) => {
      const otherUserId = message.senderId === currentUser.id 
        ? message.recipientId 
        : message.senderId;

      setPrivateMessages(prev => ({
        ...prev,
        [otherUserId]: [
          ...(prev[otherUserId] || []),
          message
        ]
      }));

      if (activePrivateChat?.id !== otherUserId && message.senderId !== currentUser.id) {
        setUnreadPrivateMessages(prev => ({
          ...prev,
          [otherUserId]: (prev[otherUserId] || 0) + 1
        }));
      }
    };

    const handlePrivateHistory = ({ userId, messages }) => {
      setPrivateMessages(prev => ({
        ...prev,
        [userId]: messages
      }));
    };

    const handleUserJoined = (user) => {
      setUsers(prev => {
        const exists = prev.find(u => u.id === user.id);
        if (exists) {
          return prev.map(u => u.id === user.id ? { ...u, ...user, isOnline: true } : u);
        }
        return [...prev, { ...user, isOnline: true }];
      });
    };

    const handleUserLeft = (user) => {
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, isOnline: false } : u
      ));
    };

    const handleTyping = ({ userId, name, isPrivate }) => {
      if (isPrivate) {
        setPrivateTypingUsers(prev => ({
          ...prev,
          [userId]: { userId, name }
        }));
      } else {
        setPublicTypingUsers(prev => {
          if (prev.find(u => u.userId === userId)) return prev;
          return [...prev, { userId, name }];
        });
      }
    };

    const handleStopTyping = ({ userId, isPrivate }) => {
      if (isPrivate) {
        setPrivateTypingUsers(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      } else {
        setPublicTypingUsers(prev => prev.filter(u => u.userId !== userId));
      }
    };

    on('publicMessage', handlePublicMessage);
    on('privateMessage', handlePrivateMessage);
    on('privateHistory', handlePrivateHistory);
    on('userJoined', handleUserJoined);
    on('userLeft', handleUserLeft);
    on('typing', handleTyping);
    on('stopTyping', handleStopTyping);

    return () => {
      off('publicMessage', handlePublicMessage);
      off('privateMessage', handlePrivateMessage);
      off('privateHistory', handlePrivateHistory);
      off('userJoined', handleUserJoined);
      off('userLeft', handleUserLeft);
      off('typing', handleTyping);
      off('stopTyping', handleStopTyping);
    };
  }, [currentUser, activePrivateChat, on, off]);

  if (!currentUser) {
    return (
      <LoginForm 
        onJoin={handleJoin} 
        isJoining={isJoining}
        error={socketError}
      />
    );
  }

  const currentPrivateTypingUsers = activePrivateChat 
    ? Object.values(privateTypingUsers).filter(
        u => u.userId === activePrivateChat.id
      )
    : [];

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="app-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="app-title">
            <h1>实时聊天室</h1>
            <span className="user-info">你好, {currentUser.name}</span>
          </div>
        </div>
        <div className="header-right">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span>
              {isConnected 
                ? '已连接' 
                : reconnectAttempts > 0 
                  ? `重连中 (${reconnectAttempts})` 
                  : '未连接'
              }
            </span>
          </div>
        </div>
      </header>

      <OnlineUsers
        users={users}
        currentUserId={currentUser.id}
        unreadPrivateMessages={unreadPrivateMessages}
        onStartPrivateChat={handleStartPrivateChat}
        activePrivateChat={activePrivateChat}
      />

      <main className="main-content">
        <div className="chat-container">
          <div className="chat-header">
            <h2>公共聊天室</h2>
          </div>

          <MessageList
            messages={publicMessages}
            currentUserId={currentUser.id}
            typingUsers={publicTypingUsers}
            isPrivate={false}
          />

          <MessageInput
            onSend={handleSendPublicMessage}
            onTyping={() => typing()}
            onStopTyping={() => stopTyping()}
            placeholder="发送公共消息..."
            disabled={!isConnected}
          />
        </div>

        {activePrivateChat && (
          <PrivateChatWindow
            user={activePrivateChat}
            messages={privateMessages[activePrivateChat.id] || []}
            currentUserId={currentUser.id}
            typingUsers={currentPrivateTypingUsers}
            onSend={handleSendPrivateMessage}
            onTyping={typing}
            onStopTyping={stopTyping}
            onClose={() => setActivePrivateChat(null)}
            isConnected={isConnected}
          />
        )}
      </main>
    </div>
  );
}

export default App;
