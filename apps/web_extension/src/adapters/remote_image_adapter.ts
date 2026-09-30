/**
 * apps/web_extension/src/adapters/remote_image_adapter.ts
 *
 * Chrome Content Script 专用的只读图片适配器模块。
 * 本模块定义远程读取所需的最小消息契约，并通过 chrome.runtime
 * 向扩展 Service Worker 请求扩展 Origin 中的图片。
 */
import type { IImageReaderAdapter } from '@clear-vibe/core_storage';

/** Service Worker 图片读取消息的类型标识。 */
export const FETCH_IMAGE_BASE64_MESSAGE_TYPE = 'FETCH_IMAGE_BASE64' as const;

/** Content Script 发给 Service Worker 的图片读取请求。 */
export interface FetchImageBase64Request {
    type: typeof FETCH_IMAGE_BASE64_MESSAGE_TYPE;
    imageId: string;
}

/** Service Worker 返回的图片读取结果。 */
export type FetchImageBase64Response =
    | { success: true; base64Data: string }
    | { success: false; error: string };

/**
 * 通过扩展内部消息读取图片的适配器。
 *
 * 该类只实现读取契约，避免以一个永远抛错的 saveImage 方法伪装成完整存储能力。
 */
export class RemoteImageAdapter implements IImageReaderAdapter {
    public async getImage(imageId: string): Promise<string> {
        // imageId 与图片格式由核心 ImageReader 统一校验；此处仅处理消息传输契约。
        const requestMessage: FetchImageBase64Request = {
            type: FETCH_IMAGE_BASE64_MESSAGE_TYPE,
            imageId
        };

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(requestMessage, (response: unknown) => {
                const runtimeError = chrome.runtime.lastError;
                if (runtimeError) {
                    reject(new Error(`[RemoteImageAdapter] Message failed: ${runtimeError.message}`));
                    return;
                }

                if (typeof response !== 'object' || response === null) {
                    reject(new Error('[RemoteImageAdapter] Background returned an invalid response.'));
                    return;
                }

                // Partial 表达“字段尚未检查”，不把未知消息直接视作完整契约。
                const responseMessage = response as Partial<FetchImageBase64Response>;
                if (responseMessage.success === true && typeof responseMessage.base64Data === 'string') {
                    resolve(responseMessage.base64Data);
                    return;
                }
                if (responseMessage.success === false
                    && typeof responseMessage.error === 'string'
                    && responseMessage.error.trim() !== '') {
                    reject(new Error(`[RemoteImageAdapter] ${responseMessage.error}`));
                    return;
                }
                reject(new Error('[RemoteImageAdapter] Background returned an invalid response.'));
            });
        });
    }
}
