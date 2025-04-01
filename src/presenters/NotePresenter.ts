import DatabaseService, { Note } from '../services/DatabaseService';

export interface NoteView {
  onNotesLoaded(notes: Note[]): void;
  onNoteAdded(note: Note): void;
  onNoteUpdated(note: Note): void;
  onNoteDeleted(id: number): void;
  onError(error: Error): void;
}

class NotePresenter {
  private view: NoteView | null = null;
  
  /**
   * Set the view that this presenter will update
   */
  setView(view: NoteView): void {
    this.view = view;
  }
  
  /**
   * Remove the view reference
   */
  removeView(): void {
    this.view = null;
  }
  
  /**
   * Load all notes
   */
  async loadNotes(): Promise<void> {
    try {
      const notes = await DatabaseService.getAllNotes();
      if (this.view) {
        this.view.onNotesLoaded(notes);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Add a new note
   */
  async addNote(title: string, content: string): Promise<void> {
    try {
      const noteId = await DatabaseService.saveNote({ title, content });
      const note = await DatabaseService.getNote(noteId);
      
      if (note && this.view) {
        this.view.onNoteAdded(note);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Update an existing note
   */
  async updateNote(id: number, title: string, content: string): Promise<void> {
    try {
      await DatabaseService.saveNote({ id, title, content });
      const updatedNote = await DatabaseService.getNote(id);
      
      if (updatedNote && this.view) {
        this.view.onNoteUpdated(updatedNote);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Delete a note
   */
  async deleteNote(id: number): Promise<void> {
    try {
      await DatabaseService.deleteNote(id);
      
      if (this.view) {
        this.view.onNoteDeleted(id);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Handle errors by passing them to the view
   */
  private handleError(error: any): void {
    console.error('NotePresenter error:', error);
    if (this.view) {
      this.view.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export default NotePresenter; 