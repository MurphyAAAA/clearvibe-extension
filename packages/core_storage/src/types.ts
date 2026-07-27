/**
 * packages/core_storage/src/types.ts
 * 这个包负责高分辨率图片的存取。由于不能存入体积受限的普通配置库中，我们需要独立的图片存储适配器。
 */


/**
 * 【核心适配器契约】：图片大文件存储适配器
 * 宿主环境（Chrome/桌面端）必须实现此接口，内部可以封装 IndexedDB 或 File System
 */
export interface IImageStorageAdapter {
    /**
     * 存入用户上传的背景图
     * @param imageId 图片的唯一标识（通常可由时间戳或 UUID 生成）
     * @param base64Data 图片的完整 Base64 字符串（包含 Data URI schema）
     * @returns 成功则 resolve，失败抛出明确错误
     */
    saveImage(imageId: string, base64Data: string): Promise<void>;

    /**
     * 根据 ID 获取图片数据
     * 为了遵守"避免静默失败"的强契约原则，若图片不存在，必须抛出 Error，而不是返回空字符串
     * @param imageId 图片唯一标识
     * @returns 图片的 Base64 字符串
     */
    getImage(imageId: string): Promise<string>;
}