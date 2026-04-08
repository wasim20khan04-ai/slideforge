
import { useState, useEffect, useRef } from 'react';
import { SlideData, INITIAL_SLIDE, createNewSlide, SlideLayout, ThemeId, TypographyId, THEMES, TYPOGRAPHY_STYLES, ProjectMetadata } from '../types';
import { supabase } from '../services/supabaseClient';

export const usePresentation = () => {
    // Current Project State
    const [currentProjectId, setCurrentProjectId] = useState<string | number | null>(null);
    const [currentProjectName, setCurrentProjectName] = useState<string>("Untitled Project");
    const [slides, setSlides] = useState<SlideData[]>([INITIAL_SLIDE]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    
    // App State
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [isLoaded, setIsLoaded] = useState(false);
    const isFirstLoad = useRef(true);

    // Project List State
    const [savedProjects, setSavedProjects] = useState<ProjectMetadata[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    const currentSlide = slides[currentSlideIndex] || slides[0];

    // --- Persistence Logic ---

    // Fetch Project List
    const fetchProjects = async () => {
        setIsLoadingProjects(true);
        try {
            // Select relevant fields. Order by updated_at descending
            const { data, error } = await supabase
                .from('presentations')
                .select('id, name, updated_at')
                .order('updated_at', { ascending: false });

            if (error) {
                console.warn("Supabase fetch error (likely invalid project URL):", error);
                setSavedProjects([]);
                return;
            }
            if (data) {
                setSavedProjects(data as ProjectMetadata[]);
            }
        } catch (e) {
            console.error("Failed to fetch projects list:", e);
            setSavedProjects([]);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    // Initial Load of Project List
    useEffect(() => {
        fetchProjects();
        setIsLoaded(true);
        setTimeout(() => { isFirstLoad.current = false; }, 500);
    }, []);

    // Load Specific Project
    const loadRemoteProject = async (id: string | number) => {
        setIsLoaded(false);
        try {
            const { data, error } = await supabase
                .from('presentations')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.warn("Supabase load error:", error);
                throw error;
            }
            if (data) {
                // If opening an archived project, visually strip the tag for the editor title
                const cleanName = data.name.replace('[ARCHIVED] ', '');
                
                setSlides(data.slides || [INITIAL_SLIDE]);
                setCurrentProjectId(data.id);
                setCurrentProjectName(cleanName);
                setCurrentSlideIndex(0);
            }
        } catch (e) {
            console.error("Failed to load project:", e);
            alert("Could not load project. The database connection might be invalid.");
            fetchProjects(); // Refresh list to verify
        } finally {
            setIsLoaded(true);
        }
    };

    // Create New Remote Project
    const createNewRemoteProject = async (name: string, initialSlides: SlideData[]) => {
        setIsLoaded(false);
        try {
            const { data, error } = await supabase
                .from('presentations')
                .insert([{
                    name: name,
                    slides: initialSlides,
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) {
                console.warn("Supabase create error:", error);
                throw error;
            }
            if (data) {
                setCurrentProjectId(data.id);
                setCurrentProjectName(data.name);
                setSlides(initialSlides);
                setCurrentSlideIndex(0);
                fetchProjects(); // Refresh list
            }
        } catch (e) {
            console.error("Failed to create project:", e);
            // Fallback for offline or error: just set state
            setSlides(initialSlides);
            setCurrentProjectName(name);
            setCurrentProjectId(Date.now()); // Temp ID
            setCurrentSlideIndex(0);
        } finally {
            setIsLoaded(true);
        }
    };

    // Duplicate Project
    const duplicateProject = async (id: string | number) => {
        try {
            const { data: original, error: fetchError } = await supabase
                .from('presentations')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            if (!original) return;

            // Ensure we don't duplicate the archived tag if it exists
            const rawName = original.name.replace('[ARCHIVED] ', '');
            const newName = `Copy of ${rawName}`;
            
            const { error: insertError } = await supabase
                .from('presentations')
                .insert([{
                    name: newName,
                    slides: original.slides,
                    updated_at: new Date().toISOString()
                }]);

            if (insertError) throw insertError;
            fetchProjects();
        } catch (e) {
            console.error("Failed to duplicate:", e);
        }
    };

    // Save Helper
    const saveToCloud = async (slidesToSave: SlideData[]) => {
        if (!currentProjectId) return; 
        
        setSaveStatus('saving');
        try {
            const { error } = await supabase
                .from('presentations')
                .upsert({ 
                    id: currentProjectId, 
                    name: currentProjectName,
                    slides: slidesToSave,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
            fetchProjects(); 
        } catch (error: unknown) {
            console.error("Failed to save to Supabase:", error);
            setSaveStatus('error');
        }
    };

    // Rename Project
    const renameProject = async (id: string | number, newName: string) => {
        try {
            const { error } = await supabase
                .from('presentations')
                .update({ name: newName })
                .eq('id', id);

            if (error) throw error;
            
            if (id === currentProjectId) {
                setCurrentProjectName(newName);
            }
            fetchProjects();
        } catch (e) {
            console.error("Failed to rename:", e);
        }
    };

    // Toggle Archive Status (Replaces Delete)
    const toggleArchiveStatus = async (id: string | number) => {
        const project = savedProjects.find(p => p.id === id);
        if (!project) return;

        const isArchived = project.name.startsWith('[ARCHIVED] ');
        const newName = isArchived 
            ? project.name.replace('[ARCHIVED] ', '') 
            : `[ARCHIVED] ${project.name}`;

        // Optimistic Update
        const previousProjects = [...savedProjects];
        setSavedProjects(prev => prev.map(p => 
            p.id === id ? { ...p, name: newName } : p
        ));

        try {
            const { error } = await supabase
                .from('presentations')
                .update({ name: newName })
                .eq('id', id);

            if (error) throw error;
        } catch (e: unknown) {
            console.error("Failed to toggle archive:", e);
            alert("Failed to update project status.");
            setSavedProjects(previousProjects);
        }
    };

    // Auto-Save
    useEffect(() => {
        if (!isLoaded || isFirstLoad.current || !currentProjectId) return;
        const timeoutId = setTimeout(() => {
            saveToCloud(slides);
        }, 2000);
        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slides, isLoaded, currentProjectId, currentProjectName]);


    // --- Slide Operations ---

    const handleUpdateSlide = (updatedSlide: SlideData) => {
        const oldSlide = slides[currentSlideIndex];
        let newSlides = slides.map((s, index) => index === currentSlideIndex ? updatedSlide : s);

        // Apply Global changes logic (Keep Theme and Typography global)
        if (oldSlide.theme !== updatedSlide.theme) {
            newSlides = newSlides.map(s => ({ ...s, theme: updatedSlide.theme }));
        }
        if (oldSlide.typography !== updatedSlide.typography) {
            newSlides = newSlides.map(s => ({ ...s, typography: updatedSlide.typography }));
        }

        setSlides(newSlides);
    };

    const handleAddSlide = (layout: SlideLayout = 'text-image') => {
        const newSlide = createNewSlide(layout);
        const refSlide = slides[currentSlideIndex] || slides[0];
        // Inherit styles
        newSlide.theme = refSlide.theme || 'cyber-future';
        newSlide.typography = refSlide.typography || 'modern-sans';
        newSlide.textTransition = refSlide.textTransition || 'slide-up';
        newSlide.imageTransition = refSlide.imageTransition || 'zoom-in';
        newSlide.textOutroTransition = refSlide.textOutroTransition || 'none';
        newSlide.imageOutroTransition = refSlide.imageOutroTransition || 'none';
        
        // Inherit Global Font Sizes
        newSlide.badgeFontSize = refSlide.badgeFontSize;
        newSlide.titleFontSize = refSlide.titleFontSize;
        newSlide.descriptionFontSize = refSlide.descriptionFontSize;

        const lastSlide = slides[slides.length - 1];
        if (lastSlide && lastSlide.badge.startsWith('Step ')) {
            const num = parseInt(lastSlide.badge.split(' ')[1]);
            if (!isNaN(num)) newSlide.badge = `Step ${num + 1}`;
        }

        setSlides([...slides, newSlide]);
        setCurrentSlideIndex(slides.length);
    };

    const handleDuplicateSlide = (index: number) => {
        const slide = slides[index];
        if (!slide) return;
        const newSlide = { ...slide, id: Date.now().toString() };
        const newSlides = [...slides];
        newSlides.splice(index + 1, 0, newSlide);
        setSlides(newSlides);
        setCurrentSlideIndex(index + 1);
    };

    const handleDeleteSlide = (index: number) => {
        if (slides.length <= 1) return;
        const newSlides = slides.filter((_, i) => i !== index);
        setSlides(newSlides);
        if (currentSlideIndex >= index && currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        } else if (currentSlideIndex >= newSlides.length) {
            setCurrentSlideIndex(newSlides.length - 1);
        }
    };

    const handleReorderSlides = (from: number, to: number) => {
        if (from === to) return;
        const newSlides = [...slides];
        const [moved] = newSlides.splice(from, 1);
        newSlides.splice(to, 0, moved);
        setSlides(newSlides);
        
        if (currentSlideIndex === from) setCurrentSlideIndex(to);
        else if (from < currentSlideIndex && to >= currentSlideIndex) setCurrentSlideIndex(currentSlideIndex - 1);
        else if (from > currentSlideIndex && to <= currentSlideIndex) setCurrentSlideIndex(currentSlideIndex + 1);
    };

    const applyTheme = (id: ThemeId) => setSlides(slides.map(s => ({ ...s, theme: id })));
    const applyTypography = (id: TypographyId) => setSlides(slides.map(s => ({ ...s, typography: id })));
    
    // NEW: Update Global Font Size
    const updateGlobalFontSize = (field: 'badgeFontSize' | 'titleFontSize' | 'descriptionFontSize', value: number) => {
        setSlides(slides.map(s => ({ ...s, [field]: value })));
    };

    const randomizeLook = () => {
        const f = TYPOGRAPHY_STYLES[Math.floor(Math.random() * TYPOGRAPHY_STYLES.length)];
        setSlides(slides.map(s => ({ ...s, typography: f.id })));
    };

    // --- New Project Management ---
    
    const startNewProject = () => {
        const dateStr = new Date().toLocaleString();
        const name = `Project - ${dateStr}`;
        const freshSlide = createNewSlide('text-image');
        
        createNewRemoteProject(name, [freshSlide]);
    };

    const importProjectFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (Array.isArray(json) && json.length > 0 && json[0].id) {
                    const dateStr = new Date().toLocaleString();
                    const name = `Imported - ${dateStr}`;
                    createNewRemoteProject(name, json as SlideData[]);
                } else {
                    alert("Invalid project file.");
                }
            } catch (err) {
                console.error(err);
                alert("Failed to parse project file.");
            }
        };
        reader.readAsText(file);
    };

    const downloadProjectFile = () => {
        try {
            const blob = new Blob([JSON.stringify(slides, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentProjectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch(e) { console.error(e); }
    };

    return {
        // State
        slides,
        currentSlideIndex,
        currentSlide,
        saveStatus,
        isLoaded,
        currentProjectId,
        currentProjectName,
        savedProjects,
        isLoadingProjects,

        // Setters
        setSlides,
        setCurrentSlideIndex,
        
        // Actions
        updateSlide: handleUpdateSlide,
        addSlide: handleAddSlide,
        duplicateSlide: handleDuplicateSlide,
        deleteSlide: handleDeleteSlide,
        reorderSlide: handleReorderSlides,
        manualSave: () => saveToCloud(slides),
        
        // Styles
        applyTheme,
        applyTypography,
        updateGlobalFontSize, // Exposed
        randomizeLook,
        
        // Project Management
        startNewProject,
        loadRemoteProject,
        importProjectFile,
        downloadProjectFile,
        renameProject,
        toggleArchiveStatus,
        duplicateProject,
        fetchProjects
    };
};
