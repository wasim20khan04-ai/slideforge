
import React, { useState } from 'react';
import { SlideData, TRANSITIONS, SlideLayout, DEFAULT_FONT_SIZES } from '../types';
import { Image as ImageIcon, Type, Link, Clock, Plus, Trash2, Zap, LogOut, GripVertical, X, Copy, Eye } from 'lucide-react';
import SlideRenderer from './SlideRenderer';

interface EditorSidebarProps {
  slides: SlideData[];
  currentSlideIndex: number;
  onUpdateSlide: (updatedSlide: SlideData) => void;
  onAddSlide: (layout: SlideLayout) => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onSelectSlide: (index: number) => void;
  onReorderSlides?: (fromIndex: number, toIndex: number) => void;
  onUpdateGlobalSettings: (field: 'badgeFontSize' | 'titleFontSize' | 'descriptionFontSize', value: number) => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
    slides, 
    currentSlideIndex, 
    onUpdateSlide, 
    onAddSlide, 
    onDuplicateSlide,
    onDeleteSlide, 
    onSelectSlide, 
    onReorderSlides,
    onUpdateGlobalSettings
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'slides'>('content');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const currentSlide = slides[currentSlideIndex];

  const handleChange = (field: keyof SlideData, value: string | number | boolean) => {
    onUpdateSlide({ ...currentSlide, [field]: value });
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    setDragOverItemIndex(index);
  };

