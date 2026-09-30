/**
 * apps/web_extension/src/adapters/image_adapter.ts
 * 高清图片如果在 Chrome Extension 里存成 Base64，很容易打爆 chrome.storage 的配额限制。因此，我们在适配器里封装了浏览器标准的 IndexedDB
 */
import type { IImageStorageAdapter } from '@clear-vibe/core_storage';

/**
 * 基于浏览器 IndexedDB 的高清图片存储适配器
 */
export class IndexedDbImageAdapter implements IImageStorageAdapter {
    private readonly DB_NAME = 'clear_vibe_db';
    private readonly STORE_NAME = 'user_images';
    private readonly DB_VERSION = 1;
    /**
     * 同一适配器实例复用一个数据库连接，避免每次读写都创建新连接。
     * Promise 同时复用正在进行的首次打开操作，防止并发请求重复打开数据库。
     */
    private databasePromise: Promise<IDBDatabase> | null = null;

    /**
     * 打开并复用扩展 Origin 下的图片数据库。
     * 数据库发生版本升级时主动释放旧连接，避免阻塞后续升级事务。
     */
    private async openDb(): Promise<IDBDatabase> {
        if (this.databasePromise) {
            return this.databasePromise;
        }

        this.databasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };

            request.onsuccess = () => {
                const db = request.result;
                db.onversionchange = () => {
                    db.close();
                    this.databasePromise = null;
                };
                resolve(db);
            };

            request.onerror = () => {
                this.databasePromise = null;
                reject(new Error(`[ImageAdapter] IndexedDB open failed: ${request.error?.message ?? 'Unknown error.'}`));
            };
        });

        return this.databasePromise;
    }

    public async saveImage(imageId: string, base64Data: string): Promise<void> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            store.put(base64Data, imageId);

            // IDBRequest 成功不代表事务已经提交，必须等待 transaction.oncomplete。
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => {
                reject(new Error(`[ImageAdapter] Failed to save image: ${transaction.error?.message ?? 'Transaction failed.'}`));
            };
            transaction.onabort = () => {
                reject(new Error(`[ImageAdapter] Image save was aborted: ${transaction.error?.message ?? 'Transaction aborted.'}`));
            };
        });
    }

    public async getImage(imageId: string): Promise<string> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get(imageId);
            let storedImageData: unknown;

            request.onsuccess = () => {
                storedImageData = request.result as unknown;
            };

            transaction.oncomplete = () => {
                if (storedImageData === undefined) {
                    reject(new Error(`[ImageAdapter] Image with ID '${imageId}' not found in database.`));
                    return;
                }
                // 适配器保证存储结果是字符串；图片格式由核心 ImageReader 统一校验。
                if (typeof storedImageData !== 'string') {
                    reject(new Error(`[ImageAdapter] Invalid image data stored for imageId: '${imageId}'.`));
                    return;
                }
                resolve(storedImageData);
            };

            transaction.onerror = () => {
                reject(new Error(`[ImageAdapter] Failed to read image: ${transaction.error?.message ?? 'Transaction failed.'}`));
            };
            transaction.onabort = () => {
                reject(new Error(`[ImageAdapter] Image read was aborted: ${transaction.error?.message ?? 'Transaction aborted.'}`));
            };
        });
    }
}
