import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function PrivateChatWindow({ 
  user, 
  messages, 
  currentUserId, 
  typingUsers,
  onSend,
  onTyping,
  onStopTyping,
  onClose,
  isConnected
}) {
  if (!user) return null;

  const handleSend = (content) => {
    onSend(user.id, user.name, content);
  };

  const handleTyping = () => {
    onTyping(user.id);
  };

  const handleStopTyping = () => {
    onStopTyping(user.id);
  };

  return (
    <div className="private-chat-window">
      <div className="private-chat-header">
        <div className="private-chat-info">
          <span className="status-dot"></span>
          <span className="private-chat-name">与 {user.name} 私聊</span>
        </div>
        <button 
          className="close-private-chat"
          onClick={onClose}
          aria-label="关闭私聊"
        >
          &times;
        </button>
      </div>

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
        isPrivate={true}
      />

      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        placeholder={`给 ${user.name} 发送消息...`}
        disabled={!isConnected || !user.isOnline}
      />

      {!user.isOnline && (
        <div className="offline-notice">
          {user.name} 目前离线，消息将在其上线后发送
        </div>
      )}
    </div>
  );
}
