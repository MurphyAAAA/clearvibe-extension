/** apps/web_extension/src/new_tab/NewTabApp.tsx */
import React, { useEffect, useState } from 'react';
import { VibeEffectEngine } from '@clear-vibe/vibe_effects/src/effect_engine';
import { ChromeSettingsAdapter } from '../adapters/settings_adapter';
import { IndexedDbImageAdapter } from '../adapters/image_adapter';
import type { VibeConfig } from '@clear-vibe/core_settings/src/types';

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
    const [effectStyles, setEffectStyles] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<boolean>(true);
    // 无图片或报错时的兜底标志，决定是否渲染极简的黑色背景
    const [hasValidImage, setHasValidImage] = useState<boolean>(false);

    // ==========================================
    // 3. 初始加载逻辑
    // ==========================================
    useEffect(() => {
        const renderVibe = async () => {
            try {
                const savedConfig = await settingsAdapter.loadConfig();
                if (savedConfig && savedConfig.imageId) {
                    const base64Data = await imageAdapter.getImage(savedConfig.imageId);
                    const styles = effectEngine.generateEffectStyles({
                        imageUrl: base64Data,
                        centerOpacity: savedConfig.centerOpacity,
                        edgeOpacity: savedConfig.edgeOpacity,
                        spreadRadius: savedConfig.spreadRadius
                    });
                    setEffectStyles(styles);
                    setHasValidImage(true);
                } else {
                    setHasValidImage(false);
                }
            } catch (error) {
                console.error('[NewTab] Failed to render vibe:', error);
                setHasValidImage(false); // 强契约抛错后，兜底至无背景状态
            } finally {
                setLoading(false);
            }
        };
        renderVibe();
    }, []); // MVP 阶段暂不处理配置热更新，更改配置后刷新 New Tab 即可

    
    if (loading) return <div style={{ padding: '20px', color: '#fff' }}>Loading Vibe...</div>;

    // ==========================================
    // 5. 渲染视图：绝对解耦，React 只负责挂载计算出的 CSS
    // ==========================================
    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#121212', zIndex: 0 }}>
            {/* 绝对解耦：只呈现效果，无任何交互 UI */}
            {hasValidImage ? (
                <div style={effectStyles}></div>
            ) : (
                <div style={{ color: '#666', textAlign: 'center', paddingTop: '40vh', fontFamily: 'sans-serif' }}>
                    请点击扩展图标设置你的 Clear Vibe
                </div>
            )}
        </div>
    );
};