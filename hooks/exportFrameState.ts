import { SlideData, TransitionType } from '../types';
import { CSSProperties } from 'react';

const MANAGED_STYLE_KEYS: Array<keyof CSSStyleDeclaration> = [
    'opacity',
    'transform',
    'filter',
    'visibility',
    'animation',
    'animationName',
    'animationDelay',
    'animationDuration',
    'animationFillMode',
    'animationPlayState',
    'animationIterationCount',
];

export interface ExportFrameDiagnostics {
    textIntroProgress: number;
    textIntroOpacity: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const applyStyle = (element: HTMLElement | null, style: CSSProperties) => {
    if (!element) return;
    for (const key of MANAGED_STYLE_KEYS) {
        element.style[key] = '';
    }

    for (const [key, value] of Object.entries(style)) {
        if (value === undefined || value === null) continue;
        (element.style as unknown as Record<string, string>)[key] = String(value);
    }
};

const getPhaseProgress = (
    elapsedSeconds: number,
    totalDuration: number,
    durationVal: number,
    type: 'intro' | 'outro'
) => {
    if (durationVal <= 0) return 1;
    if (type === 'intro') return clamp01(elapsedSeconds / durationVal);
    const outroStart = Math.max(0, totalDuration - durationVal);
    return clamp01((elapsedSeconds - outroStart) / durationVal);
};

const getTransitionStyle = (
    transition: TransitionType,
    type: 'intro' | 'outro',
    pRaw: number
): CSSProperties => {
    const p = clamp01(pRaw);
    if (transition === 'none') return {};

    if (type === 'intro') {
        switch (transition) {
            case 'fade': return { opacity: p };
            case 'slide-up': return { opacity: p, transform: `translateY(${(1 - p) * 60}px)` };
            case 'slide-down': return { opacity: p, transform: `translateY(${-(1 - p) * 60}px)` };
            case 'slide-left': return { opacity: p, transform: `translateX(${(1 - p) * 60}px)` };
            case 'slide-right': return { opacity: p, transform: `translateX(${-(1 - p) * 60}px)` };
            case 'zoom-in': return { opacity: p, transform: `scale(${0.9 + 0.1 * p})` };
            case 'zoom-out': return { opacity: p, transform: `scale(${1.1 - 0.1 * p})` };
            case 'rotate-in': return { opacity: p, transform: `rotate(${(-5 * (1 - p)).toFixed(3)}deg) scale(${(0.95 + 0.05 * p).toFixed(5)})` };
            case 'blur-in': return { opacity: p, filter: `blur(${((1 - p) * 20).toFixed(3)}px)` };
            case 'elastic-up': {
                if (p <= 0.6) {
                    const t = p / 0.6;
                    return { opacity: p, transform: `translateY(${(100 - 120 * t).toFixed(3)}px)` };
                }
                const t = (p - 0.6) / 0.4;
                return { opacity: p, transform: `translateY(${(-20 + 20 * t).toFixed(3)}px)` };
            }
            default: return {};
        }
    }

    switch (transition) {
        case 'fade': return { opacity: 1 - p };
        case 'slide-up': return { opacity: 1 - p, transform: `translateY(${(-60 * p).toFixed(3)}px)` };
        case 'slide-down': return { opacity: 1 - p, transform: `translateY(${(60 * p).toFixed(3)}px)` };
        case 'slide-left': return { opacity: 1 - p, transform: `translateX(${(-60 * p).toFixed(3)}px)` };
        case 'slide-right': return { opacity: 1 - p, transform: `translateX(${(60 * p).toFixed(3)}px)` };
        case 'zoom-in': return { opacity: 1 - p, transform: `scale(${(1 + 0.1 * p).toFixed(5)})` };
        case 'zoom-out': return { opacity: 1 - p, transform: `scale(${(1 - 0.1 * p).toFixed(5)})` };
        case 'rotate-in': return { opacity: 1 - p, transform: `rotate(${(5 * p).toFixed(3)}deg) scale(${(1 - 0.05 * p).toFixed(5)})` };
        case 'blur-in': return { opacity: 1 - p, filter: `blur(${(20 * p).toFixed(3)}px)` };
        case 'elastic-up': return { opacity: 1 - p, transform: `translateY(${(-60 * p).toFixed(3)}px)` };
        default: return {};
    }
};

const applyVisibilityPolicy = (
    style: CSSProperties,
    atBoundary: boolean,
    skipVisibility: boolean | undefined
) => {
    if (!atBoundary) {
        return { ...style, visibility: 'visible' as const };
    }
    if (skipVisibility) {
        return {
            visibility: 'visible' as const,
            opacity: 1,
            transform: 'none',
            filter: 'none',
            animationName: 'none',
        };
    }
    return { ...style, visibility: 'hidden' as const };
};

export const applyExportFrameState = (
    exportContainer: HTMLDivElement,
    slide: SlideData,
    elapsedSeconds: number
): ExportFrameDiagnostics => {
    const durationSeconds = slide.duration || 5;
    const introTextProgress = getPhaseProgress(elapsedSeconds, durationSeconds, slide.textTransitionDuration ?? 1, 'intro');
    const outroTextProgress = getPhaseProgress(elapsedSeconds, durationSeconds, slide.textOutroDuration ?? 1, 'outro');
    const introImageProgress = getPhaseProgress(elapsedSeconds, durationSeconds, slide.imageTransitionDuration ?? 1, 'intro');
    const outroImageProgress = getPhaseProgress(elapsedSeconds, durationSeconds, slide.imageOutroDuration ?? 1, 'outro');

    const textIntro = exportContainer.querySelector('[data-export-role="text-intro"]') as HTMLElement | null;
    const textOutro = exportContainer.querySelector('[data-export-role="text-outro"]') as HTMLElement | null;
    const imageIntro = exportContainer.querySelector('[data-export-role="image-intro"]') as HTMLElement | null;
    const imageOutro = exportContainer.querySelector('[data-export-role="image-outro"]') as HTMLElement | null;

    const isFirstFrame = elapsedSeconds <= 0.0001;
    const isLastFrame = elapsedSeconds >= (durationSeconds - 0.0001);

    const textIntroStyle = applyVisibilityPolicy(
        getTransitionStyle(slide.textTransition ?? 'slide-up', 'intro', introTextProgress),
        isFirstFrame,
        slide.skipTextEnterVisibility
    );
    const textOutroStyle = applyVisibilityPolicy(
        getTransitionStyle(slide.textOutroTransition ?? 'none', 'outro', outroTextProgress),
        isLastFrame,
        slide.skipTextExitVisibility
    );
    const imageIntroStyle = applyVisibilityPolicy(
        getTransitionStyle(slide.imageTransition ?? 'zoom-in', 'intro', introImageProgress),
        isFirstFrame,
        slide.skipImageEnterVisibility
    );
    const imageOutroStyle = applyVisibilityPolicy(
        getTransitionStyle(slide.imageOutroTransition ?? 'none', 'outro', outroImageProgress),
        isLastFrame,
        slide.skipImageExitVisibility
    );

    applyStyle(textIntro, textIntroStyle);
    applyStyle(textOutro, textOutroStyle);
    applyStyle(imageIntro, imageIntroStyle);
    applyStyle(imageOutro, imageOutroStyle);

    const resolvedOpacity = textIntroStyle.opacity;
    const textIntroOpacity =
        typeof resolvedOpacity === 'number'
            ? resolvedOpacity
            : typeof resolvedOpacity === 'string'
                ? Number.parseFloat(resolvedOpacity) || 1
                : 1;

    return {
        textIntroProgress: introTextProgress,
        textIntroOpacity,
    };
};
