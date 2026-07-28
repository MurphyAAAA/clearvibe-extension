/** apps/web_extension/src/popup/PopupApp.tsx */
import React, { useEffect, useState } from 'react';
import { ChromeSettingsAdapter } from '../adapters/settings_adapter';
import { IndexedDbImageAdapter } from '../adapters/image_adapter';
// 注意：Popup 组件中不再需要引入 VibeEffectEngine，因为不需要计算渲染 CSS
import type { VibeConfig } from '@clear-vibe/core_settings/src/types';

const settingsAdapter = new ChromeSettingsAdapter();
const imageAdapter = new IndexedDbImageAdapter();

const DEFAULT_CONFIG: VibeConfig = {
    imageId: '',
    centerOpacity: 0.1,
    edgeOpacity: 1.0,
    spreadRadius: 40
};

export const PopupApp: React.FC = () => {
    const [config, setConfig] = useState<VibeConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const initConfig = async () => {
            try {
                const savedConfig = await settingsAdapter.loadConfig();
                // 严谨判断：即使存了配置，如果没有 imageId，依然视作默认状态
                if (savedConfig && savedConfig.imageId) {
                    setConfig(savedConfig);
                } else {
                    setConfig(DEFAULT_CONFIG);
                }
            } catch (error) {
                console.error('[Popup] Failed to load config:', error);
                setConfig(DEFAULT_CONFIG);
            } finally {
                setLoading(false);
            }
        };
        initConfig();
    }, []);

    const handleConfigChange = async (newConfig: VibeConfig) => {
        setConfig(newConfig);
        await settingsAdapter.saveConfig(newConfig);
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !config) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target?.result as string;
            const newImageId = `img_${Date.now()}`;
            try {
                await imageAdapter.saveImage(newImageId, base64Data);
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
        await settingsAdapter.saveConfig(DEFAULT_CONFIG);
        setConfig(DEFAULT_CONFIG);
        alert('数据已清除，打开新标签页查看！');
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Clear Vibe 设置</h3>
            
            <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>1. 选择/更换背景图</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', fontSize: '12px' }} />
            </div>

            <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
                    2. 中心透明度: {config?.centerOpacity.toFixed(2)}
                </label>
                <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={config?.centerOpacity}
                    onChange={(e) => handleConfigChange({ ...config!, centerOpacity: parseFloat(e.target.value) })}
                    style={{ width: '100%' }}
                />
            </div>

            <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
                    3. 扩散半径: {config?.spreadRadius}%
                </label>
                <input 
                    type="range" min="0" max="100" step="1" 
                    value={config?.spreadRadius}
                    onChange={(e) => handleConfigChange({ ...config!, spreadRadius: parseFloat(e.target.value) })}
                    style={{ width: '100%' }}
                />
            </div>

            <button 
                onClick={handleReset}
                style={{ marginTop: '10px', padding: '8px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                清除壁纸与配置
            </button>
        </div>
    );
};