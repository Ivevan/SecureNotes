import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import EncryptionService from './EncryptionService';

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

export interface EncryptedNote {
  id?: number;
  titleEncrypted: string;
  titleIv: string;
  contentEncrypted: string;
  contentIv: string;
  createdAt: number;
  updatedAt: number;
}

class DatabaseService {
  private database: SQLiteDatabase | null = null;
  private readonly DATABASE_NAME = 'SecureNotes.db';
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
        titleEncrypted TEXT NOT NULL,
        titleIv TEXT NOT NULL,
        contentEncrypted TEXT NOT NULL,
        contentIv TEXT NOT NULL,
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
   * Save a note - encrypts and stores in the database
   */
  async saveNote(note: Note): Promise<number> {
    if (!this.database) {
      await this.init();
    }

    const timestamp = Date.now();
    
    // Encrypt the title and content
    const { encrypted: titleEncrypted, iv: titleIv } = await EncryptionService.encrypt(note.title);
    const { encrypted: contentEncrypted, iv: contentIv } = await EncryptionService.encrypt(note.content);

    const encryptedNote: EncryptedNote = {
      titleEncrypted,
      titleIv,
      contentEncrypted,
      contentIv,
      createdAt: note.createdAt || timestamp,
      updatedAt: timestamp,
    };

    if (note.id) {
      // Update existing note
      const updateQuery = `
        UPDATE ${this.TABLE_NAME}
        SET titleEncrypted = ?,
            titleIv = ?,
            contentEncrypted = ?,
            contentIv = ?,
            updatedAt = ?
        WHERE id = ?
      `;

      await this.database!.executeSql(updateQuery, [
        encryptedNote.titleEncrypted,
        encryptedNote.titleIv,
        encryptedNote.contentEncrypted,
        encryptedNote.contentIv,
        encryptedNote.updatedAt,
        note.id,
      ]);

      return note.id;
    } else {
      // Insert new note
      const insertQuery = `
        INSERT INTO ${this.TABLE_NAME} (
          titleEncrypted,
          titleIv,
          contentEncrypted,
          contentIv,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await this.database!.executeSql(insertQuery, [
        encryptedNote.titleEncrypted,
        encryptedNote.titleIv,
        encryptedNote.contentEncrypted,
        encryptedNote.contentIv,
        encryptedNote.createdAt,
        encryptedNote.updatedAt,
      ]);

      return result.insertId!;
    }
  }

  /**
   * Get a single note by ID - decrypts the note data
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

    const encryptedNote = results.rows.item(0) as EncryptedNote;
    return this.decryptNote(encryptedNote);
  }

  /**
   * Get all notes - decrypts all note data
   */
  async getAllNotes(): Promise<Note[]> {
    if (!this.database) {
      await this.init();
    }

    const query = `SELECT * FROM ${this.TABLE_NAME} ORDER BY updatedAt DESC`;
    const [results] = await this.database!.executeSql(query, []);

    const notes: Note[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const encryptedNote = results.rows.item(i) as EncryptedNote;
      try {
        const note = await this.decryptNote(encryptedNote);
        notes.push(note);
      } catch (error) {
        console.error(`Error decrypting note id ${encryptedNote.id}:`, error);
        // Skip this note if decryption fails
      }
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
   * Helper method to decrypt a note
   */
  private async decryptNote(encryptedNote: EncryptedNote): Promise<Note> {
    try {
      const title = await EncryptionService.decrypt(
        encryptedNote.titleEncrypted,
        encryptedNote.titleIv
      );
      
      const content = await EncryptionService.decrypt(
        encryptedNote.contentEncrypted,
        encryptedNote.contentIv
      );

      return {
        id: encryptedNote.id,
        title,
        content,
        createdAt: encryptedNote.createdAt,
        updatedAt: encryptedNote.updatedAt,
      };
    } catch (error) {
      console.error('Error decrypting note:', error);
      throw new Error('Failed to decrypt note data');
    }
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
      
      // Reset encryption keys
      await EncryptionService.resetEncryptionKey();
      
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