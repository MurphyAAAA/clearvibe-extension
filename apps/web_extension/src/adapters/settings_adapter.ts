/**
 * apps/web_extension/src/adapters/settings_adapter.ts
 * 这是位于宿主 App 层的代码，它封装了 Chrome 特有的 API chrome.storage.local，用于给核心层打工。
 */
import type { ISettingsStorageAdapter, VibeConfig } from '../../../../packages/core_settings/src/types.ts';

/**
 * Chrome 扩展环境下的配置存储适配器
 */
export class ChromeSettingsAdapter implements ISettingsStorageAdapter {
    private readonly STORAGE_KEY = 'clear_vibe_settings';

    /**
     * 明确输入输出，利用 Promise 包装异步 API
     */
    public async loadConfig(): Promise<VibeConfig | null> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(this.STORAGE_KEY, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                
                // 强契约：严格检查是否存在该 key，绝不使用隐式默认值掩盖
                if (result && this.STORAGE_KEY in result) {
                    const outConfig: VibeConfig = result[this.STORAGE_KEY] as VibeConfig;
                    resolve(outConfig);
                } else {
                    // 若无数据，显式返回 null，交由上层（React UI或核心管家）去初始化默认值
                    resolve(null); 
                }
            });
        });
    }

    public async saveConfig(inputConfig: VibeConfig): Promise<void> {
        // 调用chrome api,将设置保存到浏览器本地缓存
        return new Promise((resolve, reject) => {
            const dataToSave = { [this.STORAGE_KEY]: inputConfig };
            chrome.storage.local.set(dataToSave, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve();
            });
        });
    }
}