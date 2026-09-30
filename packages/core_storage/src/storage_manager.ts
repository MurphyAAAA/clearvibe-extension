/**
 * packages/core_storage/src/storage_manager.ts
 * 图片资产核心业务：纯 TS 环境，通过适配器依赖注入提供只读和完整读写能力。
 * 负责高分辨率壁纸图片的业务校验与存储调度，不感知具体宿主环境。
 */

import type { IImageReaderAdapter, IImageStorageAdapter } from './types.ts';

/**
 * 图片读取业务管家。
 *
 * 该类只依赖最小的读取契约，适合注入远程读取适配器。它负责在图片进入
 * 渲染层之前校验 imageId 和返回数据，避免宿主适配器的异常数据继续传播。
 */
export class ImageReader {
    private readonly imageReaderAdapter: IImageReaderAdapter;

    constructor(imageReaderAdapter: IImageReaderAdapter) {
        this.imageReaderAdapter = imageReaderAdapter;
    }

    /**
     * 获取并校验图片。
     */
    public async getImage(imageId: string): Promise<string> {
        if (typeof imageId !== 'string' || imageId.trim() === '') {
            throw new Error('[ImageReader] imageId cannot be empty.');
        }

        const base64Data: string = await this.imageReaderAdapter.getImage(imageId);
        if (typeof base64Data !== 'string' || !base64Data.startsWith('data:image/')) {
            throw new Error(`[ImageReader] Invalid image data returned for imageId: '${imageId}'.`);
        }
        return base64Data;
    }
}

export class StorageManager extends ImageReader {
    private readonly storageAdapter: IImageStorageAdapter;

    constructor(storageAdapter: IImageStorageAdapter) {
        super(storageAdapter);
        this.storageAdapter = storageAdapter;
    }

    /**
     * 保存用户上传的背景图（包含数据格式强校验）
     */
    public async saveImage(imageId: string, base64Data: string): Promise<void> {
        if (typeof imageId !== 'string' || imageId.trim() === '') {
            throw new Error('[StorageManager] imageId cannot be empty.');
        }
        if (typeof base64Data !== 'string' || !base64Data.startsWith('data:image/')) {
            throw new Error('[StorageManager] Invalid base64Data format. Must be a valid Data URI image string.');
        }
        await this.storageAdapter.saveImage(imageId, base64Data);
    }
}
