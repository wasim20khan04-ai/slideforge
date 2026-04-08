
import React, { useState, useEffect, useRef } from 'react';
import { Film, Settings, X, Monitor, Archive, FileImage, Image, List, CheckCircle, Loader2, AlertCircle, Trash2, Play, Folder, Terminal } from 'lucide-react';
import { ExportJob, THEMES } from '../types';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    
    // UI State
    tab: 'settings' | 'queue';
    setTab: (t: 'settings' | 'queue') => void;
    
    // Export Settings
    scope: 'current' | 'all';
    slideCount: number;
    currentSlideBadge: string;
    
    quality: '720p' | '1080p' | '4k';
    setQuality: (q: '720p' | '1080p' | '4k') => void;
    
    bitrate: 'low' | 'medium' | 'high';
    setBitrate: (b: 'low' | 'medium' | 'high') => void;

    fps: 30 | 60;
    setFps: (f: 30 | 60) => void;
    
    format: 'mp4' | 'zip' | 'folder';
    setFormat: (f: 'mp4' | 'zip' | 'folder') => void;
    
    imageFormat: 'jpeg' | 'png';
    setImageFormat: (f: 'jpeg' | 'png') => void;

    // Execution
    isExporting: boolean;
    progress: number;
    queue: ExportJob[];
    exportLogs: string[]; // NEW

    onQueue: () => void;
    onStart: () => void;
    onProcessQueue: () => void;
    onDeleteJob: (id: string) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
    isOpen, onClose, tab, setTab,
    scope, slideCount, currentSlideBadge,
    quality, setQuality, bitrate, setBitrate, fps, setFps, format, setFormat, imageFormat, setImageFormat,
    isExporting, progress, queue, exportLogs,
    onQueue, onStart, onProcessQueue, onDeleteJob
}) => {
    const [showLogs, setShowLogs] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        if (showLogs && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [exportLogs, showLogs]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#141414] border border-gray-800 rounded-xl shadow-2xl w-[550px] overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#1a1a1a] shrink-0">
                    <div className="flex items-center gap-2 text-white font-medium">
                        {isExporting ? <Film size={18} className="text-indigo-500"/> : <Settings size={18} className="text-gray-400"/>}
                        {isExporting ? "Processing Export..." : "Export Center"}
                    </div>
                    {!isExporting && (
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Tabs */}
                {!isExporting && (
                    <div className="flex border-b border-gray-800 bg-[#1a1a1a] shrink-0">
                        <button onClick={() => setTab('settings')} className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${tab === 'settings' ? 'border-indigo-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Export Settings</button>
                        <button onClick={() => setTab('queue')} className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${tab === 'queue' ? 'border-indigo-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                            Export Queue {queue.length > 0 && <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{queue.length}</span>}
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    
                    {/* Settings Tab */}
                    {!isExporting && tab === 'settings' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* Info */}
                            <div className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                <Monitor className="text-indigo-400" size={20} />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-indigo-300">Exporting {scope === 'current' ? "Current Slide" : "All Slides"}</div>
                                    <div className="text-xs text-indigo-400/60">{scope === 'current' ? currentSlideBadge : `${slideCount} slides combined`}</div>
                                </div>
                            </div>
                            
                            {/* Format */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Format</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button onClick={() => setFormat('mp4')} className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${format === 'mp4' ? 'bg-white text-black border-white' : 'bg-[#1e1e1e] border-gray-700 text-gray-400'}`}><Film size={18}/><div className="flex flex-col items-start"><span className="font-bold text-sm">Video</span><span className="text-[10px] opacity-70">MP4</span></div></button>
                                    <button onClick={() => setFormat('zip')} className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${format === 'zip' ? 'bg-white text-black border-white' : 'bg-[#1e1e1e] border-gray-700 text-gray-400'}`}><Archive size={18}/><div className="flex flex-col items-start"><span className="font-bold text-sm">ZIP</span><span className="text-[10px] opacity-70">Archive</span></div></button>
                                    <button onClick={() => setFormat('folder')} className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${format === 'folder' ? 'bg-white text-black border-white' : 'bg-[#1e1e1e] border-gray-700 text-gray-400'}`}><Folder size={18}/><div className="flex flex-col items-start"><span className="font-bold text-sm">Folder</span><span className="text-[10px] opacity-70">Extension</span></div></button>
                                </div>
                            </div>

                            {/* Image Format (ZIP or Folder) */}
                            {(format === 'zip' || format === 'folder') && (
                                <div className="space-y-3 animate-in fade-in duration-200">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Image Format</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setImageFormat('jpeg')} className={`flex items-center justify-center gap-3 py-3 rounded-lg border transition-all ${imageFormat === 'jpeg' ? 'bg-white text-black border-white' : 'bg-[#1e1e1e] border-gray-700 text-gray-400'}`}><FileImage size={18}/><div className="flex flex-col items-start"><span className="font-bold text-sm">JPEG</span><span className="text-[10px] opacity-70">Small</span></div></button>
                                        <button onClick={() => setImageFormat('png')} className={`flex items-center justify-center gap-3 py-3 rounded-lg border transition-all ${imageFormat === 'png' ? 'bg-white text-black border-white' : 'bg-[#1e1e1e] border-gray-700 text-gray-400'}`}><Image size={18}/><div className="flex flex-col items-start"><span className="font-bold text-sm">PNG</span><span className="text-[10px] opacity-70">Lossless</span></div></button>
                                    </div>
                                    {format === 'folder' && (
                                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-500 text-xs flex items-center gap-2">
                                            <AlertCircle size={16} /> Requires SlideForge Extension installed.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Resolution */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resolution</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['720p', '1080p', '4k'] as const).map(res => (
                                        <button key={res} onClick={() => setQuality(res)} className={`flex flex-col items-center justify-center py-3 rounded-lg border transition-all ${quality === res ? 'bg-white text-black border-white' : 'bg-[#1e1e1e] border-gray-700 text-gray-400'}`}>
                                            <span className="font-bold text-lg">{res}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Frame Rate & Bitrate Group */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Frame Rate */}
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Frame Rate</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setFps(30)} className={`flex flex-col items-center justify-center py-3 rounded-lg border transition-all ${fps === 30 ? 'bg-white text-black border-white' : 'bg-[#1e1e1e] border-gray-700 text-gray-400'}`}>
                                            <span className="font-bold text-sm">30 FPS</span>
                                        </button>
                                        <button onClick={() => setFps(60)} className={`flex flex-col items-center justify-center py-3 rounded-lg border transition-all ${fps === 60 ? 'bg-white text-black border-white' : 'bg-[#1e1e1e] border-gray-700 text-gray-400'}`}>
                                            <span className="font-bold text-sm">60 FPS</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Bitrate (MP4 only) */}
                                {format === 'mp4' && (
                                    <div className="space-y-3 animate-in fade-in duration-200">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bitrate</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['low', 'medium', 'high'] as const).map(b => (
                                                <button key={b} onClick={() => setBitrate(b)} className={`flex flex-col items-center justify-center py-3 rounded-lg border transition-all ${bitrate === b ? 'bg-white text-black border-white' : 'bg-[#1e1e1e] border-gray-700 text-gray-400'}`}>
                                                    <span className="font-bold text-sm capitalize">{b}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Queue Tab */}
                    {!isExporting && tab === 'queue' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {queue.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-3"><List size={40} className="opacity-20"/><span className="text-sm">No jobs. Add one from Settings!</span></div>
                            ) : (
                                <div className="space-y-3">
                                    {queue.map(job => {
                                        const themeId = job.slides[0]?.theme;
                                        const themeName = THEMES.find(t => t.id === themeId)?.name || "Unknown Theme";
                                        return (
                                        <div key={job.id} className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-4 flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${job.status === 'completed' ? 'bg-green-500' : job.status === 'processing' ? 'bg-indigo-500 animate-pulse' : job.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-white flex items-center gap-2">{job.scope === 'current' ? (job.slides[0]?.badge || "Single") : "All Slides"}<span className="text-[10px] bg-gray-700 px-1.5 rounded text-gray-300 uppercase">{job.format}</span></span>
                                                    <span className="text-xs text-gray-500">{job.quality} • {job.fps} FPS • {themeName} • {new Date(job.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {job.status === 'processing' && <Loader2 size={16} className="animate-spin text-indigo-400" />}
                                                {job.status === 'completed' && <CheckCircle size={16} className="text-green-500" />}
                                                {job.status === 'failed' && <AlertCircle size={16} className="text-red-500" />}
                                                {job.status !== 'processing' && <button onClick={() => onDeleteJob(job.id)} className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded transition-colors"><Trash2 size={16} /></button>}
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Processing View */}
                    {isExporting && (
                        <div className="space-y-6 py-4 animate-in fade-in duration-300">
                            <div className="flex flex-col items-center justify-center gap-4 text-center">
                                {progress < 100 ? <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div> : <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center animate-in zoom-in"><CheckCircle size={32} /></div>}
                                <div><div className="text-xl font-bold text-white mb-1">{progress}%</div><div className="text-sm text-gray-400">{progress < 100 ? "Rendering frames..." : "Finalizing..."}</div></div>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div></div>
                            
                            {/* Detailed Logs Toggle */}
                            <div className="flex justify-center">
                                <button 
                                    onClick={() => setShowLogs(!showLogs)} 
                                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-indigo-400 transition-colors"
                                >
                                    <Terminal size={12} />
                                    {showLogs ? "Hide Detailed Logs" : "Show Detailed Logs"}
                                </button>
                            </div>

                            {/* Logs Viewer */}
                            {showLogs && (
                                <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 h-40 overflow-y-auto font-mono text-[10px] text-gray-400 space-y-1 custom-scrollbar shadow-inner">
                                    {exportLogs.map((log, i) => (
                                        <div key={i} className="whitespace-pre-wrap">{log}</div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#1a1a1a] border-t border-gray-800 flex justify-end gap-3 shrink-0">
                    {!isExporting && (
                        <>
                            {tab === 'settings' ? (
                                <><button onClick={onQueue} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors flex items-center gap-2"><List size={16}/>Queue Export</button><button onClick={onStart} className="px-6 py-2 bg-white text-black text-sm font-bold rounded-md hover:bg-gray-200 transition-colors">Start Export</button></>
                            ) : (
                                <><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">Close</button><button onClick={onProcessQueue} disabled={queue.filter(j => j.status === 'pending').length === 0} className={`px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-md transition-colors flex items-center gap-2 ${queue.filter(j => j.status === 'pending').length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-500'}`}><Play size={16} fill="currentColor"/>Process Queue</button></>
                            )}
                        </>
                    )}
                    {isExporting && <div className="text-xs text-gray-500 italic self-center">Please do not close this window</div>}
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
