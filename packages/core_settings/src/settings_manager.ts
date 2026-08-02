/**
 * packages\core_settings\src\settings_manager.ts
 * 配置核心业务管家：纯 TS 环境，依赖注入 ISettingsStorageAdapter 适配器
 * 业务管家负责配置的装载、校验、保存与变动订阅
 */

import type { ISettingsStorageAdapter, VibeConfig } from "./types";

/**
 * 契约常量：全局默认配置
 */
export const DEFAULT_VIBE_CONFIG: VibeConfig = {
    imageId: '',
    centerOpacity: 0.1,
    edgeOpacity: 1.0,
    spreadRadius: 40
};

export class SettingsManager {
    private readonly settingsAdapter: ISettingsStorageAdapter;

    /**
     * 依赖注入：传入具体的环境适配器
     */
    constructor(settingsAdapter: ISettingsStorageAdapter){
        this.settingsAdapter = settingsAdapter;
    }

    /**
     * 获取当前配置
     * 若未设置过配置，显示返回默认契约配置
     */
    public async getConfig(): Promise<VibeConfig> {
        const loadedConfig: VibeConfig | null = await this.settingsAdapter.loadConfig();
        if (!loadedConfig) {
            return DEFAULT_VIBE_CONFIG;
        }
        this.validateConfig(loadedConfig);
        return loadedConfig;
    }

    /**
     * 保存/更新配置，保存前进行严格的数据业务校验
     */
    public async saveConfig(inputConfig: VibeConfig): Promise<void> {
        this.validateConfig(inputConfig);
        await this.settingsAdapter.saveConfig(inputConfig);
    }

    /**
     * 订阅配置变更
     */
    public subscribeConfigChange(callback: (config: VibeConfig) => void): () => void {
        return this.settingsAdapter.onConfigChange((newConfig: VibeConfig) => {
            this.validateConfig(newConfig);
            callback(newConfig);
        });
    }

    /**
     * 私有强契约校验函数：数据越界立即抛错阻断
     */
    private validateConfig(config: VibeConfig): void {
        if (config.centerOpacity < 0 || config.centerOpacity > 1) {
            throw new Error(`[SettingsManager] Invalid centerOpacity: ${config.centerOpacity}. Must be between 0.0 and 1.0.`);
        }
        if (config.edgeOpacity < 0 || config.edgeOpacity > 1) {
            throw new Error(`[SettingsManager] Invalid edgeOpacity: ${config.edgeOpacity}. Must be between 0.0 and 1.0.`);
        }
        if (config.spreadRadius < 0 || config.spreadRadius > 100) {
            throw new Error(`[SettingsManager] Invalid spreadRadius: ${config.spreadRadius}. Must be between 0 and 100.`);
        }
    }
}