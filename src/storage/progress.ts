export interface ArtworkProgressSnapshot {
  filled: number[]
  fillOrder: number[]
}

export interface SavedArtworkProgress extends ArtworkProgressSnapshot {
  artworkId: string
  artworkVersion: number
  updatedAt: number
  completedAt?: number
}

const DATABASE_NAME = 'arya-color'
const DATABASE_VERSION = 1
const PROGRESS_STORE = 'artwork-progress'

let databasePromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise
  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(PROGRESS_STORE)) {
        database.createObjectStore(PROGRESS_STORE, { keyPath: 'artworkId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return databasePromise
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadAllProgress(): Promise<SavedArtworkProgress[]> {
  const database = await openDatabase()
  const transaction = database.transaction(PROGRESS_STORE, 'readonly')
  return requestResult(transaction.objectStore(PROGRESS_STORE).getAll())
}

export async function saveArtworkProgress(progress: SavedArtworkProgress): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(PROGRESS_STORE, 'readwrite')
  await requestResult(transaction.objectStore(PROGRESS_STORE).put(progress))
}

export async function clearArtworkProgress(artworkId: string): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(PROGRESS_STORE, 'readwrite')
  await requestResult(transaction.objectStore(PROGRESS_STORE).delete(artworkId))
}

export async function requestPersistentStorage(): Promise<void> {
  if (navigator.storage?.persist) await navigator.storage.persist()
}
