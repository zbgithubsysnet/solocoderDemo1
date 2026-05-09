import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '..', 'database');
const dbPath = process.env.DB_PATH || path.join(dbDir, 'chat.db');

async function initDB() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      recipient_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      is_online BOOLEAN DEFAULT 1,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
    CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online);
  `);

  return db;
}

let dbInstance = null;

export async function getDB() {
  if (!dbInstance) {
    dbInstance = await initDB();
  }
  return dbInstance;
}

export async function saveMessage(db, message) {
  await db.run(
    `INSERT INTO messages (id, type, content, sender_id, sender_name, recipient_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [message.id, message.type, message.content, message.senderId, message.senderName, message.recipientId || null]
  );
}

export async function getPublicMessages(db, limit = 100) {
  return await db.all(
    `SELECT id, type, content, sender_id AS senderId, sender_name AS senderName, 
            recipient_id AS recipientId, created_at AS createdAt
     FROM messages 
     WHERE type = 'public' 
     ORDER BY created_at DESC 
     LIMIT ?`,
    [limit]
  ).then(rows => rows.reverse());
}

export async function getPrivateMessages(db, userId1, userId2, limit = 100) {
  return await db.all(
    `SELECT id, type, content, sender_id AS senderId, sender_name AS senderName, 
            recipient_id AS recipientId, created_at AS createdAt
     FROM messages 
     WHERE type = 'private' 
     AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
     ORDER BY created_at DESC 
     LIMIT ?`,
    [userId1, userId2, userId2, userId1, limit]
  ).then(rows => rows.reverse());
}

export async function upsertUser(db, user) {
  await db.run(
    `INSERT INTO users (id, name, is_online, last_seen)
     VALUES (?, ?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(name) DO UPDATE SET 
       id = excluded.id,
       is_online = 1,
       last_seen = CURRENT_TIMESTAMP`,
    [user.id, user.name]
  );
}

export async function setUserOffline(db, userId) {
  await db.run(
    `UPDATE users SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?`,
    [userId]
  );
}

export async function getOnlineUsers(db) {
  return await db.all(
    `SELECT id, name, is_online AS isOnline, last_seen AS lastSeen
     FROM users 
     WHERE is_online = 1
     ORDER BY name`
  );
}

export async function getAllUsers(db) {
  return await db.all(
    `SELECT id, name, is_online AS isOnline, last_seen AS lastSeen
     FROM users 
     ORDER BY is_online DESC, name`
  );
}
