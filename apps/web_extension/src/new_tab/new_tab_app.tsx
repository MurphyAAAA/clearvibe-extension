/** 新标签页宿主组件：组装配置、只读图片能力与特效计算，并呈现结果。 */
import React, { useEffect, useState } from 'react';
import { SettingsManager, type VibeConfig } from '@clear-vibe/core_settings';
import { ImageReader } from '@clear-vibe/core_storage';
import { VibeEffectEngine } from '@clear-vibe/vibe_effects';
import { ChromeSettingsAdapter } from '../adapters/settings_adapter';
import { IndexedDbImageAdapter } from '../adapters/image_adapter';

// ==========================================
// 1. 依赖实例化：App 层负责提供工具并组装
// ==========================================
const settingsAdapter = new ChromeSettingsAdapter();
const imageAdapter = new IndexedDbImageAdapter();

const settingsManager = new SettingsManager(settingsAdapter);
// 新标签页只消费图片读取能力，不持有图片保存接口。
const imageReader = new ImageReader(imageAdapter);
const effectEngine = new VibeEffectEngine();



export const NewTabApp: React.FC = () => {
    // ==========================================
    // 2. UI 状态管理
    // ==========================================
    const [effectStyles, setEffectStyles] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<boolean>(true);
    // 无图片或报错时的兜底标志，决定是否渲染极简的黑色背景
    const [hasValidImage, setHasValidImage] = useState<boolean>(false);

    // 抽出公共渲染逻辑
    const applyVibeConfig = async (currentConfig: VibeConfig) =>{
        if (!currentConfig.imageId) {
            setHasValidImage(false);
            return;
        }
        try{
            // 通过只读业务管家提取图片，存储位置仍由宿主适配器决定。
            const base64Data = await imageReader.getImage(currentConfig.imageId);
            const styles = effectEngine.generateEffectStyles({
                imageUrl: base64Data,
                centerOpacity: currentConfig.centerOpacity,
                edgeOpacity: currentConfig.edgeOpacity,
                spreadRadius: currentConfig.spreadRadius
            });
            setEffectStyles(styles);
            setHasValidImage(true);
        } catch (error) {
            console.error('[NewTab] Image fetch failed via ImageReader:', error);
            setHasValidImage(false);
        }
    };
    // ==========================================
    // 3. 初始加载逻辑
    // ==========================================
    useEffect(() => {
        const init = async () => {
            try {
                // UI 调用 SettingsManager
                const currentConfig = await settingsManager.getConfig();
                await applyVibeConfig(currentConfig);
            } catch (error) {
                console.error('[NewTab] Init failed:', error);
            } finally {
                setLoading(false);
            }
        };
        init();

        // 通过 SettingsManager 订阅配置变化
        const unsubscribe = settingsManager.subscribeConfigChange((newConfig: VibeConfig) => {
            applyVibeConfig(newConfig);
        });

        return () => unsubscribe();
    }, []);

    
    if (loading) return <div className="new_tab_loading">Loading Vibe...</div>;

    // ==========================================
    // 5. 渲染视图：绝对解耦，React 只负责挂载计算出的 CSS
    // ==========================================
    return (
        <div className="new_tab_background">
            {/* 绝对解耦：只呈现效果，无任何交互 UI */}
            {hasValidImage ? (
                <div style={effectStyles}></div>
            ) : (
                <div className="new_tab_empty_message">
                    请点击扩展图标设置你的 Clear Vibe
                </div>
            )}
        </div>
    );
};
