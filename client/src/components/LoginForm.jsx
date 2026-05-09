import { useState } from 'react';

export function LoginForm({ onJoin, isJoining, error }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>实时聊天室</h1>
        <p>
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="输入您的昵称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isJoining}
            maxLength={20}
            autoFocus
          />
          <button type="submit" disabled={isJoining || !name.trim()}>
            {isJoining ? '加入中...' : '加入聊天'}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}
