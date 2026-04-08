
import React, { useRef, useState, useEffect } from 'react';
import { Cloud, Loader2, AlertCircle, Type, ChevronDown, Check, Shuffle, FolderOpen, FilePlus, Upload, FileDown, Download, Home } from 'lucide-react';
import { SlideData, ThemeId, THEMES, TypographyId, TYPOGRAPHY_STYLES } from '../types';

interface TopBarProps {
    currentSlide: SlideData;
    currentProjectName: string;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    isExporting: boolean;
    onApplyTheme: (id: ThemeId) => void;
    onApplyTypography: (id: TypographyId) => void;
    onRandomize: () => void;
    onManualSave: () => void;
    onNewProject: () => void;
    onLoadProject: (file: File) => void;
    onSaveProject: () => void;
    onOpenExport: (scope: 'current' | 'all') => void;
    onOpenWelcome: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
    currentSlide, currentProjectName, saveStatus, isExporting,
    onApplyTheme, onApplyTypography, onRandomize, onManualSave,
    onNewProject, onLoadProject, onSaveProject, onOpenExport, onOpenWelcome
}) => {
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isProjOpen, setIsProjOpen] = useState(false);
    const [isExpOpen, setIsExpOpen] = useState(false);

    const themeRef = useRef<HTMLDivElement>(null);
    const typeRef = useRef<HTMLDivElement>(null);
    const projRef = useRef<HTMLDivElement>(null);
    const expRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Click outside handler
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (themeRef.current && !themeRef.current.contains(target)) setIsThemeOpen(false);
            if (typeRef.current && !typeRef.current.contains(target)) setIsTypeOpen(false);
            if (projRef.current && !projRef.current.contains(target)) setIsProjOpen(false);
            if (expRef.current && !expRef.current.contains(target)) setIsExpOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            onLoadProject(e.target.files[0]);
            e.target.value = '';
        }
        setIsProjOpen(false);
    };

    return (
        <header className="h-16 border-b border-white/10 bg-[#0f0f0f] flex items-center justify-between px-6 shrink-0 z-50">
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            {/* Left: Branding & Status */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={onOpenWelcome}
                    className="p-2 bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 rounded-lg text-white transition-colors flex items-center justify-center group"
                    title="Home / Projects"
                >
                    <Home size={18} className="group-hover:text-indigo-400 transition-colors" />
                </button>
                
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-white tracking-tight">{currentProjectName || "SlideForge"}</span>
                    <div className="flex items-center gap-1.5">
                        {saveStatus === 'saving' && <><Loader2 size={10} className="animate-spin text-indigo-400" /><span className="text-[10px] text-indigo-300">Saving...</span></>}
                        {saveStatus === 'saved' && <><Cloud size={10} className="text-green-400" /><span className="text-[10px] text-green-300">Saved</span></>}
                        {saveStatus === 'error' && <><AlertCircle size={10} className="text-red-400" /><span className="text-[10px] text-red-300">Error</span></>}
                        {saveStatus === 'idle' && <><Cloud size={10} className="text-gray-500" /><span className="text-[10px] text-gray-500">Synced</span></>}
                    </div>
                </div>
            </div>

            {/* Center: Style Controls */}
            <div className="flex items-center gap-3">
                {/* Typography */}
                <div className="relative" ref={typeRef}>
                    <button onClick={() => setIsTypeOpen(!isTypeOpen)} className={`flex items-center gap-2 bg-[#1a1a1a] border border-white/10 px-4 py-2 rounded-md hover:bg-[#252525] transition-colors text-sm font-medium ${isTypeOpen ? 'bg-[#252525] border-white/30' : ''}`}>
                        <Type size={14} className="text-gray-400" />
                        <span className="hidden sm:inline">{TYPOGRAPHY_STYLES.find(t => t.id === currentSlide.typography)?.name || 'Font'}</span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isTypeOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 max-h-80 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-md shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 custom-scrollbar">
                            {TYPOGRAPHY_STYLES.map(t => (
                                <button key={t.id} onClick={() => { onApplyTypography(t.id); setIsTypeOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${currentSlide.typography === t.id ? 'text-indigo-400 font-medium' : 'text-gray-300'}`}>
                                    {t.name} {currentSlide.typography === t.id && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme */}
                <div className="relative" ref={themeRef}>
                    <button onClick={() => setIsThemeOpen(!isThemeOpen)} className={`flex items-center gap-2 bg-[#1a1a1a] border border-white/10 px-4 py-2 rounded-md hover:bg-[#252525] transition-colors text-sm font-medium ${isThemeOpen ? 'bg-[#252525] border-white/30' : ''}`}>
                        <span className="hidden sm:inline">{THEMES.find(t => t.id === currentSlide.theme)?.name || 'Theme'}</span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isThemeOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isThemeOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 max-h-80 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-md shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 custom-scrollbar">
                            {THEMES.map(t => (
                                <button key={t.id} onClick={() => { onApplyTheme(t.id); setIsThemeOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${currentSlide.theme === t.id ? 'text-indigo-400 font-medium' : 'text-gray-300'}`}>
                                    {t.name} {currentSlide.theme === t.id && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Random */}
                <button onClick={onRandomize} className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 px-3 py-2 rounded-md hover:bg-[#252525] transition-colors text-sm font-medium text-gray-400 hover:text-white group" title="Randomize Typography">
                    <Shuffle size={16} className="group-hover:text-indigo-400 transition-colors" />
                    <span className="hidden sm:inline">Random</span>
                </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Project */}
                <div className="relative" ref={projRef}>
                    <button onClick={() => setIsProjOpen(!isProjOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 ${isProjOpen ? 'bg-white/5 text-white' : ''}`}>
                        <FolderOpen size={20} /><span className="hidden sm:inline">File</span><ChevronDown size={14} className={`transition-transform ${isProjOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isProjOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-md shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => { setIsProjOpen(false); setTimeout(onNewProject, 50); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-3 text-gray-200">
                                <FilePlus size={16} className="text-blue-400" /><div className="flex flex-col gap-0.5"><span className="font-medium">New Project</span><span className="text-[10px] text-gray-500">Start fresh (Auto-saved)</span></div>
                            </button>
                            <div className="h-px bg-white/5 mx-2"></div>
                            <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-3 text-gray-200">
                                <Upload size={16} className="text-indigo-400" /><div className="flex flex-col gap-0.5"><span className="font-medium">Import JSON</span><span className="text-[10px] text-gray-500">Create new from file</span></div>
                            </button>
                            <div className="h-px bg-white/5 mx-2"></div>
                            <button onClick={() => { onSaveProject(); setIsProjOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-3 text-gray-200">
                                <FileDown size={16} className="text-green-400" /><div className="flex flex-col gap-0.5"><span className="font-medium">Download JSON</span><span className="text-[10px] text-gray-500">Save local backup</span></div>
                            </button>
                        </div>
                    )}
                </div>

                {/* Save Cloud */}
                <button onClick={onManualSave} className={`p-2 rounded-md transition-colors relative flex items-center justify-center ${saveStatus === 'error' ? 'text-red-500 hover:bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} title="Force Save to Cloud">
                    {saveStatus === 'saving' ? <Loader2 size={20} className="animate-spin" /> : <Cloud size={20} />}
                </button>

                {/* Export */}
                <div className="relative" ref={expRef}>
                    <button onClick={() => setIsExpOpen(!isExpOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${isExporting ? 'text-indigo-400 bg-indigo-500/10 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isExpOpen ? 'bg-white/5 text-white' : ''}`} disabled={isExporting}>
                        <Download size={20} /><span className="hidden sm:inline">Export</span><ChevronDown size={14} className={`transition-transform ${isExpOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpOpen && !isExporting && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-md shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => { onOpenExport('current'); setIsExpOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex flex-col gap-0.5">
                                <span className="text-gray-200 font-medium">Current Slide</span><span className="text-xs text-gray-500">Export this slide only</span>
                            </button>
                            <div className="h-px bg-white/5 mx-2"></div>
                            <button onClick={() => { onOpenExport('all'); setIsExpOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex flex-col gap-0.5">
                                <span className="text-gray-200 font-medium">All Slides</span><span className="text-xs text-gray-500">Export full presentation</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopBar;
