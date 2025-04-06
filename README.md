# SecureNotes

A secure note-taking app built with React Native utilizing MVP architecture and encrypted local storage.

## Security Features

- **Encryption**: All notes are encrypted using AES-256-CBC encryption before storing in SQLite
- **Secure Key Management**: Encryption keys are stored securely in the device keychain
- **Biometric Authentication**: (Optional) Supports fingerprint/face authentication to access the app
- **Secure Salt Handling**: Generates and stores secure random salt for key derivation

## Architecture

The app follows the Model-View-Presenter (MVP) pattern:

- **Model**: Encrypted data stored in SQLite database
- **View**: React Native components (NoteList.tsx)
- **Presenter**: Business logic that connects views to data (NotePresenter.ts)

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. (iOS only) Install CocoaPods: `cd ios && pod install && cd ..`
4. Run the app:
   - Android: `npm run android`
   - iOS: `npm run ios`

## Usage

### Basic Features

- View a list of all notes
- Create a new note with title and content
- Edit existing notes
- Delete notes

### Security Settings

- Enable/disable biometric authentication from the settings menu (gear icon)
- The app automatically encrypts all note data before storage
- Encryption keys are securely stored in the device keychain

## Verification Steps

To verify the security implementations:

### Encryption Verification

1. Add a note in the app
2. Use a SQLite browser to examine the database file
3. Confirm that title and content are stored in encrypted form

### Biometric Authentication

1. Enable biometric authentication in the settings
2. Close and reopen the app
3. Verify that authentication is required to access notes

### Key Management

1. Use the app to create and view notes
2. Check the device keychain (using a keychain viewer or debugging tools)
3. Verify the presence of SecureNotes encryption keys

## Troubleshooting

If you encounter issues with encryption or database access:

1. Enable the database reset flag (`RESET_DATABASE_ON_START` in App.tsx) to true
2. Run the app once to reset the database and encryption keys
3. Set the flag back to false and restart the app

## Libraries Used

- React Native
- TypeScript
- react-native-sqlite-storage
- react-native-keychain
- react-native-aes-crypto
- @react-native-async-storage/async-storage

## Notes for Testing

- In development, you can reset the database and encryption keys by setting the `RESET_DATABASE_ON_START` constant to `true` in App.tsx
- The app includes error handling to gracefully handle decryption failures
- Biometric authentication can be bypassed if the device doesn't support it

## Security Considerations

- The app uses secure storage for encryption keys
- All data is encrypted before being stored in SQLite
- Biometric authentication adds an additional layer of security
- Salt for key derivation is randomly generated and securely stored
