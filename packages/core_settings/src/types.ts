/**
 * packages/core_settings/src/types.ts
 * 这个包负责管理特效的参数。为了遵守“强契约”（拒绝隐式默认值带来的 Bug），所有的字段都是必填项。
 */


/**
 * 氛围特效的核心配置数据模型
 * 保证数据的强契约性，没有可选字段 (?)，缺失即视为异常
 */
export interface VibeConfig {
    /** 选中的图片唯一标识，若为空字符串表示未设置壁纸 */
    imageId: string;
    // 画面中央 (内容区) 的透明度：范围 0.0 (完全透明) 到 1.0 (完全不透明)
    centerOpacity: number;
    // 画面边缘的透明度: 范围 0.0 到 1.0 (通常为 1.0, 边缘完全清晰)
    edgeOpacity: number;
    // 透明度渐变的扩散范围百分比，50 表示从中心向外 50% 区域开始渐变
    spreadRadius: number;
}

/**
 * 【核心适配器契约】：配置存储适配器
 * core-settings 本身不知道配置存在哪里，外部宿主 App 必须实现此接口并注入
 */

export interface ISettingsStorageAdapter {
    /**
     * 读取配置
     * @returns 返回 VibeConfig，如果首次使用（无数据）应明确返回 null，由调用方决定初始化逻辑
     */
    loadConfig(): Promise<VibeConfig | null>;

    /**
     * 保存配置
     * @param config 完整的配置对象，强制整体覆盖以避免字段遗漏
     */
    saveConfig(config: VibeConfig): Promise<void>;

    /**
     * 订阅配置变动
     * @param callback 当底层配置被修改时（如 Popup 中拖动滑块），触发回调并传入最新的完整配置
     * @returns 返回一个取消订阅的清理函数（用于 React useEffect 清理）
     */
    onConfigChange(callback: (newConfig: VibeConfig) => void): () => void;
}