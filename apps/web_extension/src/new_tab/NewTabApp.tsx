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

export const MvpApp: React.FC = () => {
    // ==========================================
    // 2. UI 状态管理
    // ==========================================
    const [config, setConfig] = useState<VibeConfig | null>(null);
    const [effectStyles, setEffectStyles] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<boolean>(true);

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
                    setConfig({
                        imageId: '',
                        centerOpacity: 0.1,
                        edgeOpacity: 1.0,
                        spreadRadius: 20
                    });
                }
            } catch (error) {
                console.error('Initialization failed:', error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // ==========================================
    // 4. 用户操作：上传图片与实时渲染
    // ==========================================
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
                
                // 2. 存新配置到 Chrome Storage
                const newConfig: VibeConfig = { ...config, imageId: newImageId };
                await settingsAdapter.saveConfig(newConfig);
                setConfig(newConfig);

                // 3. 实时重新计算特效并应用
                const styles = effectEngine.generateEffectStyles({
                    imageUrl: base64Data,
                    centerOpacity: newConfig.centerOpacity,
                    edgeOpacity: newConfig.edgeOpacity,
                    spreadRadius: newConfig.spreadRadius
                });
                setEffectStyles(styles);

            } catch (error) {
                console.error('Failed to save and apply image:', error);
                alert('上传失败，请查看控制台。');
            }
        };
        reader.readAsDataURL(file);
    };

    if (loading) return <div style={{ padding: '20px', color: '#fff' }}>Loading Vibe...</div>;

    // ==========================================
    // 5. 渲染视图：绝对解耦，React 只负责挂载计算出的 CSS
    // ==========================================
    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#121212', zIndex: 0 }}>
            {/* 1. 背景层：它的 zIndex 现在是 0 */}
            <div style={effectStyles}></div>

            {/* 2. 前景控制层：给它 zIndex: 1，确保它永远浮在图片上面 */}
            <div style={{ 
                position: 'relative', 
                zIndex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%' 
            }}>
                <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.85)', 
                    padding: '30px', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Clear Vibe MVP 控制台</h2>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        style={{ display: 'block', marginBottom: '20px' }}
                    />
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        <p>当前中心透明度 (Center Opacity): {config?.centerOpacity}</p>
                        <p>过渡起始半径 (Spread Radius): {config?.spreadRadius}%</p>
                        <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
                            上传一张色彩丰富的风景图，观察四周图片清晰、中央背景透明的效果。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};