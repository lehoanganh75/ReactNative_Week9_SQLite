import * as SQLite from 'expo-sqlite';

let db = null;

const generateId = () => Date.now().toString() + Math.floor(Math.random() * 1000);

export const initDatabase = async () => {
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync('tasks.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          status BOOLEAN DEFAULT 0,
          edit BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0
        );
      `);
      console.log('Database initialized successfully');
    }
    return db;
  } catch (error) {
    console.log('Error initializing database:', error);
    throw error;
  }
};

export const getTasks = async () => {
  try {
    const database = await initDatabase();
    const results = await database.getAllAsync('SELECT * FROM tasks ORDER BY created_at DESC;');
    return results;
  } catch (error) {
    console.log('Error getting tasks:', error);
    throw error;
  }
};

export const addTask = async (email) => {
  try {
    const database = await initDatabase();
    const id = generateId();
    await database.runAsync(
      'INSERT INTO tasks (id, email, status, synced) VALUES (?, ?, ?, ?);',
      [id, email, 0, 0]
    );
    return id;
  } catch (error) {
    console.log('Error adding task:', error);
    throw error;
  }
};

export const updateTaskStatus = async (id, status) => {
  try {
    const database = await initDatabase();
    const result = await database.runAsync(
      'UPDATE tasks SET status = ?, synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
      [status ? 1 : 0, id]
    );
    return result.changes;
  } catch (error) {
    console.log('Error updating task status:', error);
    throw error;
  }
};

export const updateTaskEmail = async (id, email) => {
  try {
    const database = await initDatabase();
    const result = await database.runAsync(
      'UPDATE tasks SET email = ?, synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
      [email, id]
    );
    return result.changes;
  } catch (error) {
    console.log('Error updating task email:', error);
    throw error;
  }
};

export const deleteTask = async (id) => {
  try {
    const database = await initDatabase();
    const result = await database.runAsync('DELETE FROM tasks WHERE id = ?;', [id]);
    return result.changes;
  } catch (error) {
    console.log('Error deleting task:', error);
    throw error;
  }
};

export const resetDatabase = async () => {
  try {
    const database = await initDatabase();
    await database.execAsync('DROP TABLE IF EXISTS tasks;');
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        status BOOLEAN DEFAULT 0,
        edit BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
    `);
    console.log('Database reset successfully');
  } catch (error) {
    console.log('Error resetting database:', error);
    throw error;
  }
};
