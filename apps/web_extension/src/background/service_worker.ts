/** 后台入口：只接收扩展内部图片读取请求，不访问 DOM 或承担页面渲染。 */
import { ImageReader } from '@clear-vibe/core_storage';
import { IndexedDbImageAdapter } from '../adapters/image_adapter';
import {
    FETCH_IMAGE_BASE64_MESSAGE_TYPE,
    type FetchImageBase64Request,
    type FetchImageBase64Response
} from '../adapters/remote_image_adapter';

const imageReader = new ImageReader(new IndexedDbImageAdapter());

// 在模块顶层同步注册，确保 Service Worker 被消息唤醒时立即具备处理能力。
chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if (typeof message !== 'object' || message === null
        || !('type' in message) || message.type !== FETCH_IMAGE_BASE64_MESSAGE_TYPE) {
        return false; // 不接管其他类型的消息。
    }

    // 只读能力只对本扩展注入的 Google 主页和搜索结果顶层页面开放。
    // 路径与 Manifest 的入口范围一致，不将整个 Google 域作为可读取图片的页面。
    const senderUrl = sender.url ? new URL(sender.url) : null;
    if (sender.id !== chrome.runtime.id || sender.frameId !== 0
        || !senderUrl || senderUrl.origin !== 'https://www.google.com'
        || !['/', '/webhp', '/search'].includes(senderUrl.pathname)) {
        sendResponse({ success: false, error: 'Image read request came from an unauthorized context.' } satisfies FetchImageBase64Response);
        return false;
    }

    const request = message as Partial<FetchImageBase64Request>;
    if (typeof request.imageId !== 'string') {
        sendResponse({ success: false, error: 'Image read request must contain a string imageId.' } satisfies FetchImageBase64Response);
        return false;
    }

    // 图片 ID 与数据格式的业务校验仍由 ImageReader 承担。
    imageReader.getImage(request.imageId).then(
        (base64Data) => sendResponse({ success: true, base64Data } satisfies FetchImageBase64Response),
        (error: unknown) => sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        } satisfies FetchImageBase64Response)
    );
    return true; // 保留消息通道，直到异步 IndexedDB 读取完成。
});
