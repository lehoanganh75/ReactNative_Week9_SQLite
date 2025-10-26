import * as SQLite from 'expo-sqlite';

let db = null;

export const initDatabase = async () => {
  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync('tasks.db');
      
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          status BOOLEAN DEFAULT 0,
          edit BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

// SỬA TÊN HÀM: gettasks -> getTasks
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
    const result = await database.runAsync(
      'INSERT INTO tasks (email, status) VALUES (?, ?);',
      [email, false]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.log('Error adding task:', error);
    throw error;
  }
};

// SỬA TÊN HÀM: updatetaskstatus -> updateTaskStatus
export const updateTaskStatus = async (id, status) => {
  try {
    const database = await initDatabase();
    const result = await database.runAsync(
      'UPDATE tasks SET status = ? WHERE id = ?;',
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
      'UPDATE tasks SET email = ? WHERE id = ?;',
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
    const result = await database.runAsync(
      'DELETE FROM tasks WHERE id = ?;',
      [id]
    );
    return result.changes;
  } catch (error) {
    console.log('Error deleting task:', error);
    throw error;
  }
};

// Hàm reset database
export const resetDatabase = async () => {
  try {
    const database = await initDatabase();
    await database.execAsync('DROP TABLE IF EXISTS tasks;');
    console.log('Table tasks dropped successfully');
    
    // Tạo lại bảng
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        status BOOLEAN DEFAULT 0,
        edit BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table tasks created successfully');
  } catch (error) {
    console.log('Error resetting database:', error);
    throw error;
  }
};