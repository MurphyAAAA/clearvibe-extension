/** Google 主页与搜索结果页入口：组装已有核心能力，负责背景呈现，不接管原站搜索 UI。 */
import { SettingsManager, type VibeConfig } from '@clear-vibe/core_settings';
import { ImageReader } from '@clear-vibe/core_storage';
import { VibeEffectEngine } from '@clear-vibe/vibe_effects';
import { ChromeSettingsAdapter } from '../adapters/settings_adapter';
import { RemoteImageAdapter } from '../adapters/remote_image_adapter';

const settingsManager = new SettingsManager(new ChromeSettingsAdapter());
const imageReader = new ImageReader(new RemoteImageAdapter());
const effectEngine = new VibeEffectEngine();

const backgroundElement = document.createElement('div');
backgroundElement.id = 'clear_vibe_google_background';
backgroundElement.setAttribute('aria-hidden', 'true');
backgroundElement.hidden = true;
document.body.prepend(backgroundElement);

// 每次配置变化产生一个版本，较早完成的读取不能覆盖更新后的页面状态。
let configVersion = 0;
// 仅缓存本页面当前图片，调整遮罩时不重复传输整张高清图。
let displayedImageId = '';
let displayedImageData = '';

/** 读取当前图片并应用特效；清空配置时通过移除类名恢复 Google 原始样式。 */
async function applyGoogleVibeConfig(config: VibeConfig): Promise<void> {
    const requestedVersion = ++configVersion;
    if (config.imageId === '') {
        backgroundElement.hidden = true;
        document.body.classList.remove('clear_vibe_google_active');
        displayedImageId = '';
        displayedImageData = '';
        backgroundElement.removeAttribute('style');
        return;
    }

    try {
        const base64Data = config.imageId === displayedImageId
            ? displayedImageData
            : await imageReader.getImage(config.imageId);
        if (requestedVersion !== configVersion) return;

        Object.assign(backgroundElement.style, effectEngine.generateEffectStyles({
            imageUrl: base64Data,
            centerOpacity: config.centerOpacity,
            edgeOpacity: config.edgeOpacity,
            spreadRadius: config.spreadRadius
        }));
        // 视口定位与宿主层级属于页面入口，遮罩计算仍只由特效引擎提供。
        backgroundElement.style.position = 'fixed';
        backgroundElement.style.zIndex = '-1';
        displayedImageId = config.imageId;
        displayedImageData = base64Data;
        document.body.classList.add('clear_vibe_google_active');
        backgroundElement.hidden = false;
    } catch (error) {
        console.error('[GoogleBackground] Image read or render failed:', error);
        if (requestedVersion !== configVersion) return;
        backgroundElement.hidden = true;
        document.body.classList.remove('clear_vibe_google_active');
    }
}

// 先订阅再读取；若初始化期间收到新配置，丢弃过期的初始快照。
settingsManager.subscribeConfigChange((config) => { void applyGoogleVibeConfig(config); });
const initialConfigVersion = configVersion;
void settingsManager.getConfig().then((config) => {
    if (configVersion === initialConfigVersion) return applyGoogleVibeConfig(config);
}).catch((error: unknown) => {
    console.error('[GoogleBackground] Configuration load failed:', error);
});
// 订阅与内容脚本共同存活于当前文档；浏览器销毁文档时释放，不额外引入生命周期框架。
