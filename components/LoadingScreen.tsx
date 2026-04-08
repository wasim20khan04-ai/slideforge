
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-[#050505] text-white gap-3">
            <Loader2 className="animate-spin text-indigo-500" />
            <span>Loading your presentation...</span>
        </div>
    );
};

export default LoadingScreen;
