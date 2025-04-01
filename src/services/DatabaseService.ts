import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

// Enable SQLite debugging in development
SQLite.DEBUG(false);
SQLite.enablePromise(true);

export interface Note {
  id?: number;
  title: string;
  content: string;
  createdAt?: number;
  updatedAt?: number;
}

class DatabaseService {
  private database: SQLiteDatabase | null = null;
  private readonly DATABASE_NAME = 'SecureNotes_Plain.db'; // New database name to avoid conflicts
  private readonly TABLE_NAME = 'notes';

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    try {
      this.database = await SQLite.openDatabase({
        name: this.DATABASE_NAME,
        location: 'default',
      });

      await this.createTables();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw new Error('Failed to initialize database');
    }
  }

  /**
   * Create database tables if they don't exist
   */
  private async createTables(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const query = `
      CREATE TABLE IF NOT EXISTS ${this.TABLE_NAME} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `;

    await this.database.executeSql(query);
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = null;
    }
  }

  /**
   * Save a note - stores in the database
   */
  async saveNote(note: Note): Promise<number> {
    if (!this.database) {
      await this.init();
    }

    const timestamp = Date.now();

    if (note.id) {
      // Update existing note
      const updateQuery = `
        UPDATE ${this.TABLE_NAME}
        SET title = ?,
            content = ?,
            updatedAt = ?
        WHERE id = ?
      `;

      await this.database!.executeSql(updateQuery, [
        note.title,
        note.content,
        timestamp,
        note.id,
      ]);

      return note.id;
    } else {
      // Insert new note
      const insertQuery = `
        INSERT INTO ${this.TABLE_NAME} (
          title,
          content,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?)
      `;

      const [result] = await this.database!.executeSql(insertQuery, [
        note.title,
        note.content,
        timestamp,
        timestamp,
      ]);

      return result.insertId!;
    }
  }

  /**
   * Get a single note by ID
   */
  async getNote(id: number): Promise<Note | null> {
    if (!this.database) {
      await this.init();
    }

    const query = `SELECT * FROM ${this.TABLE_NAME} WHERE id = ?`;
    const [results] = await this.database!.executeSql(query, [id]);

    if (results.rows.length === 0) {
      return null;
    }

    return results.rows.item(0) as Note;
  }

  /**
   * Get all notes
   */
  async getAllNotes(): Promise<Note[]> {
    if (!this.database) {
      await this.init();
    }

    const query = `SELECT * FROM ${this.TABLE_NAME} ORDER BY updatedAt DESC`;
    const [results] = await this.database!.executeSql(query, []);

    const notes: Note[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const note = results.rows.item(i) as Note;
      notes.push(note);
    }

    return notes;
  }

  /**
   * Delete a note by ID
   */
  async deleteNote(id: number): Promise<void> {
    if (!this.database) {
      await this.init();
    }

    const query = `DELETE FROM ${this.TABLE_NAME} WHERE id = ?`;
    await this.database!.executeSql(query, [id]);
  }

  /**
   * Reset the database for development purposes
   * WARNING: This will delete all notes
   */
  async resetDatabase(): Promise<void> {
    if (!this.database) {
      await this.init();
    }

    try {
      // Drop the notes table
      const dropQuery = `DROP TABLE IF EXISTS ${this.TABLE_NAME}`;
      await this.database!.executeSql(dropQuery);
      
      // Create a fresh table
      await this.createTables();
      
      console.log('Database has been reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw new Error('Failed to reset database');
    }
  }
}

export default new DatabaseService(); 