const DB_NAME = "silopay";
const STORE = "comprovantes";

export type QueuedReceipt = {
  id: string;
  companyId: string;
  employeeId: string;
  amountReais: string;
  category: string;
  placeNote: string;
  storagePath: string;
  file: Blob;
  createdAt: string;
  lastError: string | null;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("fila indisponivel"));
  });
}

export async function saveQueuedReceipt(item: QueuedReceipt): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("fila indisponivel"));
  });
  db.close();
  window.dispatchEvent(new Event("silopay-outbox"));
}

export async function listQueuedReceipts(employeeId: string): Promise<QueuedReceipt[]> {
  const db = await openDb();
  const rows = await new Promise<QueuedReceipt[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as QueuedReceipt[]).filter((row) => row.employeeId === employeeId));
    request.onerror = () => reject(request.error ?? new Error("fila indisponivel"));
  });
  db.close();
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function removeQueuedReceipt(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("fila indisponivel"));
  });
  db.close();
  window.dispatchEvent(new Event("silopay-outbox"));
}
