import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'dayront-workspace';
const STORE_NAME = 'files';

let db: IDBPDatabase;

async function getDB() {
  if (!db) {
    db = await openDB(DB_NAME, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-expiry', 'expiry');
        }
      },
    });
  }
  return db;
}

export async function saveFile(id: string, blob: Blob, ttlMs = 24 * 60 * 60 * 1000) {
  const database = await getDB();
  await database.put(STORE_NAME, { id, blob, expiry: Date.now() + ttlMs });
}

export async function getFile(id: string): Promise<Blob | undefined> {
  const database = await getDB();
  const record = await database.get(STORE_NAME, id);
  if (!record) return undefined;
  if (Date.now() > record.expiry) {
    await database.delete(STORE_NAME, id);
    return undefined;
  }
  return record.blob;
}

export async function cleanExpired() {
  const database = await getDB();
  const tx = database.transaction(STORE_NAME, 'readwrite');
  const index = tx.store.index('by-expiry');
  let cursor = await index.openCursor(IDBKeyRange.upperBound(Date.now()));
  while (cursor) {
    cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}