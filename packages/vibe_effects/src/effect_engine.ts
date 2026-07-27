/**
 * packages/vibe_effects/src/effect_engine.ts
 * 这个类是纯粹的逻辑中心，不依赖任何环境，只要你给它输入参数，它就算出对应的 CSS 样式字典。
 */

import type { EffectRenderParams, IVibeEffectEngine } from './types.ts';

/**
 * 氛围特效引擎的实现类
 * 采用面向对象设计，保证后续如果增加新的特效引擎，可以实现同样的接口
 */
export class VibeEffectEngine implements IVibeEffectEngine {
    /**
     * 根据参数生成 CSS 样式对象
     * 显式接收参数，显式返回结果，绝不产生副作用
     */
    public generateEffectStyles(params: EffectRenderParams): Record<string, string>{
        // 1. 显示提取参数
        const imageUrl: string = params.imageUrl;
        const centerOpacity: number = params.centerOpacity;
        const edgeOpacity: number = params.edgeOpacity;
        const spreadRadius: number = params.spreadRadius;

        // 2. 计算核心的 CSS Mask 字符串：这里把图片 URL 和配置拼接成了 CSS 样式字典
        // 使用径向渐变 (radial-gradient)，从中心(0%)到设定的半径(spreadRadius%)保持较高的透明度
        // 然后向边缘(100%)过渡到较低的透明度(即更清晰)
        // 注意：CSS mask 中，rgba的 alpha 通道越低，背景越透明；alpha 越高，背景越清晰显露。
        // 因此我们要反转一下你的语义：用户界面说的"中心透明"，在此处 alpha 应接近 0；"边缘清晰"，alpha 应接近 1。
        const maskImageCss: string = `radial-gradient(circle, rgba(0, 0, 0, ${centerOpacity}) 0%, rgba(0, 0, 0, ${centerOpacity}) ${spreadRadius}%, rgba(0, 0, 0, ${edgeOpacity}) 100%)`;
        
        // 3. 构建输出的样式字典
        const outStyles: Record<string, string> = {
            backgroundImage: `url("${imageUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            WebkitMaskImage: maskImageCss, // 兼容 Chrome 等基于 Webkit 的浏览器
            maskImage: maskImageCss,
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: '0',
            left: '0',
            zIndex: '0' // 确保作为背景垫在最底层，不影响前方内容交互
        };

        // 4. 显示返回结果
        return outStyles;
    }
}