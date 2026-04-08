
import React, { useRef, useMemo } from 'react';
import { SlideData } from '../types';
import { Play, Pause } from 'lucide-react';

interface GlobalTimelineProps {
    slides: SlideData[];
    currentSlideIndex: number;
    currentSlideProgress: number; // 0-100
    isPlaying: boolean;
    onTogglePlay: () => void;
    onSeek: (totalProgress: number) => void; // 0-100
    onSeekStart?: () => void;
    onSeekEnd?: () => void;
}

const GlobalTimeline: React.FC<GlobalTimelineProps> = ({
    slides,
    currentSlideIndex,
    currentSlideProgress,
    isPlaying,
    onTogglePlay,
    onSeek,
    onSeekStart,
    onSeekEnd
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    // Calculate total duration and segments
    const { totalDuration, segments } = useMemo(() => {
        const total = slides.reduce((acc, s) => acc + (s.duration || 5), 0);
        const segs = slides.reduce((acc, slide, index) => {
            const start = acc.accumulated;
            const d = slide.duration || 5;
            const widthPercent = (d / total) * 100;
            
            acc.result.push({
                index,
                title: slide.title,
                badge: slide.badge,
                widthPercent,
                startPercent: (start / total) * 100
            });
            
            acc.accumulated += d;
            return acc;
        }, { accumulated: 0, result: [] as { index: number, title: string, badge: string | undefined, widthPercent: number, startPercent: number }[] }).result;

        return { totalDuration: total || 1, segments: segs };
    }, [slides]);

    // Calculate Global Playhead Position
    const currentSegment = segments[currentSlideIndex];
    const globalProgress = currentSegment 
        ? currentSegment.startPercent + (currentSegment.widthPercent * (currentSlideProgress / 100))
        : 0;

    const calculateProgress = (clientX: number) => {
        if (!containerRef.current) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        return Math.max(0, Math.min(100, (x / rect.width) * 100));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        if (onSeekStart) onSeekStart();
        onSeek(calculateProgress(e.clientX));

        const handleMouseMove = (ev: MouseEvent) => {
            if (isDragging.current) {
                onSeek(calculateProgress(ev.clientX));
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            if (onSeekEnd) onSeekEnd();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="w-full px-6 pb-6 pt-2 select-none group">
            {/* Header / Time Display */}
            <div className="flex justify-between items-center mb-3 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
                        className={`flex items-center justify-center w-6 h-6 rounded-full border border-white/10 transition-all ${isPlaying ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <span className="font-semibold text-gray-400">Global Timeline</span>
                </div>
                <span>{((globalProgress / 100) * totalDuration).toFixed(1)}s / {totalDuration.toFixed(1)}s</span>
            </div>

            {/* Timeline Track */}
            <div 
                ref={containerRef}
                className="h-10 w-full bg-[#111] rounded-md relative cursor-pointer overflow-hidden border border-white/5 hover:border-white/10 transition-colors"
                onMouseDown={handleMouseDown}
            >
                {/* Segments */}
                <div className="absolute inset-0 flex">
                    {segments.map((seg, i) => (
                        <div 
                            key={i}
                            style={{ width: `${seg.widthPercent}%` }}
                            className={`h-full border-r border-[#000] relative group/segment ${i === currentSlideIndex ? 'bg-white/5' : 'bg-transparent'}`}
                        >
                            {/* Segment Label (Badge) */}
                            <div className={`absolute top-2 left-2 text-[9px] font-bold truncate max-w-full px-1 py-0.5 rounded ${i === currentSlideIndex ? 'text-white bg-indigo-500/20' : 'text-gray-600'}`}>
                                {seg.badge}
                            </div>
                            
                            {/* Hover tooltip logic */}
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/10 group-hover/segment:bg-white/20 transition-colors"></div>
                        </div>
                    ))}
                </div>

                {/* Global Playhead & Fill */}
                <div 
                    className="absolute top-0 bottom-0 left-0 bg-indigo-500/10 pointer-events-none border-r-2 border-indigo-500 z-10"
                    style={{ width: `${globalProgress}%` }}
                >
                    {/* Glowing head */}
                    <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

            </div>
        </div>
    );
};

export default GlobalTimeline;
