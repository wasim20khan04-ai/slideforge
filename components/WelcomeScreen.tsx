
import React, { useState, useRef } from 'react';
import { LayoutTemplate, Plus, Upload, FileText, Calendar, Edit2, Search, X, Loader2, Copy, Archive, RefreshCw } from 'lucide-react';
import { ProjectMetadata } from '../types';

interface WelcomeScreenProps {
    isOpen: boolean;
    onClose: () => void;
    recentProjects: ProjectMetadata[];
    isLoadingProjects: boolean;
    onNewProject: () => void;
    onLoadProject: (id: string | number) => void;
    onImportProject: (file: File) => void;
    onRenameProject: (id: string | number, newName: string) => void;
    onToggleArchive: (id: string | number) => void;
    onDuplicateProject: (id: string | number) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
    isOpen, onClose,
    recentProjects, isLoadingProjects,
    onNewProject, onLoadProject, onImportProject, onRenameProject, onToggleArchive, onDuplicateProject
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editName, setEditName] = useState('');
    
    // View state: 'recent' or 'archived'
    const [view, setView] = useState<'recent' | 'archived'>('recent');

    if (!isOpen) return null;

    // Filter projects based on the current view (Archived prefix check)
    const viewProjects = recentProjects.filter(p => {
        const name = p.name || '';
        const isArchived = name.startsWith('[ARCHIVED]');
        return view === 'recent' ? !isArchived : isArchived;
    });

    const filteredProjects = viewProjects.filter(p => {
        const name = p.name || '';
        const cleanName = name.replace('[ARCHIVED] ', '');
        return cleanName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleStartRename = (project: ProjectMetadata) => {
        setEditingId(project.id);
        setEditName((project.name || '').replace('[ARCHIVED] ', ''));
    };

    const handleFinishRename = () => {
        if (editingId && editName.trim()) {
            // Keep prefix if in archive mode logic handles in hook, but strictly 
            // the onRenameProject just updates the raw string. 
            // We should check if we are renaming an archived project to keep consistency, 
            // but the hook handles renaming.
            // For safety, let's just pass the new name. If it was archived, the prefix might be lost 
            // unless we re-add it, or we rely on the user moving it back. 
            // Simpler: Just rename. If users rename in Archive view, it unarchives it effectively unless we prepend.
            // Let's prepend if we are in archive view.
            const finalName = view === 'archived' ? `[ARCHIVED] ${editName}` : editName;
            onRenameProject(editingId, finalName);
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleFinishRename();
        if (e.key === 'Escape') setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050505]/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-5xl h-[80vh] bg-[#101010] border border-white/10 rounded-2xl shadow-2xl flex overflow-hidden">
                
                {/* Left Sidebar: Actions */}
                <div className="w-80 bg-[#161616] border-r border-white/5 p-8 flex flex-col gap-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <LayoutTemplate size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl tracking-tight text-white">SlideForge</h1>
                            <p className="text-xs text-gray-500">Presentation Editor</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button 
                            onClick={onNewProject}
                            className="w-full py-4 px-6 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-3 shadow-lg group"
                        >
                            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus size={18} />
                            </div>
                            <span>New Project</span>
                        </button>

                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-4 px-6 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center gap-3 group"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                <Upload size={18} />
                            </div>
                            <span>Import JSON</span>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                accept=".json" 
                                className="hidden" 
                                onChange={(e) => {
                                    if(e.target.files?.[0]) onImportProject(e.target.files[0]);
                                }}
                            />
                        </button>
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Folders</h3>
                        <button 
                            onClick={() => setView('recent')}
                            className={`w-full py-3 px-4 rounded-lg flex items-center gap-3 transition-colors ${view === 'recent' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <LayoutTemplate size={18} />
                            <span>Recent Projects</span>
                        </button>
                        <button 
                            onClick={() => setView('archived')}
                            className={`w-full py-3 px-4 rounded-lg flex items-center gap-3 transition-colors ${view === 'archived' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Archive size={18} />
                            <span>Archive</span>
                        </button>
                    </div>

                    <div className="mt-auto">
                        <button onClick={onClose} className="text-gray-500 hover:text-white text-sm transition-colors flex items-center gap-2">
                           <X size={16} /> Close & Return to Editor
                        </button>
                    </div>
                </div>

                {/* Right Content */}
                <div className="flex-1 flex flex-col bg-[#0a0a0a]">
                    <div className="p-8 pb-4 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            {view === 'recent' ? 'Recent Projects' : 'Archived Projects'}
                            <span className="text-sm font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{filteredProjects.length}</span>
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 w-64 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {isLoadingProjects ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
                                <Loader2 size={32} className="animate-spin text-indigo-500" />
                                <p>Syncing with cloud...</p>
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-600 border-2 border-dashed border-white/5 rounded-xl">
                                {view === 'recent' ? <FileText size={48} className="mb-4 opacity-20" /> : <Archive size={48} className="mb-4 opacity-20" />}
                                <p className="text-lg font-medium">No projects found</p>
                                <p className="text-sm">{view === 'recent' ? "Create a new one to get started." : "Your archived projects will appear here."}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredProjects.map((project) => (
                                    <div 
                                        key={project.id} 
                                        className="group flex items-center p-4 bg-[#141414] border border-white/5 rounded-xl hover:border-indigo-500/30 hover:bg-[#1a1a1a] transition-all relative"
                                    >
                                        <div 
                                            className="flex-1 flex items-center gap-4 cursor-pointer min-w-0"
                                            onClick={() => {
                                                if (editingId !== project.id) onLoadProject(project.id);
                                            }}
                                        >
                                            <div className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border border-white/5 transition-colors ${view === 'archived' ? 'bg-gray-800/50 grayscale' : 'bg-gradient-to-br from-gray-800 to-gray-900 group-hover:from-indigo-900/20 group-hover:to-purple-900/20'}`}>
                                                {view === 'archived' ? <Archive size={20} className="text-gray-500" /> : <LayoutTemplate size={20} className="text-gray-400 group-hover:text-indigo-400" />}
                                            </div>
                                            
                                            <div className="flex flex-col flex-1 min-w-0">
                                                {editingId === project.id ? (
                                                    <input 
                                                        type="text" 
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        onBlur={handleFinishRename}
                                                        onKeyDown={handleKeyDown}
                                                        autoFocus
                                                        className="bg-[#2a2a2a] text-white px-2 py-1 rounded border border-indigo-500 focus:outline-none text-sm font-medium w-full max-w-xs relative z-20"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <h3 className={`font-medium transition-colors truncate ${view === 'archived' ? 'text-gray-400' : 'text-white group-hover:text-indigo-200'}`}>
                                                        {(project.name || '').replace('[ARCHIVED] ', '') || 'Untitled Project'}
                                                    </h3>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <Calendar size={12} />
                                                    <span>{new Date(project.updated_at).toLocaleDateString()} at {new Date(project.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pl-4 ml-2 border-l border-white/5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDuplicateProject(project.id);
                                                }}
                                                className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                title="Duplicate"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartRename(project);
                                                }}
                                                className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                title="Rename"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            
                                            {/* Toggle Archive Button */}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleArchive(project.id);
                                                }}
                                                className={`p-2 rounded-lg transition-colors ${view === 'recent' ? 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10' : 'text-gray-500 hover:text-green-400 hover:bg-green-500/10'}`}
                                                title={view === 'recent' ? "Move to Archive" : "Restore to Recent"}
                                            >
                                                {view === 'recent' ? <Archive size={16} /> : <RefreshCw size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default WelcomeScreen;
