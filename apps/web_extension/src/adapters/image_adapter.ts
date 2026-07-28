/**
 * apps/web_extension/src/adapters/image_adapter.ts
 * 高清图片如果在 Chrome Extension 里存成 Base64，很容易打爆 chrome.storage 的配额限制。因此，我们在适配器里封装了浏览器标准的 IndexedDB
 */
import type { IImageStorageAdapter } from '@clear-vibe/core_storage/src/types.ts';

/**
 * 基于浏览器 IndexedDB 的高清图片存储适配器
 */
export class IndexedDbImageAdapter implements IImageStorageAdapter {
    private readonly DB_NAME = 'clear_vibe_db';
    private readonly STORE_NAME = 'user_images';
    private readonly DB_VERSION = 1;

    /**
     * 私有辅助方法：打开数据库
     */
    private async openDb(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };

            request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
            request.onerror = (event) => reject(new Error(`IndexedDB open failed: ${(event.target as IDBOpenDBRequest).error?.message}`));
        });
    }

    public async saveImage(imageId: string, base64Data: string): Promise<void> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.put(base64Data, imageId); // ID作为Key存入

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to save image to IndexedDB.'));
        });
    }

    public async getImage(imageId: string): Promise<string> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get(imageId);

            request.onsuccess = () => {
                const outResult = request.result;
                // 强契约抛错：如果找不到图片，直接抛出异常阻断流程，禁止静默失败
                if (!outResult) {
                    reject(new Error(`[ImageAdapter] Image with ID '${imageId}' not found in database.`));
                } else {
                    resolve(outResult as string);
                }
            };

            request.onerror = () => {
                reject(new Error('[ImageAdapter] Failed to read from IndexedDB.'));
            };
        });
    }
}