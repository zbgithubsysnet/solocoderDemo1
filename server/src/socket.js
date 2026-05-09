import { v4 as uuidv4 } from 'uuid';
import {
  getDB,
  saveMessage,
  getPublicMessages,
  getPrivateMessages,
  upsertUser,
  setUserOffline,
  getOnlineUsers,
  getAllUsers
} from './db.js';

const connectedUsers = new Map();

export function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', async (data) => {
      const { name } = data;
      const userId = socket.id;
      
      try {
        const db = await getDB();
        await upsertUser(db, { id: userId, name });
        
        socket.user = { id: userId, name };
        connectedUsers.set(userId, { socket, name });
        
        const publicMessages = await getPublicMessages(db);
        const onlineUsers = await getOnlineUsers(db);
        
        socket.emit('joined', {
          userId,
          name,
          publicMessages,
          onlineUsers
        });
        
        socket.broadcast.emit('userJoined', {
          id: userId,
          name,
          isOnline: true
        });
      } catch (error) {
        console.error('Join error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    socket.on('getUsers', async () => {
      try {
        const db = await getDB();
        const users = await getAllUsers(db);
        socket.emit('usersList', users);
      } catch (error) {
        console.error('Get users error:', error);
      }
    });

    socket.on('publicMessage', async (data) => {
      if (!socket.user) return;
      
      const message = {
        id: uuidv4(),
        type: 'public',
        content: data.content,
        senderId: socket.user.id,
        senderName: socket.user.name,
        createdAt: new Date().toISOString()
      };

      try {
        const db = await getDB();
        await saveMessage(db, message);
        
        io.emit('publicMessage', message);
      } catch (error) {
        console.error('Public message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('privateMessage', async (data) => {
      if (!socket.user) return;
      
      const message = {
        id: uuidv4(),
        type: 'private',
        content: data.content,
        senderId: socket.user.id,
        senderName: socket.user.name,
        recipientId: data.recipientId,
        recipientName: data.recipientName,
        createdAt: new Date().toISOString()
      };

      try {
        const db = await getDB();
        await saveMessage(db, message);
        
        socket.emit('privateMessage', message);
        
        const recipient = connectedUsers.get(data.recipientId);
        if (recipient) {
          recipient.socket.emit('privateMessage', message);
        }
      } catch (error) {
        console.error('Private message error:', error);
        socket.emit('error', { message: 'Failed to send private message' });
      }
    });

    socket.on('getPrivateHistory', async (data) => {
      if (!socket.user) return;
      
      try {
        const db = await getDB();
        const messages = await getPrivateMessages(db, socket.user.id, data.userId);
        socket.emit('privateHistory', {
          userId: data.userId,
          messages
        });
      } catch (error) {
        console.error('Get private history error:', error);
      }
    });

    socket.on('typing', (data) => {
      if (!socket.user) return;
      
      if (data.recipientId) {
        const recipient = connectedUsers.get(data.recipientId);
        if (recipient) {
          recipient.socket.emit('typing', {
            userId: socket.user.id,
            name: socket.user.name,
            isPrivate: true
          });
        }
      } else {
        socket.broadcast.emit('typing', {
          userId: socket.user.id,
          name: socket.user.name,
          isPrivate: false
        });
      }
    });

    socket.on('stopTyping', (data) => {
      if (!socket.user) return;
      
      if (data.recipientId) {
        const recipient = connectedUsers.get(data.recipientId);
        if (recipient) {
          recipient.socket.emit('stopTyping', {
            userId: socket.user.id,
            isPrivate: true
          });
        }
      } else {
        socket.broadcast.emit('stopTyping', {
          userId: socket.user.id,
          isPrivate: false
        });
      }
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      
      if (socket.user) {
        try {
          const db = await getDB();
          await setUserOffline(db, socket.user.id);
          connectedUsers.delete(socket.user.id);
          
          io.emit('userLeft', {
            id: socket.user.id,
            name: socket.user.name
          });
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      }
    });
  });
}

export function getConnectedUsers() {
  return connectedUsers;
}
