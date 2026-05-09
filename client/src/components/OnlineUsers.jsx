import { useState } from 'react';

export function OnlineUsers({ 
  users, 
  currentUserId, 
  unreadPrivateMessages,
  onStartPrivateChat,
  activePrivateChat 
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const onlineUsers = users.filter(u => u.isOnline && u.id !== currentUserId);
  const offlineUsers = users.filter(u => !u.isOnline && u.id !== currentUserId);

  const handleUserClick = (user) => {
    onStartPrivateChat(user);
    setIsSidebarOpen(false);
  };

  const renderUserItem = (user) => {
    const unread = unreadPrivateMessages[user.id] || 0;
    const isActive = activePrivateChat?.id === user.id;

    return (
      <div
        key={user.id}
        className={`user-item ${user.isOnline ? 'online' : 'offline'} ${isActive ? 'active' : ''}`}
        onClick={() => user.isOnline && handleUserClick(user)}
        title={user.isOnline ? `点击与 ${user.name} 私聊` : `${user.name} 离线`}
        data-user-id={user.id}
      >
        <div className="user-info">
          <span className="status-dot"></span>
          <span className="user-name">{user.name}</span>
        </div>
        {unread > 0 && (
          <span className="unread-badge">{unread}</span>
        )}
      </div>
    );
  };

  return (
    <>
      <button 
        className="sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span className="online-count">{onlineUsers.length}</span>
      </button>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>在线用户</h2>
          <button 
            className="close-sidebar"
            onClick={() => setIsSidebarOpen(false)}
          >
            &times;
          </button>
        </div>

        <div className="users-list">
          {onlineUsers.length > 0 ? (
            onlineUsers.map(renderUserItem)
          ) : (
            <p className="empty-text">暂无在线用户</p>
          )}
        </div>

        {offlineUsers.length > 0 && (
          <div className="offline-section">
            <h3>离线用户</h3>
            <div className="users-list">
              {offlineUsers.map(renderUserItem)}
            </div>
          </div>
        )}
      </aside>

      {isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}
