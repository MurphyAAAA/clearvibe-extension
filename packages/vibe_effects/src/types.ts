/**
 * packages/vibe_effects/src/types.ts
 * 特效引擎是一个绝对纯净的计算模块，不需要任何存储适配器，只需要明确的输入（图片、参数）和输出（CSS 样式）。
 */

import type { VibeConfig } from "../../core_settings/src/types.ts";
/**
 * 传递给特效生成器的参数模型
 * 故意将 VibeConfig 中的 imageId 剔除，因为渲染层不关心 ID，只关心真实的渲染材料（URL/Base64）
 */
export interface EffectRenderParams {
    /** 直接用于渲染的图片资源 (URL or Base64) */
    imageUrl: string;
    // 直接复用设置层中的透明度与半径参数
    centerOpacity: VibeConfig['centerOpacity'];
    edgeOpacity: VibeConfig['edgeOpacity'];
    spreadRadius: VibeConfig['spreadRadius'];
}

/**
 * 氛围特效生成器接口
 * 明确输入 EffectRenderParams，输出标准 CSS 样式对象，此对象可直接被 React 的 style 属性或原生 DOM 消费
 */
export interface IVibeEffectEngine {
    /**
     * 计算并生成背景与 CSS Mask 的样式
     * @param params 渲染所需的所有物理参数
     * @returns 形如 { backgroundImage: 'url(...)', maskImage: 'radial-gradient(...)' } 的样式字典
     */
    generateEffectStyles(params: EffectRenderParams): Record<string, string>;
}