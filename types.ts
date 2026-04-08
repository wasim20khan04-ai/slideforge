
export type ThemeId = string;
export type TypographyId = string;

export type TransitionType = 
  | 'none'
  | 'fade' 
  | 'slide-up' 
  | 'slide-down' 
  | 'slide-left' 
  | 'slide-right' 
  | 'zoom-in' 
  | 'zoom-out' 
  | 'rotate-in' 
  | 'blur-in' 
  | 'elastic-up';

export type SlideLayout = 'text-image' | 'text-only';

export interface SlideData {
  id: string;
  badge: string;
  title: string;
  description: string;
  imageUrl: string;
  theme: ThemeId;
  typography: TypographyId;
  duration: number; // Slide visible duration
  
  // Transitions
  textTransition: TransitionType;
  textTransitionDuration: number; // New: Enter Duration
  
  imageTransition: TransitionType;
  imageTransitionDuration: number; // New: Enter Duration

  textOutroTransition: TransitionType;
  textOutroDuration: number; // New: Exit Duration

  imageOutroTransition: TransitionType;
  imageOutroDuration: number; // New: Exit Duration

  layout: SlideLayout;

  // Visibility Overrides (True = Keep Visible / Disable Fix)
  skipTextEnterVisibility?: boolean;
  skipTextExitVisibility?: boolean;
  skipImageEnterVisibility?: boolean;
  skipImageExitVisibility?: boolean;

  // Typography Overrides (Global)
  badgeFontSize?: number;
  titleFontSize?: number;
  descriptionFontSize?: number;
}

export interface ProjectMetadata {
    id: string | number;
    name: string;
    updated_at: string;
}

export interface ExportJob {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: number;
    // Configuration Snapshot
    scope: 'current' | 'all';
    slides: SlideData[]; // Deep copy of slides at time of queuing
    quality: '720p' | '1080p' | '4k';
    bitrate: 'low' | 'medium' | 'high';
    fps: 30 | 60; // Added FPS configuration
    format: 'mp4' | 'zip' | 'folder'; // Added 'folder'
    imageFormat: 'jpeg' | 'png';
}

export const DEFAULT_FONT_SIZES = {
    badge: 48,
    title: 84,
    description: 45
};

// To add a new theme:
// 1. Create a new CSS file in themes/ (e.g., forest-green.css)
// 2. Import it in index.tsx
// 3. Add the theme ID and Name to this list below.
export const THEMES: { id: ThemeId; name: string }[] = [
  { id: 'cyber-future', name: 'Cyber Future' },
  { id: 'midnight-luxe', name: 'Midnight Luxe' },
  { id: 'vivid-pop', name: 'Vivid Pop' },
  { id: 'neo-glass', name: 'Neo Glass' },
  { id: 'swiss-minimal', name: 'Swiss Minimal' },
  { id: 'sunset-retro', name: 'Sunset Retro' },
  { id: 'forest-glass', name: 'Forest Glass' },
  { id: 'obsidian-sharp', name: 'Obsidian Sharp' },
  { id: 'ceramic-clean', name: 'Ceramic Clean' },
  { id: 'brutal-concrete', name: 'Brutal Concrete' },
  // New Themes (Modified)
  { id: 'voltage-strike', name: 'Voltage Strike' },
  { id: 'rose-gold-luxury', name: 'Rose Gold Luxury' },
  { id: 'terminal-matrix', name: 'Terminal Matrix' },
  { id: 'deep-terracotta', name: 'Deep Terracotta' },
  { id: 'playful-pop', name: 'Playful Pop' },
  { id: 'watercolor-dream', name: 'Watercolor Dream' },
  { id: 'midnight-nordic', name: 'Midnight Nordic' },
  // 5 New Light Themes
  { id: 'arctic-frost', name: 'Arctic Frost' },
  { id: 'sahara-sand', name: 'Sahara Sand' },
  { id: 'neon-pastel', name: 'Neon Pastel' },
  { id: 'coral-blush', name: 'Coral Blush' },
  { id: 'cobalt-air', name: 'Cobalt Air' },
];

export const TYPOGRAPHY_STYLES: { id: TypographyId; name: string }[] = [
  { id: 'modern-sans', name: 'Modern Sans' },
  { id: 'elegant-serif', name: 'Elegant Serif' },
  { id: 'tech-mono', name: 'Tech Mono' },
  { id: 'bold-caps', name: 'Bold Geometric' },
  { id: 'retro-script', name: 'Retro Script' },
  { id: 'condensed-impact', name: 'Condensed Impact' },
  { id: 'classic-slab', name: 'Classic Slab' },
  { id: 'futuristic', name: 'Futuristic Sci-Fi' },
  { id: 'marker', name: 'Creative Marker' },
  { id: 'cinematic', name: 'Cinematic Epic' },
];

export const TRANSITIONS: { id: TransitionType; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'fade', name: 'Fade' },
  { id: 'slide-up', name: 'Slide Up' },
  { id: 'slide-down', name: 'Slide Down' },
  { id: 'slide-left', name: 'Slide Left' },
  { id: 'slide-right', name: 'Slide Right' },
  { id: 'zoom-in', name: 'Zoom In' },
  { id: 'zoom-out', name: 'Zoom Out' },
  { id: 'rotate-in', name: 'Rotate' },
  { id: 'blur-in', name: 'Blur' },
  { id: 'elastic-up', name: 'Elastic' },
];

export const INITIAL_SLIDE: SlideData = {
  id: '1',
  badge: 'Step 2',
  title: 'Intelligent Suggestions',
  description: 'Our AI analyzes your content to suggest the most visually appropriate theme.',
  imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop',
  theme: 'cyber-future',
  typography: 'modern-sans',
  duration: 5,
  textTransition: 'slide-up',
  textTransitionDuration: 1,
  imageTransition: 'zoom-in',
  imageTransitionDuration: 1,
  textOutroTransition: 'none',
  textOutroDuration: 1,
  imageOutroTransition: 'none',
  imageOutroDuration: 1,
  layout: 'text-image',
  skipTextEnterVisibility: false,
  skipTextExitVisibility: false,
  skipImageEnterVisibility: false,
  skipImageExitVisibility: false,
};

export const createNewSlide = (layout: SlideLayout = 'text-image'): SlideData => ({
  id: Date.now().toString(),
  badge: 'New',
  title: 'New Slide',
  description: 'Enter your slide content here.',
  imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
  theme: 'cyber-future',
  typography: 'modern-sans',
  duration: 5,
  textTransition: 'slide-up',
  textTransitionDuration: 1,
  imageTransition: 'zoom-in',
  imageTransitionDuration: 1,
  textOutroTransition: 'none',
  textOutroDuration: 1,
  imageOutroTransition: 'none',
  imageOutroDuration: 1,
  layout: layout,
  skipTextEnterVisibility: false,
  skipTextExitVisibility: false,
  skipImageEnterVisibility: false,
  skipImageExitVisibility: false,
});
