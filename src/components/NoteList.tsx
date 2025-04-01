import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import NotePresenter, { NoteView } from '../presenters/NotePresenter';
import { Note } from '../services/DatabaseService';

const NoteList: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Create presenter instance
  const [presenter] = useState(() => new NotePresenter());
  
  // Implement NoteView interface
  const noteView: NoteView = {
    onNotesLoaded: (loadedNotes: Note[]) => {
      setNotes(loadedNotes);
    },
    onNoteAdded: (note: Note) => {
      setNotes(prevNotes => [note, ...prevNotes]);
    },
    onNoteUpdated: (note: Note) => {
      setNotes(prevNotes => 
        prevNotes.map(n => (n.id === note.id ? note : n))
      );
    },
    onNoteDeleted: (id: number) => {
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    }
  };
  
  // Connect presenter and view on mount
  useEffect(() => {
    presenter.setView(noteView);
    presenter.loadNotes();
    
    return () => {
      presenter.removeView();
    };
  }, [presenter]);
  
  // Handle adding a new note
  const handleAddNote = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setModalVisible(true);
  };
  
  // Handle editing an existing note
  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setModalVisible(true);
  };
  
  // Handle deleting a note with confirmation
  const handleDeleteNote = (id: number) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => presenter.deleteNote(id)
        }
      ]
    );
  };
  
  // Save the note (add or update)
  const saveNote = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title cannot be empty');
      return;
    }
    
    if (editingNote) {
      presenter.updateNote(editingNote.id!, title, content);
    } else {
      presenter.addNote(title, content);
    }
    
    setModalVisible(false);
  };
  
  // Render a single note item
  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteItem}
      onPress={() => handleEditNote(item)}
    >
      <View style={styles.noteContent}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text style={styles.notePreview} numberOfLines={2}>
          {item.content}
        </Text>
        <Text style={styles.noteDate}>
          {new Date(item.updatedAt!).toLocaleDateString()}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNote(item.id!)}
      >
        <Text style={styles.deleteButtonText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Secure Notes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddNote}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      {notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notes yet. Create your first secure note!</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={item => `note-${item.id}`}
          renderItem={renderNoteItem}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      {/* Modal for adding/editing notes */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingNote ? 'Edit Note' : 'Add Note'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          
          <TextInput
            style={styles.contentInput}
            placeholder="Content"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveNote}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2e7d32',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  noteItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  notePreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
    color: '#ff5252',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2e7d32',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: 'white',
  },
  titleInput: {
    backgroundColor: 'white',
    padding: 16,
    fontSize: 18,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  contentInput: {
    backgroundColor: 'white',
    padding: 16,
    fontSize: 16,
    margin: 16,
    flex: 1,
    borderRadius: 8,
    height: 200,
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NoteList; 