
import { useState, useEffect, RefObject } from 'react';

export const useScale = (containerRef: RefObject<HTMLDivElement | null>) => {
    const [scale, setScale] = useState(0.5);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                const targetW = 1920;
                const targetH = 1080;
                const padX = 80;
                const padY = 160;
                
                const availW = clientWidth - padX;
                const availH = clientHeight - padY;
                
                const scaleX = availW / targetW;
                const scaleY = availH / targetH;
                
                setScale(Math.min(scaleX, scaleY));
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [containerRef]);

    return scale;
};
