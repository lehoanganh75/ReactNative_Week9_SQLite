import axios from 'axios';
import * as SQLite from 'expo-sqlite';

const API_URL = 'https://68fde7347c700772bb123de5.mockapi.io/api/data';
let db = null;

const getDB = async () => {
  if (!db) db = await SQLite.openDatabaseAsync('tasks.db');
  return db;
};

export const syncUp = async () => {
  const database = await getDB();
  const unsynced = await database.getAllAsync('SELECT * FROM tasks WHERE synced = 0;');
  for (const task of unsynced) {
    try {
      await axios.post(API_URL, task);
      await database.runAsync('UPDATE tasks SET synced = 1 WHERE id = ?;', [task.id]);
      console.log(`Synced task ${task.id}`);
    } catch (error) {
      console.error('SyncUp error:', error.message);
    }
  }
};

export const syncDown = async () => {
  try {
    const database = await getDB();
    const response = await axios.get(API_URL);
    const tasks = response.data;
    for (const t of tasks) {
      await database.runAsync(
        `INSERT OR REPLACE INTO tasks 
          (id, email, status, edit, created_at, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, ?, 1);`,
        [t.id, t.email, t.status, t.edit, t.created_at, t.updated_at]
      );
    }
    console.log(`Downloaded ${tasks.length} tasks from cloud`);
  } catch (error) {
    console.error('SyncDown error:', error.message);
  }
};

export const syncAll = async () => {
  console.log('Starting sync...');
  await syncUp();
  await syncDown();
  console.log('Sync complete');
};
