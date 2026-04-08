
import React from 'react';
import SlideRenderer from './SlideRenderer';
import { SlideData } from '../types';

interface HiddenExportRendererProps {
    slide: SlideData | null;
    progress: number;
}

// Forward ref to allow App to access the div
const HiddenExportRenderer = React.forwardRef<HTMLDivElement, HiddenExportRendererProps>(({ slide, progress }, ref) => {
    if (!slide) return <div ref={ref} style={{ width: 1920, height: 1080 }} />;

    return (
        <div 
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: 1920, 
                height: 1080,
                overflow: 'hidden',
                visibility: 'visible',
                zIndex: 9999, // On top to prevent browser occlusion tracking
                pointerEvents: 'none',
                opacity: 0.01, // Almost invisible to user, but forces browser to render
                transform: 'scale(0.01)', // Make it a tiny dot in the corner
                transformOrigin: 'top left'
            }}
        >
            <div ref={ref} style={{ width: 1920, height: 1080, position: 'relative', backgroundColor: '#050505' }}>
                <SlideRenderer 
                    // Force remount on slide change for clean animation
                    key={`export-${slide.id}`}
                    data={slide} 
                    scale={1} 
                    progress={progress} 
                />
            </div>
        </div>
    );
});

export default HiddenExportRenderer;
