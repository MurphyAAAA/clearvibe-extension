/** Popup 宿主组件：处理图片上传、配置编辑与独立设置页入口。 */
import React, { useEffect, useState } from 'react';
import { SettingsManager, type VibeConfig } from '@clear-vibe/core_settings';
import { StorageManager } from '@clear-vibe/core_storage';
import { ChromeSettingsAdapter } from '../adapters/settings_adapter';
import { IndexedDbImageAdapter } from '../adapters/image_adapter';

// 1. 宿主层实例化 Adapter，并注入到 Packages 的 Manager 中
const settingsAdapter = new ChromeSettingsAdapter();
const imageAdapter = new IndexedDbImageAdapter();

const settingsManager = new SettingsManager(settingsAdapter);
const storageManager = new StorageManager(imageAdapter);

export const PopupApp: React.FC = () => {
    const [config, setConfig] = useState<VibeConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const initConfig = async () => {
            try {
                // UI 调用 Manager，不再直连 Adapter
                const currentConfig = await settingsManager.getConfig();
                setConfig(currentConfig);
            } catch (error) {
                console.error('[Popup] Failed to load config:', error);
            } finally {
                setLoading(false);
            }
        };
        initConfig();
    }, []);

    const handleConfigChange = async (newConfig: VibeConfig) => {
        setConfig(newConfig);
        await settingsManager.saveConfig(newConfig);
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !config) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target?.result as string;
            const newImageId = `img_${Date.now()}`;
            try {
                // 保存图片与配置统一走 Manager 管家
                await storageManager.saveImage(newImageId, base64Data);
                const newConfig: VibeConfig = { ...config, imageId: newImageId };
                await handleConfigChange(newConfig);
            } catch (error) {
                console.error('[Popup] Upload failed:', error);
                alert('上传失败，请查看控制台。');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleReset = async () => {
        // 保留现有参数，只清空当前壁纸引用；不删除图片资产或恢复默认参数。
        const defaultConfig = await settingsManager.getConfig();
        const resetConfig: VibeConfig = { ...defaultConfig, imageId: '' };
        await settingsManager.saveConfig(resetConfig);
        setConfig(resetConfig);
        alert('数据已清除！');
    };

    // 新增：在独立的浏览器 Tab 中打开控制面板，避开 Chrome 小弹窗上传失焦强杀的限制
    const handleOpenInFullTab = () => {
        if (chrome.tabs) {
            chrome.tabs.create({ url: chrome.runtime.getURL('src/popup/popup.html') });
        }
    };

    if (loading) return <div className="popup_loading">Loading...</div>;

    return (
        <div className="popup_settings">
            <div className="popup_header">
                <h3 className="popup_title">Clear Vibe 设置</h3>
                {/* 核心体验救星：点击可在独立 Tab 打开，彻底解决上传选择框强杀弹窗的问题 */}
                <button 
                    onClick={handleOpenInFullTab} 
                    className="popup_open_tab_button"
                >
                    全屏独立设置 ↗
                </button>
            </div>
            
            <div>
                <label className="popup_upload_label">
                    1. 选择/更换背景图
                </label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="popup_upload_input" />
            </div>

            <div>
                <label className="popup_parameter_label">
                    2. 中心透明度: {config?.centerOpacity.toFixed(2)}
                </label>
                <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={config?.centerOpacity}
                    onChange={(e) => handleConfigChange({ ...config!, centerOpacity: parseFloat(e.target.value) })}
                    className="popup_parameter_slider"
                />
            </div>

            <div>
                <label className="popup_parameter_label">
                    3. 扩散半径: {config?.spreadRadius}%
                </label>
                <input 
                    type="range" min="0" max="100" step="1" 
                    value={config?.spreadRadius}
                    onChange={(e) => handleConfigChange({ ...config!, spreadRadius: parseFloat(e.target.value) })}
                    className="popup_parameter_slider"
                />
            </div>

            <button 
                onClick={handleReset}
                className="popup_reset_button"
            >
                清除壁纸与配置
            </button>
        </div>
    );
};
