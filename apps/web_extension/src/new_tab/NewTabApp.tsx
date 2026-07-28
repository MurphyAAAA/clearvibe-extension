import React, { useEffect, useState } from 'react';
import { VibeEffectEngine } from '../../../../packages/vibe_effects/src/effect_engine';
import { ChromeSettingsAdapter } from '../adapters/settings_adapter';
import { IndexedDbImageAdapter } from '../adapters/image_adapter';
import type { VibeConfig } from '../../../../packages/core_settings/src/types';

// ==========================================
// 1. 依赖实例化：App 层负责提供工具并组装
// ==========================================
const settingsAdapter = new ChromeSettingsAdapter();
const imageAdapter = new IndexedDbImageAdapter();
const effectEngine = new VibeEffectEngine();

// 提取一个契约常数，作为纯净的初始状态
const DEFAULT_CONFIG: VibeConfig = {
    imageId: '',
    centerOpacity: 0.1,
    edgeOpacity: 1.0,
    spreadRadius: 40
};

export const MvpApp: React.FC = () => {
    // ==========================================
    // 2. UI 状态管理
    // ==========================================
    const [config, setConfig] = useState<VibeConfig | null>(null);
    const [effectStyles, setEffectStyles] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<boolean>(true);

    // 用来缓存当前图片的 Base64，避免拖动滑块时重复去 IndexedDB 读取
    const [currentImageBase64, setCurrentImageBase64] = useState<string>('');

    // ==========================================
    // 3. 初始加载逻辑
    // ==========================================
    useEffect(() => {
        const init = async () => {
            try {
                // 读取配置
                const savedConfig = await settingsAdapter.loadConfig();
                if (savedConfig && savedConfig.imageId) {
                    setConfig(savedConfig);
                    // 读取高清图片数据
                    const base64Data = await imageAdapter.getImage(savedConfig.imageId);
                    setCurrentImageBase64(base64Data);
                    
                    // 调用纯函数引擎计算特效 CSS
                    const styles = effectEngine.generateEffectStyles({
                        imageUrl: base64Data,
                        centerOpacity: savedConfig.centerOpacity,
                        edgeOpacity: savedConfig.edgeOpacity,
                        spreadRadius: savedConfig.spreadRadius
                    });
                    setEffectStyles(styles);
                } else {
                    // 如果用户没有存过配置，提供一组默认契约值供初次渲染使用
                    setConfig(DEFAULT_CONFIG);
                }
            } catch (error) {
                console.error('Initialization failed:', error);
                setConfig(DEFAULT_CONFIG);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // ==========================================
    // 4. 用户操作：上传图片与实时渲染
    // ==========================================
    // 处理参数实时变化的通用函数
    const handleConfigChange = async (newConfig: VibeConfig, overrideImage?: string) => {
        setConfig(newConfig);
        
        // 优先使用传入的最新的 base64，如果没有传入，再退回到 state 里的缓存
        const imageToUse = overrideImage || currentImageBase64;
        
        // 1. 实时重新计算特效
        if (imageToUse) {
            const styles = effectEngine.generateEffectStyles({
                imageUrl: imageToUse,
                centerOpacity: newConfig.centerOpacity,
                edgeOpacity: newConfig.edgeOpacity,
                spreadRadius: newConfig.spreadRadius
            });
            setEffectStyles(styles);
        }
        // 2. 持久化保存
        await settingsAdapter.saveConfig(newConfig);
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !config) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target?.result as string;
            const newImageId = `img_${Date.now()}`; // 简单生成唯一ID

            try {
                // 1. 存图片到 IndexedDB
                await imageAdapter.saveImage(newImageId, base64Data);
                setCurrentImageBase64(base64Data);
                
                // 2. 存新配置到 Chrome Storage
                const newConfig: VibeConfig = { ...config, imageId: newImageId };
                // 【修复核心】：把刚刚生成的 base64Data 直接传进去，不干等 React 异步更新
                await handleConfigChange(newConfig, base64Data);

            } catch (error) {
                console.error('Failed to save and apply image:', error);
                alert('上传失败，请查看控制台。');
            }
        };
        reader.readAsDataURL(file);
    };
    
    const handleReset = async () =>{
        // 清除配置，回到默认状态
        await settingsAdapter.saveConfig(DEFAULT_CONFIG);
        setConfig(DEFAULT_CONFIG);
        setEffectStyles({});
        setCurrentImageBase64('');
        alert('数据已清除，已恢复初始状态！');
    }

    if (loading) return <div style={{ padding: '20px', color: '#fff' }}>Loading Vibe...</div>;

    // ==========================================
    // 5. 渲染视图：绝对解耦，React 只负责挂载计算出的 CSS
    // ==========================================
    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#121212', zIndex: 0 }}>
            {/* 1. 背景层：它的 zIndex 现在是 0 */}
            <div style={effectStyles}></div>

            {/* 控制层 */}
            <div style={{ 
                position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', 
                alignItems: 'center', justifyContent: 'center', height: '100%' 
            }}>
                <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '30px', 
                    borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: '300px'
                }}>
                    <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Clear Vibe MVP </h2>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>1. 选择/更换背景图</label>
                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold' }}>
                            2. 调整中心透明度: {config?.centerOpacity.toFixed(2)}
                        </label>
                        <input 
                            type="range" min="0" max="1" step="0.05" 
                            value={config?.centerOpacity}
                            onChange={(e) => handleConfigChange({ ...config!, centerOpacity: parseFloat(e.target.value) })}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold' }}>
                            3. 调整扩散半径: {config?.spreadRadius}%
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
                        style={{ padding: '8px 16px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        清除缓存与图片
                    </button>
                </div>
            </div>
        </div>
    );
};