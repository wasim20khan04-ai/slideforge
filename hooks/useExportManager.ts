
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { SlideData, ExportJob } from '../types';
import * as Mp4Muxer from 'mp4-muxer';
import { toCanvas } from 'html-to-image';
import JSZip from 'jszip';
import { applyExportFrameState } from './exportFrameState';

export const useExportManager = (
    slides: SlideData[], 
    currentSlide: SlideData,
    exportContainerRef: React.RefObject<HTMLDivElement | null>
) => {
    // UI State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportModalTab, setExportModalTab] = useState<'settings' | 'queue'>('settings');
    
    // Settings State (Local to manager)
    const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
    const [exportQuality, setExportQuality] = useState<'720p' | '1080p' | '4k'>('1080p');
    const [exportBitrate, setExportBitrate] = useState<'low' | 'medium' | 'high'>('medium');
    const [exportFps, setExportFps] = useState<30 | 60>(60);
    const [exportFormat, setExportFormat] = useState<'mp4' | 'zip' | 'folder'>('mp4');
    const [exportImageFormat, setExportImageFormat] = useState<'jpeg' | 'png'>('jpeg');

    // Execution State
    const [exportQueue, setExportQueue] = useState<ExportJob[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgressStatus, setExportProgressStatus] = useState(0);
    const [exportingSlide, setExportingSlide] = useState<SlideData | null>(null);
    const [exportRenderProgress, setExportRenderProgress] = useState(0);
    const [exportRenderNonce, setExportRenderNonce] = useState(0);
    
    // Logging State
    const [exportLogs, setExportLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setExportLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

    const waitForPaint = () =>
        new Promise<void>(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => resolve());
            });
        });

    const waitForFontsReady = async () => {
        const fontSet = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
        if (!fontSet?.ready) return;
        await Promise.race([fontSet.ready, sleep(2000)]);
    };

    const waitForImagesReady = async (container: HTMLDivElement) => {
        const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
        if (images.length === 0) return;

        await Promise.all(
            images.map(async (img) => {
                if (img.complete && img.naturalWidth > 0) return;

                // Prefer decode when available to guarantee pixels are ready.
                if (typeof img.decode === 'function') {
                    await Promise.race([img.decode().catch(() => undefined), sleep(1500)]);
                    return;
                }

                await new Promise<void>((resolve) => {
                    let settled = false;
                    const done = () => {
                        if (settled) return;
                        settled = true;
                        img.removeEventListener('load', done);
                        img.removeEventListener('error', done);
                        resolve();
                    };
                    img.addEventListener('load', done, { once: true });
                    img.addEventListener('error', done, { once: true });
                    setTimeout(done, 1500);
                });
            })
        );
    };

    const waitForSlideAssetsReady = async (container: HTMLDivElement) => {
        await waitForPaint();
        await waitForFontsReady();
        await waitForImagesReady(container);
        await waitForPaint();
    };

    const waitForEncoderCapacity = async (encoder: VideoEncoder, maxQueue = 2) => {
        let checks = 0;
        while (encoder.encodeQueueSize > maxQueue) {
            await waitForPaint();
            checks++;
            // Fail-open after ~240 frames to avoid export deadlock in rare browser stalls.
            if (checks > 240) break;
        }
    };

    const openExportModal = (scope: 'current' | 'all') => {
        setExportScope(scope);
        setIsExportModalOpen(true);
        setExportModalTab('settings');
    };

    const queueExport = () => {
        const slidesSnapshot = exportScope === 'current' ? [currentSlide] : [...slides];
        const newJob: ExportJob = {
            id: Date.now().toString(),
            status: 'pending',
            createdAt: Date.now(),
            scope: exportScope,
            slides: JSON.parse(JSON.stringify(slidesSnapshot)),
            quality: exportQuality,
            bitrate: exportBitrate,
            fps: exportFps,
            format: exportFormat,
            imageFormat: exportImageFormat
        };
        setExportQueue([...exportQueue, newJob]);
        setExportModalTab('queue');
    };

    const processQueue = async () => {
        if (isExporting) return;
        const pending = exportQueue.filter(j => j.status === 'pending');
        if (pending.length === 0) return;

        for (const job of pending) {
            setExportQueue(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j));
            try {
                await executeExport(job);
                setExportQueue(prev => prev.map(j => j.id === job.id ? { ...j, status: 'completed' } : j));
            } catch (e) {
                console.error(e);
                setExportQueue(prev => prev.map(j => j.id === job.id ? { ...j, status: 'failed' } : j));
            }
            await new Promise(r => setTimeout(r, 1000));
        }
        setIsExporting(false);
        setExportingSlide(null);
        setExportProgressStatus(0);
    };

    const executeExport = async (job?: ExportJob) => {
        if (!job && isExporting) return;
        if (!exportContainerRef.current) return;
        
        setIsExporting(true);
        setExportProgressStatus(0);
        setExportLogs([]); // Clear logs start
        addLog("Starting export initialization...");

        const cfgQuality = job ? job.quality : exportQuality;
        const cfgBitrate = job ? job.bitrate : exportBitrate;
        const cfgFps = job ? job.fps : exportFps;
        const cfgFormat = job ? job.format : exportFormat;
        const cfgScope = job ? job.scope : exportScope;
        const cfgSlides = job ? job.slides : (exportScope === 'current' ? [currentSlide] : slides);
        const cfgImageFormat = job ? job.imageFormat : exportImageFormat;

        const FPS = cfgFps;
        let WIDTH = 1920;
        let HEIGHT = 1080;
        let bitRate = 5_000_000;

        addLog(`Configuration: ${cfgFormat.toUpperCase()} @ ${cfgQuality}, ${FPS} FPS`);

        let baseBitrate = 0;
        if (cfgQuality === '720p') {
            WIDTH = 1280; HEIGHT = 720;
            baseBitrate = cfgBitrate === 'low' ? 1.5e6 : cfgBitrate === 'medium' ? 2.5e6 : 4e6;
        } else if (cfgQuality === '1080p') {
            WIDTH = 1920; HEIGHT = 1080;
            baseBitrate = cfgBitrate === 'low' ? 3e6 : cfgBitrate === 'medium' ? 5e6 : 8e6;
        } else if (cfgQuality === '4k') {
            WIDTH = 3840; HEIGHT = 2160;
            baseBitrate = cfgBitrate === 'low' ? 8e6 : cfgBitrate === 'medium' ? 12e6 : 20e6;
        }

        // Increase bitrate slightly for higher frame rates to maintain per-frame quality
        if (FPS === 60) baseBitrate *= 1.5;
        bitRate = baseBitrate;
        if (cfgFormat === 'mp4' && cfgQuality === '1080p' && cfgFps === 60 && cfgBitrate === 'medium') {
            bitRate = Math.max(bitRate, 10_000_000);
            addLog('Adjusted bitrate floor for 1080p60 medium to preserve low-opacity transition frames.');
        }

        let muxer: Mp4Muxer.Muxer<Mp4Muxer.ArrayBufferTarget> | null = null;
        let videoEncoder: VideoEncoder | null = null;
        let zip: JSZip | null = null;

        try {
            // Generate a safe folder name for this export
            const baseName = cfgScope === 'current' && cfgSlides.length === 1 ? `slide-${cfgSlides[0].badge.replace(/\s+/g,'_')}` : `presentation`;
            const timestamp = Date.now();
            const folderName = `${baseName}_${timestamp}`;

            if (cfgFormat === 'mp4') {
                addLog("Initializing MP4 Muxer & VideoEncoder...");
                muxer = new Mp4Muxer.Muxer({
                    target: new Mp4Muxer.ArrayBufferTarget(),
                    video: { codec: 'avc', width: WIDTH, height: HEIGHT },
                    fastStart: 'in-memory',
                    firstTimestampBehavior: 'offset',
                });
                const codecStr = cfgQuality === '4k' ? 'avc1.640033' : 'avc1.4d002a';
                
                videoEncoder = new VideoEncoder({
                    output: (chunk, meta) => {
                        try {
                            muxer.addVideoChunk(chunk, meta);
                        } catch (err) {
                            console.error("Muxer error:", err);
                            addLog(`Muxer Error: ${err}`);
                        }
                    },
                    error: (e) => {
                        console.error("VideoEncoder error:", e);
                        addLog(`Encoder Error: ${e.message}`);
                        alert(`Video Encoding Error: ${e.message}`);
                    }
                });
                
                videoEncoder.configure({ codec: codecStr, width: WIDTH, height: HEIGHT, bitrate: bitRate });
            } else if (cfgFormat === 'zip') {
                addLog("Initializing JSZip...");
                zip = new JSZip();
            }

            let totalExportFrames = 0;
            cfgSlides.forEach(s => totalExportFrames += Math.ceil((s.duration || 5) * FPS));
            
            // Start at 1 for user-friendly file numbering (frame_00001)
            let globalFrameCount = 1;

            addLog(`Total Frames to render: ${totalExportFrames}`);

            for (const slide of cfgSlides) {
                flushSync(() => {
                    setExportingSlide(slide);
                    setExportRenderProgress(0);
                    setExportRenderNonce(prev => prev + 1);
                });
                addLog(`Mounting Slide: ${slide.badge} (${slide.title})...`);
                // Wait for React and asset readiness before first frame of this slide.
                if (exportContainerRef.current) {
                    await waitForSlideAssetsReady(exportContainerRef.current);
                } else {
                    await waitForPaint();
                }

                const duration = slide.duration || 5;
                const frames = Math.ceil(duration * FPS);
                
                addLog(`Rendering ${frames} frames for ${slide.badge}...`);

                for (let i = 0; i < frames; i++) {
                    const prog = (frames > 1) ? (i / (frames - 1)) * 100 : 0;
                    const elapsedSeconds = i / FPS;
                    flushSync(() => {
                        setExportRenderProgress(prog);
                        // Use (globalFrameCount - 1) for progress calculation to start at 0%
                        setExportProgressStatus(Math.round(((globalFrameCount - 1) / totalExportFrames) * 100));
                    });
                    await waitForPaint();

                    if (exportContainerRef.current) {
                        try {
                            const frameState = applyExportFrameState(exportContainerRef.current, slide, elapsedSeconds);
                            if ((i < 3 || i % 10 === 0) && i <= 75) {
                                addLog(
                                    `[DBG ${slide.badge}] f=${i} t=${elapsedSeconds.toFixed(3)} ` +
                                    `textP=${frameState.textIntroProgress.toFixed(3)} ` +
                                    `textOp=${frameState.textIntroOpacity.toFixed(3)}`
                                );
                            }

                            // --- MANUAL PULSE SYNC FOR EXPORT ---
                            // We must calculate what the scale would be at this specific timestamp
                            // to ensure the export has continuous pulsing like the live preview.
                            // 4s period = 4000ms.
                            const frameTimeMs = ((globalFrameCount - 1) * 1000) / FPS;
                            const t = (frameTimeMs % 4000) / 4000;
                            const factor = 0.5 - 0.5 * Math.cos(2 * Math.PI * t);
                            const scale = 1.0 + (0.03 * factor); // Range 1.00 to 1.03
                            
                            exportContainerRef.current.style.setProperty('--global-pulse-scale', scale.toFixed(5));
                            // -------------------------------------

                            const canvas = await toCanvas(exportContainerRef.current, {
                                width: WIDTH, height: HEIGHT, pixelRatio: 1, cacheBust: true,
                                style: { transform: 'none', transformOrigin: 'top left' },
                                fontEmbedCSS: '',
                            });

                            if (cfgFormat === 'mp4' && videoEncoder) {
                                await waitForEncoderCapacity(videoEncoder);
                                // Ensure timestamp starts at 0 for the video stream
                                // (globalFrameCount - 1) ensures the first frame is at timestamp 0
                                const timestamp = ((globalFrameCount - 1) * 1e6) / FPS;
                                const duration = 1e6 / FPS;
                                
                                const frame = new VideoFrame(canvas, { timestamp, duration });
                                
                                // FIX: Insert Keyframe every 2 seconds to ensure seekability
                                // FPS * 2 means one keyframe every 2 seconds.
                                const keyFrameInterval = FPS * 2;
                                const shouldBeKeyFrame = i === 0 || (globalFrameCount - 1) % keyFrameInterval === 0;
                                if (i === 0) {
                                    addLog(`Forcing slide-boundary keyframe: ${slide.badge}`);
                                }

                                videoEncoder.encode(frame, { keyFrame: shouldBeKeyFrame });
                                frame.close();
                            } else if (cfgFormat === 'zip' && zip) {
                                const mime = cfgImageFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
                                const q = cfgImageFormat === 'jpeg' ? 0.9 : undefined;
                                const ext = cfgImageFormat === 'jpeg' ? 'jpg' : 'png';
                                const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, mime, q));
                                
                                // File naming uses 1-based index: frame_00001
                                if (blob) zip.file(`frame_${String(globalFrameCount).padStart(5,'0')}.${ext}`, blob);
                            } else if (cfgFormat === 'folder') {
                                // DIRECT FOLDER OUTPUT VIA EXTENSION
                                const mime = cfgImageFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
                                const q = cfgImageFormat === 'jpeg' ? 0.9 : undefined;
                                const ext = cfgImageFormat === 'jpeg' ? 'jpg' : 'png';
                                
                                const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, mime, q));
                                if (blob) {
                                    const url = URL.createObjectURL(blob);
                                    // Send to extension
                                    window.postMessage({
                                        type: 'SLIDEFORGE_DOWNLOAD',
                                        payload: {
                                            url: url,
                                            // File naming uses 1-based index: frame_00001
                                            filename: `${folderName}/frame_${String(globalFrameCount).padStart(5,'0')}.${ext}`
                                        }
                                    }, '*');
                                    
                                    // Clean up object URL after a delay to ensure extension read it
                                    setTimeout(() => URL.revokeObjectURL(url), 5000);
                                    
                                    // Slight delay to prevent flooding
                                    await new Promise(r => setTimeout(r, 50));
                                }
                            }
                        } catch (err: unknown) { 
                            console.warn("Frame capture error:", err); 
                            addLog(`Frame Capture Error (Frame ${globalFrameCount}): ${err instanceof Error ? err.message : String(err)}`);
                        }
                    }
                    globalFrameCount++;
                }
            }

            // Finalization phase
            addLog("All frames rendered. Starting finalization...");
            
            if (cfgFormat === 'mp4' && videoEncoder && muxer) {
                addLog("Flushing video encoder...");
                // Important: flush must complete before finalizing muxer
                await videoEncoder.flush();
                videoEncoder.close();
                videoEncoder = null; // Prevent double cleanup
                
                addLog("Finalizing MP4 container...");
                muxer.finalize();
                const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
                const filename = `${baseName}_${cfgQuality}_${cfgFps}fps.mp4`;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename;
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                addLog("MP4 download triggered.");

            } else if (cfgFormat === 'zip' && zip) {
                addLog("Generating ZIP archive... (This may take a moment for large files)");
                // Added onUpdate callback for progress logging
                const blob = await zip.generateAsync({ type: "blob" }, (metadata) => {
                     // Log every 10% to avoid flooding
                     if (metadata.percent && Math.floor(metadata.percent) % 10 === 0 && Math.floor(metadata.percent) > 0) {
                        // We avoid adding log on every tick, just basic console log to keep UI responsive
                        console.log(`ZIP Progress: ${metadata.percent.toFixed(0)}%`);
                     }
                });
                
                addLog("ZIP Generation Complete. Triggering download.");
                const filename = `${baseName}_frames.zip`;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename;
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);

            } else if (cfgFormat === 'folder') {
                await new Promise(r => setTimeout(r, 500));
                addLog("Folder export commands sent.");
            }
            
            addLog("Export Job Success.");
            if (!job) {
                setTimeout(() => { setIsExportModalOpen(false); setIsExporting(false); setExportProgressStatus(0); }, 1000);
            }
        } catch (e: unknown) {
            console.error("Export Failed", e);
            const errorMessage = e instanceof Error ? e.message : String(e);
            addLog(`CRITICAL FAILURE: ${errorMessage}`);
            if (!job) alert(`Export failed: ${errorMessage}`);
            else throw e;
        } finally {
            if (videoEncoder && videoEncoder.state !== 'closed') {
                try { videoEncoder.close(); } catch(e) { console.warn("Could not close encoder:", e); }
            }
            if (!job) { setExportingSlide(null); setIsExporting(false); }
        }
    };

    return {
        // UI State
        isExportModalOpen, setIsExportModalOpen,
        exportModalTab, setExportModalTab,
        // Settings State setters
        setExportQuality, setExportBitrate, setExportFps, setExportFormat, setExportImageFormat,
        // Settings State getters
        exportScope, exportQuality, exportBitrate, exportFps, exportFormat, exportImageFormat,
        // Queue & Status
        exportQueue, setExportQueue,
        isExporting,
        exportProgressStatus,
        exportingSlide,
        exportRenderProgress,
        exportRenderNonce,
        exportLogs, // NEW
        // Actions
        openExportModal,
        queueExport,
        processQueue,
        executeExport, // Direct start
        deleteJob: (id: string) => setExportQueue(q => q.filter(j => j.id !== id))
    };
};
