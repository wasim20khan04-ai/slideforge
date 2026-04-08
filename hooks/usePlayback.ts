
import { useState, useEffect, useRef, useCallback } from 'react';

export const usePlayback = (duration: number = 5, onEnd?: () => void) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    // Ref to access latest callback without re-triggering effect
    const onEndRef = useRef(onEnd);
    useEffect(() => {
        onEndRef.current = onEnd;
    }, [onEnd]);

    const reset = useCallback(() => {
        setIsPlaying(false);
        // Default start at a visible point (e.g., 20% or 1s in)
        const startSec = 1;
        const startProg = duration > 0 ? (startSec / duration) * 100 : 0;
        setProgress(Math.min(startProg, 100));
    }, [duration]);

    // Animation Loop
    useEffect(() => {
        let rafId: number;
        let lastTime: number | undefined;

        const animate = (time: number) => {
            if (lastTime !== undefined) {
                const delta = (time - lastTime) / 1000;
                setProgress(prev => {
                    const inc = (delta / duration) * 100;
                    const next = prev + inc;
                    
                    if (next >= 100) {
                        // Check if we just finished (avoid repeated calls if state hasn't updated yet)
                        if (prev < 100) {
                            setIsPlaying(false); // Pause loop
                            if (onEndRef.current) {
                                onEndRef.current();
                            }
                        }
                        return 100;
                    }
                    return next;
                });
            }
            lastTime = time;
            if (isPlaying) rafId = requestAnimationFrame(animate);
        };

        if (isPlaying) rafId = requestAnimationFrame(animate);
        else lastTime = undefined;

        return () => { if (rafId) cancelAnimationFrame(rafId); };
    }, [isPlaying, duration]);

    return {
        isPlaying,
        setIsPlaying, // Exposed
        progress,
        setProgress, // Exposed
        togglePlay: useCallback(() => setIsPlaying(prev => !prev), []),
        scrub: useCallback((p: number) => {
            setIsPlaying(false);
            setProgress(p);
        }, []),
        reset
    };
};
