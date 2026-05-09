import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [error, setError] = useState(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('连接服务器失败，请检查网络');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setReconnectAttempts(0);
      setIsConnected(true);
      setError(null);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnect attempt:', attemptNumber);
      setReconnectAttempts(attemptNumber);
    });

    socket.on('error', (data) => {
      setError(data.message || '发生错误');
    });

    socketRef.current = socket;
    
    if (typeof window !== 'undefined') {
      window.socketInstance = socket;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const join = useCallback((name) => {
    if (!socketRef.current) return Promise.reject('未连接到服务器');
    
    setIsJoining(true);
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        setIsJoining(false);
        reject(new Error('加入聊天超时'));
      }, 10000);

      socketRef.current.once('joined', (data) => {
        clearTimeout(timeoutId);
        setIsJoining(false);
        resolve(data);
      });

      socketRef.current.once('error', (err) => {
        clearTimeout(timeoutId);
        setIsJoining(false);
        reject(new Error(err.message));
      });

      socketRef.current.emit('join', { name });
    });
  }, []);

  const sendPublicMessage = useCallback((content) => {
    if (!socketRef.current) return;
    socketRef.current.emit('publicMessage', { content });
  }, []);

  const sendPrivateMessage = useCallback((recipientId, recipientName, content) => {
    if (!socketRef.current) return;
    socketRef.current.emit('privateMessage', { 
      recipientId, 
      recipientName, 
      content 
    });
  }, []);

  const getPrivateHistory = useCallback((userId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('getPrivateHistory', { userId });
  }, []);

  const typing = useCallback((recipientId = null) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing', { recipientId });
  }, []);

  const stopTyping = useCallback((recipientId = null) => {
    if (!socketRef.current) return;
    socketRef.current.emit('stopTyping', { recipientId });
  }, []);

  const getUsers = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('getUsers');
  }, []);

  const on = useCallback((event, handler) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    if (!socketRef.current) return;
    socketRef.current.off(event, handler);
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    isJoining,
    reconnectAttempts,
    error,
    connect,
    disconnect,
    join,
    sendPublicMessage,
    sendPrivateMessage,
    getPrivateHistory,
    typing,
    stopTyping,
    getUsers,
    on,
    off
  };
}
