/**
 * packages/core_storage/src/storage_manager.ts
 * 图片资产核心业务管家：纯 TS 环境，依赖注入 IImageStorageAdapter 适配器
 * 负责高分辨率壁纸图片的业务校验与存储调度。
 */

import type { IImageStorageAdapter } from './types.ts';

export class StorageManager {
    private readonly storageAdapter: IImageStorageAdapter;

    constructor(storageAdapter: IImageStorageAdapter) {
        this.storageAdapter = storageAdapter;
    }

    /**
     * 保存用户上传的背景图（包含数据格式强校验）
     */
    public async saveImage(imageId: string, base64Data: string): Promise<void> {
        if (!imageId || imageId.trim() === '') {
            throw new Error('[StorageManager] imageId cannot be empty.');
        }
        if (!base64Data || !base64Data.startsWith('data:image/')) {
            throw new Error('[StorageManager] Invalid base64Data format. Must be a valid Data URI image string.');
        }
        await this.storageAdapter.saveImage(imageId, base64Data);
    }

    /**
     * 获取图片
     */
    public async getImage(imageId: string): Promise<string> {
        if (!imageId || imageId.trim() === '') {
            throw new Error('[StorageManager] imageId cannot be empty.');
        }
        const base64Data: string = await this.storageAdapter.getImage(imageId);
        if (!base64Data) {
            throw new Error(`[StorageManager] Image not found for imageId: '${imageId}'`);
        }
        return base64Data;
    }
}