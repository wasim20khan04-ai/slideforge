
import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface PreviewControlsProps {
  currentSlideIndex: number;
  totalSlides: number;
  onNext: () => void;
  onPrev: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  progress: number;
  onScrub: (progress: number) => void;
}

const PreviewControls: React.FC<PreviewControlsProps> = ({ 
  currentSlideIndex, 
  totalSlides, 
  onNext, 
  onPrev,
  isPlaying,
  onTogglePlay,
  progress,
  onScrub
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const calculateProgress = (clientX: number) => {
    if (!progressBarRef.current) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    return Math.max(0, Math.min(100, (x / width) * 100));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    const newProgress = calculateProgress(e.clientX);
    onScrub(newProgress);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDragging.current) {
        const p = calculateProgress(moveEvent.clientX);
        onScrub(p);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#141414]/90 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl z-50">
      
      {/* Navigation Buttons */}
      <div className="flex items-center gap-4">
        <button onClick={onPrev} className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
        </button>
        <button 
            onClick={onTogglePlay}
            className="text-white hover:text-gray-200 transition-colors flex items-center justify-center w-5 h-5"
        >
            {isPlaying ? (
                <Pause size={20} fill="currentColor" className="opacity-90"/>
            ) : (
                <Play size={20} fill="currentColor" className="opacity-90 ml-0.5"/>
            )}
        </button>
        <button onClick={onNext} className="text-gray-400 hover:text-white transition-colors">
            <ChevronRight size={20} />
        </button>
      </div>

      {/* Progress Bar */}
      <div 
        ref={progressBarRef}
        className="w-64 h-1.5 bg-gray-700 rounded-full relative group cursor-pointer py-2 -my-2 bg-clip-content"
        onMouseDown={handleMouseDown}
      >
        {/* Track */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1.5 bg-gray-700 rounded-full pointer-events-none"></div>

        {/* Fill */}
        <div 
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-indigo-500 rounded-full pointer-events-none"
            style={{ width: `${progress}%` }}
        ></div>
        
        {/* Handle */}
        <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-400 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
            style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
        ></div>
      </div>

      {/* Counter */}
      <div className="text-xs font-mono text-gray-400 tracking-wider w-[50px] text-right">
        {currentSlideIndex} / {totalSlides}
      </div>

    </div>
  );
};

export default PreviewControls;
