declare module 'react-native-sqlite-storage' {
  export interface SQLiteDatabase {
    transaction(txCallback: (tx: SQLiteTransaction) => void): Promise<void>;
    readTransaction(txCallback: (tx: SQLiteTransaction) => void): Promise<void>;
    executeSql(statement: string, params?: any[]): Promise<[SQLiteResultSet]>;
    close(): Promise<void>;
  }

  export interface SQLiteTransaction {
    executeSql(
      statement: string,
      params?: any[],
      success?: (tx: SQLiteTransaction, resultSet: SQLiteResultSet) => void,
      error?: (tx: SQLiteTransaction, error: Error) => void
    ): void;
  }

  export interface SQLiteResultSet {
    insertId?: number;
    rowsAffected: number;
    rows: {
      length: number;
      item(index: number): any;
      raw(): any[];
    };
  }

  export function openDatabase(
    options: {
      name: string;
      location?: string;
      createFromLocation?: number | string;
      key?: string;
      version?: string;
      readOnly?: boolean;
    } | string,
    success?: (db: SQLiteDatabase) => void,
    error?: (error: Error) => void
  ): Promise<SQLiteDatabase>;

  export function deleteDatabase(
    options: { name: string; location?: string } | string,
    success?: () => void,
    error?: (error: Error) => void
  ): Promise<void>;

  export function enablePromise(enable: boolean): void;
  export function DEBUG(debug: boolean): void;

  export default {
    openDatabase,
    deleteDatabase,
    enablePromise,
    DEBUG,
  };
} 