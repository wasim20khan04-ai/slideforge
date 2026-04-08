
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import Global Animations
import './themes/animations.css';
// Import Global Typography
import './themes/typography.css';

// Import Themes
import './themes/cyber-future.css';
import './themes/midnight-luxe.css';
import './themes/vivid-pop.css';
import './themes/neo-glass.css';
import './themes/swiss-minimal.css';
import './themes/sunset-retro.css';
import './themes/forest-glass.css';
import './themes/obsidian-sharp.css';
import './themes/ceramic-clean.css';
import './themes/brutal-concrete.css';

// New Themes (Modified)
import './themes/voltage-strike.css';
import './themes/rose-gold-luxury.css';
import './themes/terminal-matrix.css';
import './themes/deep-terracotta.css';
import './themes/playful-pop.css';
import './themes/watercolor-dream.css';
import './themes/midnight-nordic.css';

// 5 New Light Themes
import './themes/arctic-frost.css';
import './themes/sahara-sand.css';
import './themes/neon-pastel.css';
import './themes/coral-blush.css';
import './themes/cobalt-air.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
