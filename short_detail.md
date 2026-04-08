# SlideForge - The Upgrade Guide (Phase 2)

**SlideForge** is a state-of-the-art, AI-powered presentation suite designed for the modern web. It bridges the gap between static slides and cinematic motion graphics, offering a seamless "Editor-to-Video" workflow entirely in the browser.

### 🚀 Key Capabilities

*   **🤖 AI Design Assistant**:
    *   Leverages **Google Gemini** to analyze content context.
    *   Autonomously suggests visual themes (e.g., *Cyber Future*, *Midnight Luxe*, *Obsidian Sharp*) that match your narrative tone.

*   **🎬 Cinematic Animation Engine**:
    *   **Granular Control**: Separate **Intro** and **Exit** transitions for text and imagery.
    *   **Timing Precision**: Adjustable durations for every animation phase.
    *   **Global Pulse**: A continuous, synchronized "breathing" effect (`--global-pulse-scale`) that keeps slides alive even when static.

*   **📹 Professional Export Pipeline**:
    *   **Video**: Client-side **4K/1080p MP4** rendering via `mp4-muxer`.
    *   **Frame Sequences**: Export as **ZIP** archives or directly to disk via **Folder** mode (requires companion extension).
    *   **Configurable Quality**: Custom FPS (30/60) and Bitrate settings.
    *   **Background Queue**: Non-blocking export process allows for uninterrupted editing.

*   **🎛️ Advanced Workspace**:
    *   **Global Timeline**: Scrub through the entire presentation with a visual linear timeline.
    *   **Welcome Dashboard**: Manage local and cloud projects with Archive, Duplicate, Rename, and Search features.
    *   **Real-Time Preview**: 1:1 render fidelity between editor and export.

*   **💾 Data Management**:
    *   **Cloud Sync**: Integrated with **Supabase** for persistent storage.
    *   **Local**: JSON import/export for offline portability.

### 🛠️ Technical Architecture

*   **Core**: React 19, TypeScript
*   **Styling**: Tailwind CSS + CSS Variables for dynamic theming
*   **AI Provider**: Google GenAI SDK (`@google/genai`)
*   **Video/Image**: `mp4-muxer`, `html-to-image`, `jszip`
*   **Icons**: Lucide React
