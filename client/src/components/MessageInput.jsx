import { useState, useEffect, useRef } from 'react';

export function MessageInput({ onSend, onTyping, onStopTyping, placeholder, disabled }) {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [placeholder]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      onTyping();
    } else {
      onStopTyping();
    }

    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 2000);
  };

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    
    onSend(message.trim());
    setMessage('');
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onStopTyping();
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="message-input">
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || '输入消息...'}
        disabled={disabled}
      />
      <button 
        onClick={handleSend}
        disabled={!message.trim() || disabled}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
  );
}
