
import React, { useRef, useState, useEffect, useCallback } from 'react';
import EditorSidebar from './components/EditorSidebar';
import SlideRenderer from './components/SlideRenderer';
import PreviewControls from './components/PreviewControls';
import LoadingScreen from './components/LoadingScreen';
import HiddenExportRenderer from './components/HiddenExportRenderer';
import TopBar from './components/TopBar';
import ExportModal from './components/ExportModal';
import WelcomeScreen from './components/WelcomeScreen';
import GlobalTimeline from './components/GlobalTimeline';

import { usePresentation } from './hooks/usePresentation';
import { usePlayback } from './hooks/usePlayback';
import { useScale } from './hooks/useScale';
import { useExportManager } from './hooks/useExportManager';

const App: React.FC = () => {
    // 1. Data & Persistence
    const {
        slides, currentSlideIndex, currentSlide, saveStatus, isLoaded,
        currentProjectName, savedProjects, isLoadingProjects,
        setCurrentSlideIndex, updateSlide, addSlide, duplicateSlide, deleteSlide, reorderSlide,
        manualSave, applyTheme, applyTypography, randomizeLook, updateGlobalFontSize,
        startNewProject, importProjectFile, downloadProjectFile, 
        loadRemoteProject, renameProject, toggleArchiveStatus, duplicateProject, fetchProjects
    } = usePresentation();

    // 2. Playback Logic
    const isGlobalSeeking = useRef(false);
    const autoTransitionRef = useRef(false);

    const handleSlideComplete = useCallback(() => {
        if (currentSlideIndex < slides.length - 1) {
            // Move to next slide
            autoTransitionRef.current = true;
            setCurrentSlideIndex(prev => prev + 1);
        } else {
            // End of presentation
            autoTransitionRef.current = false;
        }
    }, [currentSlideIndex, slides.length, setCurrentSlideIndex]);

    const { 
        isPlaying, 
        setIsPlaying,
        progress, 
        setProgress, 
        togglePlay, 
        scrub, 
        reset 
    } = usePlayback(currentSlide?.duration, handleSlideComplete);
    

    // RESET / TRANSITION LOGIC:
    useEffect(() => {
        if (isGlobalSeeking.current) return;

        if (autoTransitionRef.current) {
            // This is an automatic transition to next slide
            setProgress(0);
            setIsPlaying(true);
            autoTransitionRef.current = false;
        } else {
            // This is a manual slide change (user clicked something)
            // Unless it's the very first load
            if (isLoaded) {
                 reset();
            }
        }
    }, [currentSlide?.id, isLoaded, reset, setIsPlaying, setProgress]); // Depend on ID change


    // 3. Render Helpers
    const containerRef = useRef<HTMLDivElement>(null);
    const scale = useScale(containerRef);
    
    // 4. Export Management
    const hiddenExportRef = useRef<HTMLDivElement>(null);
    const exportManager = useExportManager(slides, currentSlide, hiddenExportRef);

    // 5. Welcome Screen State
    const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);

    const handleNewProject = () => {
        startNewProject();
        setShowWelcomeScreen(false);
    };

    const handleLoadProject = (id: string | number) => {
        loadRemoteProject(id);
        setShowWelcomeScreen(false);
    };

    const handleImportProject = (file: File) => {
        importProjectFile(file);
        setShowWelcomeScreen(false);
    };

    // --- Global Timeline Logic ---
    const handleGlobalSeek = (globalPercent: number) => {
        if (slides.length === 0) return;

        const totalDuration = slides.reduce((acc, s) => acc + (s.duration || 5), 0);
        const targetTime = (globalPercent / 100) * totalDuration;

        let accumulatedTime = 0;
        let targetIndex = 0;
        let localTime = 0;

        // Find which slide corresponds to the target time
        for (let i = 0; i < slides.length; i++) {
            const d = slides[i].duration || 5;
            if (accumulatedTime + d >= targetTime) {
                targetIndex = i;
                localTime = targetTime - accumulatedTime;
                break;
            }
            accumulatedTime += d;
        }

        // Clamp just in case
        if (targetIndex >= slides.length) {
             targetIndex = slides.length - 1;
             localTime = slides[targetIndex].duration || 5;
        }

        const localDuration = slides[targetIndex].duration || 5;
        const localProgress = (localTime / localDuration) * 100;

        // Apply changes
        setCurrentSlideIndex(targetIndex);
        scrub(localProgress);
    };

    // --- Global Pulse Loop ---
    // This updates a CSS variable for "Title Pulsating" so it remains continuous across slides.
    useEffect(() => {
        let rafId: number;
        const animatePulse = () => {
            const time = performance.now();
            // 4 second period sine wave (1.0 to 1.03)
            // Cycle: 0 -> 1 over 4000ms
            const t = (time % 4000) / 4000;
            // Cos wave: 1 at 0, 0 at 0.25, -1 at 0.5, 0 at 0.75, 1 at 1.0
            // We want 1 -> 1.03 -> 1
            // Use 0.5 - 0.5*cos(2*PI*t) -> 0 to 1 to 0
            const factor = 0.5 - 0.5 * Math.cos(2 * Math.PI * t);
            const scale = 1.0 + (0.03 * factor); // Range 1.00 to 1.03
            
            // Set global variable on root
            document.documentElement.style.setProperty('--global-pulse-scale', scale.toFixed(5));
            
            rafId = requestAnimationFrame(animatePulse);
        };
        
        rafId = requestAnimationFrame(animatePulse);
        return () => cancelAnimationFrame(rafId);
    }, []);

    // If still loading initial state
    if (!isLoaded && !currentSlide && !showWelcomeScreen) return <LoadingScreen />;

    return (
        <div className="flex h-screen w-screen bg-[#050505] text-white flex-col relative">
            
            <WelcomeScreen 
                isOpen={showWelcomeScreen}
                onClose={() => setShowWelcomeScreen(false)}
                recentProjects={savedProjects}
                isLoadingProjects={isLoadingProjects}
                onNewProject={handleNewProject}
                onLoadProject={handleLoadProject}
                onImportProject={handleImportProject}
                onRenameProject={renameProject}
                onToggleArchive={toggleArchiveStatus}
                onDuplicateProject={duplicateProject}
            />

            {/* Hidden Renderer for Export Operations */}
            <HiddenExportRenderer 
                ref={hiddenExportRef} 
                slide={exportManager.exportingSlide || currentSlide} 
                progress={exportManager.exportRenderProgress} 
                renderNonce={exportManager.exportRenderNonce}
            />

            {/* Top Navigation Bar */}
            <TopBar 
                currentSlide={currentSlide}
                currentProjectName={currentProjectName}
                saveStatus={saveStatus}
                isExporting={exportManager.isExporting}
                onApplyTheme={applyTheme}
                onApplyTypography={applyTypography}
                onRandomize={randomizeLook}
                onManualSave={manualSave}
                onNewProject={handleNewProject}
                onLoadProject={handleImportProject}
                onSaveProject={downloadProjectFile}
                onOpenExport={exportManager.openExportModal}
                onOpenWelcome={() => { fetchProjects(); setShowWelcomeScreen(true); }}
            />

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Preview Area */}
                <div className="flex-1 flex flex-col relative bg-[#050505] overflow-hidden">
                    
                    {/* Slide Viewport */}
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden" ref={containerRef}>
                        <div className="relative shadow-2xl shadow-black">
                            <SlideRenderer 
                                key={`${currentSlide?.id}-${currentSlide?.textTransition}`} 
                                data={currentSlide || slides[0]} 
                                scale={scale}
                                progress={progress}
                            />
                        </div>

                        {/* Floating Local Controls */}
                        <PreviewControls 
                            currentSlideIndex={currentSlideIndex + 1} 
                            totalSlides={slides.length} 
                            onNext={() => {
                                if (currentSlideIndex < slides.length - 1) {
                                    setCurrentSlideIndex(currentSlideIndex + 1);
                                    // Manual change, useEffect will reset
                                }
                            }} 
                            onPrev={() => {
                                if (currentSlideIndex > 0) {
                                    setCurrentSlideIndex(currentSlideIndex - 1);
                                }
                            }} 
                            isPlaying={isPlaying}
                            onTogglePlay={togglePlay}
                            progress={progress}
                            onScrub={scrub}
                        />
                    </div>

                    {/* Bottom: Global Timeline Strip */}
                    <div className="shrink-0 bg-[#0a0a0a] border-t border-white/5 z-40 relative">
                        <GlobalTimeline 
                            slides={slides}
                            currentSlideIndex={currentSlideIndex}
                            currentSlideProgress={progress}
                            isPlaying={isPlaying}
                            onTogglePlay={togglePlay}
                            onSeekStart={() => { isGlobalSeeking.current = true; }}
                            onSeekEnd={() => { isGlobalSeeking.current = false; }}
                            onSeek={handleGlobalSeek}
                        />
                    </div>
                </div>

                {/* Right: Editor Sidebar */}
                <EditorSidebar 
                    slides={slides}
                    currentSlideIndex={currentSlideIndex}
                    onUpdateSlide={updateSlide}
                    onAddSlide={addSlide}
                    onDuplicateSlide={duplicateSlide}
                    onDeleteSlide={deleteSlide}
                    onSelectSlide={setCurrentSlideIndex}
                    onReorderSlides={reorderSlide}
                    onUpdateGlobalSettings={updateGlobalFontSize}
                />
            </div>

            {/* Export Modal */}
            <ExportModal 
                isOpen={exportManager.isExportModalOpen}
                onClose={() => exportManager.setIsExportModalOpen(false)}
                tab={exportManager.exportModalTab}
                setTab={exportManager.setExportModalTab}
                scope={exportManager.exportScope}
                slideCount={slides.length}
                currentSlideBadge={currentSlide?.badge || ""}
                quality={exportManager.exportQuality}
                setQuality={exportManager.setExportQuality}
                bitrate={exportManager.exportBitrate}
                setBitrate={exportManager.setExportBitrate}
                fps={exportManager.exportFps}
                setFps={exportManager.setExportFps}
                format={exportManager.exportFormat}
                setFormat={exportManager.setExportFormat}
                imageFormat={exportManager.exportImageFormat}
                setImageFormat={exportManager.setExportImageFormat}
                isExporting={exportManager.isExporting}
                progress={exportManager.exportProgressStatus}
                queue={exportManager.exportQueue}
                exportLogs={exportManager.exportLogs} // Pass Logs
                onQueue={exportManager.queueExport}
                onStart={() => exportManager.executeExport()}
                onProcessQueue={exportManager.processQueue}
                onDeleteJob={exportManager.deleteJob}
            />

        </div>
    );
};

export default App;
