
import React from 'react';
import { SlideData } from '../types';

interface SlideRendererProps {
  data: SlideData;
  scale?: number;
  animate?: boolean;
  progress?: number; // 0 to 100
  exportMode?: boolean;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ 
    data, 
    scale = 1, 
    animate = true, 
    progress = 0,
    exportMode = false
}) => {
  const { 
    theme, 
    typography = 'modern-sans', // Default fallback
    badge, 
    title, 
    description, 
    imageUrl, 
    textTransition = 'slide-up', 
    imageTransition = 'zoom-in',
    textOutroTransition = 'none',
    imageOutroTransition = 'none',
    
    // Default to 1s if undefined for backward compatibility
    textTransitionDuration = 1,
    imageTransitionDuration = 1,
    textOutroDuration = 1,
    imageOutroDuration = 1,

    layout = 'text-image', // Default fallback

    // Visibility Overrides
    skipTextEnterVisibility = false,
    skipTextExitVisibility = false,
    skipImageEnterVisibility = false,
    skipImageExitVisibility = false,

    // Font Overrides
    badgeFontSize,
    titleFontSize,
    descriptionFontSize,
  } = data;

  // Base Slide Dimensions (16:9 Aspect Ratio based on 1920x1080)
  const width = 1920;
  const height = 1080;

  // Common wrapper style
  const wrapperStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    boxShadow: '0 0 50px rgba(0,0,0,0.5)',
  };

  // --- Animation Logic ---
  const durationSeconds = data.duration || 5;
  const currentSeconds = durationSeconds * (progress / 100);
  const useExportFrameInjection = exportMode && animate;
  
  const getControlledAnimationStyle = (baseDelayMs: number, type: 'intro' | 'outro' = 'intro', durationVal: number = 1): React.CSSProperties => {
    if (!animate) return {};
    
    const elapsedSeconds = currentSeconds;
    const baseDelaySec = baseDelayMs / 1000;
    
    let delaySec = 0;
    
    if (type === 'intro') {
        if (elapsedSeconds < baseDelaySec) {
            delaySec = 0;
        } else {
            const introElapsed = elapsedSeconds - baseDelaySec;
            delaySec = -Math.min(introElapsed, durationVal);
        }
    } else {
        const outroStartSeconds = durationSeconds - durationVal;
        if (elapsedSeconds < outroStartSeconds) {
            delaySec = 0;
        } else {
            const outroElapsed = elapsedSeconds - outroStartSeconds;
            delaySec = -Math.min(outroElapsed, durationVal);
        }
    }
    
    return {
      animationPlayState: 'paused',
      animationDelay: `${delaySec.toFixed(3)}s`,
      animationFillMode: 'both',
      animationIterationCount: 1,
      animationDuration: `${durationVal}s` // Override CSS default
    };
  };

  const getAnimationClass = (transition: string, type: 'intro' | 'outro') => {
    if (!animate || transition === 'none' || useExportFrameInjection) return '';
    return `anim-${transition}${type === 'outro' ? '-out' : ''}`;
  };

  const textIntroClass = getAnimationClass(textTransition, 'intro');
  const textOutroClass = getAnimationClass(textOutroTransition, 'outro');
  const imgIntroClass = getAnimationClass(imageTransition, 'intro');
  const imgOutroClass = getAnimationClass(imageOutroTransition, 'outro');
  
  // FOUC Prevention & Clean Cut Logic
  const isFirstFrame = animate && progress <= 0.0001;
  const isLastFrame = animate && progress >= 99.9999;

  // Helper to determine style overrides for start/end frames
  // If "Keep Visible" is checked, we MUST force visibility properties to override
  // any potential animation states (like opacity: 0 from a fade-in) that might be applied.
  const getVisibilityStyle = (isFrame: boolean, skipVisibility: boolean | undefined) => {
      if (useExportFrameInjection) return {};
      if (!isFrame) return {};
      if (skipVisibility) {
          return {
              visibility: 'visible' as const,
              opacity: 1,
              transform: 'none',
              filter: 'none',
              animationName: 'none' // Disable animation to prevent it from hiding content
          };
      }
      return { visibility: 'hidden' as const };
  };
  
  const textIntroStyle: React.CSSProperties = {
      ...(useExportFrameInjection ? {} : getControlledAnimationStyle(0, 'intro', textTransitionDuration)),
      ...getVisibilityStyle(isFirstFrame, skipTextEnterVisibility)
  };
  const textOutroStyle: React.CSSProperties = {
      ...(useExportFrameInjection ? {} : getControlledAnimationStyle(0, 'outro', textOutroDuration)),
      ...getVisibilityStyle(isLastFrame, skipTextExitVisibility)
  };
  
  const imgIntroStyle: React.CSSProperties = {
      ...(useExportFrameInjection ? {} : getControlledAnimationStyle(0, 'intro', imageTransitionDuration)),
      ...getVisibilityStyle(isFirstFrame, skipImageEnterVisibility)
  };
  const imgOutroStyle: React.CSSProperties = {
      ...(useExportFrameInjection ? {} : getControlledAnimationStyle(0, 'outro', imageOutroDuration)),
      ...getVisibilityStyle(isLastFrame, skipImageExitVisibility)
  };

  // --- Title Pulse Logic (Global Continuous) ---
  // If not animating (thumbnail), force scale to 1. 
  // If animating, leave transform empty so CSS variable takes over.
  const pulseWrapperStyle: React.CSSProperties = !animate ? { transform: 'scale(1)' } : {};

  // --- Ripple Effect Logic ---
  const getRippleStyle = (offsetSeconds: number): React.CSSProperties => {
      if (!animate) return {}; 
      
      return {
          animationPlayState: 'paused',
          animationDelay: `calc(${offsetSeconds}s - ${currentSeconds}s)`,
      };
  };

  const titleStyle: React.CSSProperties = {
    fontSize: titleFontSize ? `${titleFontSize}px` : 'var(--slide-title-size)',
  };

  // Layout Logic
  const isTextOnly = layout === 'text-only';
  
  // Wrapper classes for layout
  const containerClasses = isTextOnly 
    ? `theme-${theme} typography-${typography} flex-col items-center justify-center p-[100px] text-center`
    : `theme-${theme} typography-${typography} flex-row items-center p-[70px] gap-20`;

  // Text container classes
  const textContainerClasses = isTextOnly
    ? `w-full z-10 flex flex-col justify-center items-center text-center ${useExportFrameInjection ? '' : `anim-outro-wrapper ${textOutroClass}`}`
    : `flex-1 z-10 flex flex-col justify-center items-start text-left ${useExportFrameInjection ? '' : `anim-outro-wrapper ${textOutroClass}`}`;
    
  // Badge alignment for text-only
  const badgeClasses = isTextOnly 
    ? "badge inline-block px-10 py-4 rounded-full font-bold uppercase mb-10 tracking-wider w-fit mx-auto whitespace-nowrap"
    : "badge inline-block px-10 py-4 rounded-full font-bold uppercase mb-10 tracking-wider w-fit whitespace-nowrap";
    
  const descClasses = isTextOnly
    ? "slide-description leading-relaxed opacity-85 max-w-[80%] mx-auto whitespace-pre-wrap"
    : "slide-description leading-relaxed opacity-85 max-w-[90%] whitespace-pre-wrap";

  return (
    <div 
        style={wrapperStyle} 
        className={containerClasses}
    >
        {/* GENERIC SLIDE DECORATIONS */}
        <div className="theme-deco-slide-1"></div>
        <div className="theme-deco-slide-2"></div>

        <>
            {/* Text Section */}
            <div className={textContainerClasses} style={textOutroStyle} data-export-role="text-outro">
                <div className={`${useExportFrameInjection ? '' : 'anim-content'} w-full ${textIntroClass}`} style={textIntroStyle}>
                    <span 
                        className={badgeClasses} 
                        style={{ fontSize: badgeFontSize ? `${badgeFontSize}px` : 'var(--slide-badge-size)' }}
                    >
                        {badge}
                    </span>
                    
                    {/* Wrapped Title for Smooth Scaling */}
                    <div className="mb-10 max-w-full" data-export-role="title-intro-target">
                        <div className="pulsate-wrapper max-w-full" style={pulseWrapperStyle}>
                            <h1 className="slide-title font-bold leading-[1.1] whitespace-pre-wrap" style={titleStyle}>
                                {title}
                            </h1>
                        </div>
                    </div>

                    <p 
                        className={descClasses} 
                        style={{ fontSize: descriptionFontSize ? `${descriptionFontSize}px` : 'var(--slide-desc-size)' }}
                        data-export-role="description-intro-target"
                    >
                        {description}
                    </p>
                </div>
            </div>

            {/* Image Section - Only render if not text-only */}
            {!isTextOnly && (
                <div className={`flex-1 flex justify-center items-center relative z-10 h-full ${useExportFrameInjection ? '' : `anim-outro-wrapper ${imgOutroClass}`}`} style={imgOutroStyle} data-export-role="image-outro">
                    <div className={`w-full h-full flex items-center justify-center ${useExportFrameInjection ? '' : 'anim-content'} ${imgIntroClass}`} style={imgIntroStyle} data-export-role="image-intro">
                        {/* Visual Wrapper for Effects */}
                        <div className="slide-visual-wrapper relative flex justify-center items-center">
                              <img 
                                  src={imageUrl} 
                                  alt="Slide Visual"
                                  crossOrigin="anonymous" 
                                  className="slide-image relative z-10 block"
                                  style={{ 
                                      maxHeight: 'var(--slide-img-max-height)', 
                                      maxWidth: '100%',
                                      objectFit: 'contain',
                                      margin: 0,
                                      padding: 0,
                                      border: 'none',
                                      outline: 'none',
                                      transform: 'none',
                                      boxShadow: 'inherit' // Allow themes to set box-shadow on image
                                  }}
                              />
                              {/* Dynamic Effect Layers - Controlled */}
                              <div className="slide-image-effect effect-1 absolute inset-0 z-0 pointer-events-none" style={getRippleStyle(0)}></div>
                              <div className="slide-image-effect effect-2 absolute inset-0 z-0 pointer-events-none" style={getRippleStyle(1)}></div>
                              <div className="slide-image-effect effect-3 absolute inset-0 z-0 pointer-events-none" style={getRippleStyle(2)}></div>
                        </div>
                    </div>
                </div>
            )}
        </>
      </div>
  );
};

export default SlideRenderer;
