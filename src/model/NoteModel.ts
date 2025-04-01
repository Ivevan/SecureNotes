import DatabaseService, { Note } from '../services/DatabaseService';

class NoteModel {
  /**
   * Get all notes from the database
   */
  async getAllNotes(): Promise<Note[]> {
    try {
      return await DatabaseService.getAllNotes();
    } catch (error) {
      console.error('Error getting all notes:', error);
      throw error;
    }
  }

  /**
   * Get a single note by ID
   */
  async getNoteById(id: number): Promise<Note | null> {
    try {
      return await DatabaseService.getNote(id);
    } catch (error) {
      console.error(`Error getting note ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new note
   */
  async createNote(title: string, content: string): Promise<number> {
    try {
      return await DatabaseService.saveNote({
        title,
        content,
      });
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(id: number, title: string, content: string): Promise<void> {
    try {
      await DatabaseService.saveNote({
        id,
        title,
        content,
      });
    } catch (error) {
      console.error(`Error updating note ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(id: number): Promise<void> {
    try {
      await DatabaseService.deleteNote(id);
    } catch (error) {
      console.error(`Error deleting note ${id}:`, error);
      throw error;
    }
  }
}

export default new NoteModel(); 