  const handleDragLeave = () => {
    // setDragOverItemIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex !== null && draggedItemIndex !== index && onReorderSlides) {
      onReorderSlides(draggedItemIndex, index);
    }
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  return (
    <div className="w-[400px] h-full bg-[#1e1e1e] border-l border-gray-800 flex flex-col text-sm">
      {/* Tabs */}
      <div className="flex border-b border-gray-800 shrink-0">
        <button
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === 'content'
              ? 'text-white border-b-2 border-white'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('content')}
        >
          Content
        </button>
        <button
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === 'slides'
              ? 'text-white border-b-2 border-white'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('slides')}
        >
          Slides
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {activeTab === 'content' && (
          <>
            {/* Badge Input */}
            <div className="space-y-3">
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Type size={14} /> Badge
              </label>
              <input
                type="text"
                value={currentSlide.badge}
                onChange={(e) => handleChange('badge', e.target.value)}
                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
                placeholder="e.g. Step 2"
              />
              <div className="flex items-center gap-2 bg-[#141414] p-2 rounded border border-gray-800">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase w-20">Size (px)</span>
                  <input 
                    type="number"
                    value={currentSlide.badgeFontSize || DEFAULT_FONT_SIZES.badge}
                    onChange={(e) => onUpdateGlobalSettings('badgeFontSize', Number(e.target.value))}
                    className="w-16 bg-[#2a2a2a] border border-gray-700 rounded p-1 text-xs text-center text-white focus:border-indigo-500 outline-none"
                  />
                  <span className="text-[10px] text-indigo-400 ml-auto opacity-70">Global</span>
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-3">
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Type size={14} /> Title
              </label>
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
                placeholder="Enter slide title"
              />
               <div className="flex items-center gap-2 bg-[#141414] p-2 rounded border border-gray-800">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase w-20">Size (px)</span>
                  <input 
                    type="number"
                    value={currentSlide.titleFontSize || DEFAULT_FONT_SIZES.title}
                    onChange={(e) => onUpdateGlobalSettings('titleFontSize', Number(e.target.value))}
                    className="w-16 bg-[#2a2a2a] border border-gray-700 rounded p-1 text-xs text-center text-white focus:border-indigo-500 outline-none"
                  />
                  <span className="text-[10px] text-indigo-400 ml-auto opacity-70">Global</span>
              </div>
            </div>

            {/* Description Input */}
            <div className="space-y-3">
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Type size={14} /> Description
              </label>
              <textarea
                value={currentSlide.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full h-32 bg-[#2a2a2a] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none placeholder-gray-600 leading-relaxed"
                placeholder="Enter slide description..."
              />
              <div className="flex items-center gap-2 bg-[#141414] p-2 rounded border border-gray-800">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase w-20">Size (px)</span>
                  <input 
                    type="number"
                    value={currentSlide.descriptionFontSize || DEFAULT_FONT_SIZES.description}
                    onChange={(e) => onUpdateGlobalSettings('descriptionFontSize', Number(e.target.value))}
                    className="w-16 bg-[#2a2a2a] border border-gray-700 rounded p-1 text-xs text-center text-white focus:border-indigo-500 outline-none"
                  />
                  <span className="text-[10px] text-indigo-400 ml-auto opacity-70">Global</span>
              </div>
            </div>

            {/* Image Inputs (Hidden for Text Only) */}
            {currentSlide.layout !== 'text-only' && (
                <div className="space-y-3">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Link size={14} /> Image URL
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={currentSlide.imageUrl}
                        onChange={(e) => handleChange('imageUrl', e.target.value)}
                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md p-3 pl-10 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600 truncate text-xs"
                        placeholder="https://..."
                    />
                    <ImageIcon className="absolute left-3 top-3 text-gray-500" size={16} />
                </div>
                </div>
            )}

            {/* Transitions Section */}
            <div className="space-y-4">
                 <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700 pb-2">
                    Animations
                 </div>
                 
                 <div className="grid grid-cols-1 gap-5">
                    {/* Text Transition Intro */}
                    <div className="space-y-2">
                        <label className="text-gray-400 text-xs flex items-center gap-2">
                            <Zap size={14} /> Text Enter
                        </label>
                        <div className="grid grid-cols-[1fr_80px] gap-2">
                            <div className="relative">
                                <select
                                    value={currentSlide.textTransition || 'none'}
                                    onChange={(e) => handleChange('textTransition', e.target.value)}
                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer text-xs"
                                >
                                    {TRANSITIONS.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="0.1"
                                    value={currentSlide.textTransitionDuration ?? 1}
                                    onChange={(e) => handleChange('textTransitionDuration', parseFloat(e.target.value))}
                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-xs text-center"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">s</span>
                            </div>
                        </div>
                    </div>

                    {/* Text Transition Outro */}
                    <div className="space-y-2">
                        <label className="text-gray-400 text-xs flex items-center gap-2">
                            <LogOut size={14} /> Text Exit
                        </label>
                         <div className="grid grid-cols-[1fr_80px] gap-2">
                            <div className="relative">
                                <select
                                    value={currentSlide.textOutroTransition || 'none'}
                                    onChange={(e) => handleChange('textOutroTransition', e.target.value)}
                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer text-xs"
                                >
                                    {TRANSITIONS.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="0.1"
                                    value={currentSlide.textOutroDuration ?? 1}
                                    onChange={(e) => handleChange('textOutroDuration', parseFloat(e.target.value))}
                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-xs text-center"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">s</span>
                            </div>
                        </div>
                    </div>

                    {/* Image Transition Intro (Hidden for Text Only) */}
                    {currentSlide.layout !== 'text-only' && (
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs flex items-center gap-2">
                                <Zap size={14} /> Image Enter
                            </label>
                            <div className="grid grid-cols-[1fr_80px] gap-2">
                                <div className="relative">
                                    <select
                                        value={currentSlide.imageTransition || 'none'}
                                        onChange={(e) => handleChange('imageTransition', e.target.value)}
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer text-xs"
                                    >
                                        {TRANSITIONS.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        min="0.1"
                                        value={currentSlide.imageTransitionDuration ?? 1}
                                        onChange={(e) => handleChange('imageTransitionDuration', parseFloat(e.target.value))}
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-xs text-center"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">s</span>
                                </div>
                            </div>
                        </div>
                    )}

                     {/* Image Transition Outro (Hidden for Text Only) */}
                     {currentSlide.layout !== 'text-only' && (
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs flex items-center gap-2">
                                <LogOut size={14} /> Image Exit
                            </label>
                            <div className="grid grid-cols-[1fr_80px] gap-2">
                                <div className="relative">
                                    <select
                                        value={currentSlide.imageOutroTransition || 'none'}
                                        onChange={(e) => handleChange('imageOutroTransition', e.target.value)}
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer text-xs"
                                    >
                                        {TRANSITIONS.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        min="0.1"
                                        value={currentSlide.imageOutroDuration ?? 1}
                                        onChange={(e) => handleChange('imageOutroDuration', parseFloat(e.target.value))}
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-xs text-center"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">s</span>
                                </div>
                            </div>
                        </div>
                     )}
                </div>
            </div>

            {/* Visibility Overrides (New Section) */}
            <div className="space-y-4 pt-4 border-t border-gray-800">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 flex items-center gap-2">
                    <Eye size={14} /> Visibility Overrides
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {/* Text Section */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 font-medium block">Text Visibility</label>
                         {/* Checkbox for Start */}
                         <label className="flex items-center gap-2 cursor-pointer group hover:bg-white/5 p-1 rounded transition-colors -ml-1">
                            <input 
                                type="checkbox" 
                                checked={currentSlide.skipTextEnterVisibility || false}
                                onChange={(e) => handleChange('skipTextEnterVisibility', e.target.checked)}
                                className="w-3 h-3 rounded border-gray-700 bg-[#2a2a2a] checked:bg-indigo-500 checked:border-indigo-500 transition-colors focus:ring-0 focus:ring-offset-0"
                            />
                            <span className="text-xs text-gray-400 group-hover:text-gray-300">Keep Visible at Start</span>
                         </label>
                         {/* Checkbox for End */}
                         <label className="flex items-center gap-2 cursor-pointer group hover:bg-white/5 p-1 rounded transition-colors -ml-1">
                            <input 
                                type="checkbox" 
                                checked={currentSlide.skipTextExitVisibility || false}
                                onChange={(e) => handleChange('skipTextExitVisibility', e.target.checked)}
                                className="w-3 h-3 rounded border-gray-700 bg-[#2a2a2a] checked:bg-indigo-500 checked:border-indigo-500 transition-colors focus:ring-0 focus:ring-offset-0"
                            />
                            <span className="text-xs text-gray-400 group-hover:text-gray-300">Keep Visible at End</span>
                         </label>
                    </div>

                    {/* Image Section (only if not text-only) */}
                    {currentSlide.layout !== 'text-only' && (
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 font-medium block">Image Visibility</label>
                             <label className="flex items-center gap-2 cursor-pointer group hover:bg-white/5 p-1 rounded transition-colors -ml-1">
                                <input 
                                    type="checkbox" 
                                    checked={currentSlide.skipImageEnterVisibility || false}
                                    onChange={(e) => handleChange('skipImageEnterVisibility', e.target.checked)}
                                    className="w-3 h-3 rounded border-gray-700 bg-[#2a2a2a] checked:bg-indigo-500 checked:border-indigo-500 transition-colors focus:ring-0 focus:ring-offset-0"
                                />
                                <span className="text-xs text-gray-400 group-hover:text-gray-300">Keep Visible at Start</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer group hover:bg-white/5 p-1 rounded transition-colors -ml-1">
                                <input 
                                    type="checkbox" 
                                    checked={currentSlide.skipImageExitVisibility || false}
                                    onChange={(e) => handleChange('skipImageExitVisibility', e.target.checked)}
                                    className="w-3 h-3 rounded border-gray-700 bg-[#2a2a2a] checked:bg-indigo-500 checked:border-indigo-500 transition-colors focus:ring-0 focus:ring-offset-0"
                                />
                                <span className="text-xs text-gray-400 group-hover:text-gray-300">Keep Visible at End</span>
                             </label>
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-gray-600 italic leading-relaxed">
                    Check these to keep elements visible during the very first or last frame. Useful for seamless transitions where content should not disappear.
                </p>
            </div>

            {/* Slide Duration Input - Standard Decimal Seconds */}
            <div className="space-y-3 pt-4 border-t border-gray-800">
               <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                 <Clock size={14} /> Slide Duration
               </label>
               <div className="relative">
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.5"
                    value={currentSlide.duration} 
                    onChange={(e) => handleChange('duration', parseFloat(e.target.value))}
                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="5.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs">sec</span>
               </div>
            </div>

          </>
        )}

        {activeTab === 'slides' && (
            <div className="space-y-4">
                {slides.map((s, index) => {
                    const thumbScale = 0.16;
                    const isDragging = draggedItemIndex === index;
                    const isDragOver = dragOverItemIndex === index;
                    
                    let dropIndicatorClass = '';
                    if (isDragOver && draggedItemIndex !== null) {
                        if (draggedItemIndex < index) {
                             dropIndicatorClass = 'border-b-4 border-b-indigo-500';
                        } else {
                             dropIndicatorClass = 'border-t-4 border-t-indigo-500';
                        }
                    }

                    return (
                        <div 
                            key={s.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`group relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer 
                                ${index === currentSlideIndex && !isDragOver ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-gray-700 hover:border-gray-500'}
                                ${isDragging ? 'opacity-40 scale-95 border-dashed border-gray-600' : ''}
                                ${dropIndicatorClass}
                            `}
                            onClick={() => onSelectSlide(index)}
                        >
                            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-2 pointer-events-none">
                                <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-mono text-white/80">
                                    {index + 1}
                                </div>
                                <div className="text-white/50 bg-black/40 rounded p-0.5">
                                   <GripVertical size={14} />
                                </div>
                            </div>
                            
                            <div className="bg-[#050505] relative w-full aspect-video pointer-events-none">
                                <div 
                                    className="absolute top-0 left-0 origin-top-left"
                                    style={{ transform: `scale(${thumbScale})` }}
                                >
                                    <SlideRenderer data={s} scale={1} animate={false} />
                                </div>
                            </div>
                            
                            {slides.length > 1 && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSlide(index);
                                    }}
                                    className="absolute top-2 right-2 z-30 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete Slide"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    );
                })}

                {/* ADD SLIDE SECTION */}
                {!isAddMenuOpen ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onDuplicateSlide(currentSlideIndex)}
                            className="flex-1 py-4 border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-all hover:bg-white/5"
                            title="Duplicate Selected Slide"
                        >
                            <Copy size={20} />
                            <span className="font-medium">Duplicate</span>
                        </button>
                        <button
                            onClick={() => setIsAddMenuOpen(true)}
                            className="flex-1 py-4 border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-all hover:bg-white/5"
                        >
                            <Plus size={20} />
                            <span className="font-medium">Add New</span>
                        </button>
                    </div>
                ) : (
                    <div className="bg-[#141414] border border-gray-700 rounded-lg p-3 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Layout</span>
                            <button 
                                onClick={() => setIsAddMenuOpen(false)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    onAddSlide('text-image');
                                    setIsAddMenuOpen(false);
                                }}
                                className="flex flex-col items-center justify-center gap-3 p-4 border border-gray-700 rounded-lg hover:bg-white/5 hover:border-indigo-500 transition-all group bg-[#1a1a1a]"
                            >
                                <div className="w-12 h-8 border border-gray-600 rounded flex group-hover:border-indigo-400 bg-gray-800">
                                    <div className="w-1/2 border-r border-gray-600 group-hover:border-indigo-400 flex flex-col justify-center gap-1 p-1">
                                        <div className="h-0.5 w-full bg-gray-500 group-hover:bg-indigo-400"></div>
                                        <div className="h-0.5 w-2/3 bg-gray-500 group-hover:bg-indigo-400"></div>
                                    </div>
                                    <div className="w-1/2 bg-gray-700/50 group-hover:bg-indigo-500/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full border border-gray-500 group-hover:border-indigo-400"></div>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-gray-400 group-hover:text-white">Text + Image</span>
                            </button>

                            <button
                                onClick={() => {
                                    onAddSlide('text-only');
                                    setIsAddMenuOpen(false);
                                }}
                                className="flex flex-col items-center justify-center gap-3 p-4 border border-gray-700 rounded-lg hover:bg-white/5 hover:border-indigo-500 transition-all group bg-[#1a1a1a]"
                            >
                                 <div className="w-12 h-8 border border-gray-600 rounded flex flex-col items-center justify-center gap-1 group-hover:border-indigo-400 bg-gray-800">
                                    <div className="w-8 h-0.5 bg-gray-500 group-hover:bg-indigo-400"></div>
                                    <div className="w-6 h-0.5 bg-gray-500 group-hover:bg-indigo-400"></div>
                                    <div className="w-7 h-0.5 bg-gray-500 group-hover:bg-indigo-400"></div>
                                </div>
                                <span className="text-xs font-medium text-gray-400 group-hover:text-white">Text Only</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default EditorSidebar;
