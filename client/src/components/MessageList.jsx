import { useEffect, useRef } from 'react';

export function MessageList({ messages, currentUserId, typingUsers, isPrivate }) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOwnMessage = (msg) => msg.senderId === currentUserId;

  if (messages.length === 0) {
    return (
      <div className="message-list" ref={containerRef}>
        <div className="empty-messages">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <p>{isPrivate ? '开始私聊吧！' : '欢迎来到聊天室！发送第一条消息吧。'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list" ref={containerRef}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message ${isOwnMessage(msg) ? 'own' : 'other'} ${msg.type === 'private' ? 'private' : 'public'}`}
          data-message-id={msg.id}
        >
          {!isOwnMessage(msg) && (
            <div className="message-header">
              <span className="sender-name">{msg.senderName}</span>
              <span className="message-time">{formatTime(msg.createdAt)}</span>
            </div>
          )}
          <div className="message-content">
            {msg.content}
          </div>
          {isOwnMessage(msg) && (
            <span className="message-time">{formatTime(msg.createdAt)}</span>
          )}
        </div>
      ))}
      
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span>
            {typingUsers.length === 1 
              ? `${typingUsers[0].name} 正在输入...` 
              : `${typingUsers.length} 人正在输入...`
            }
          </span>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
