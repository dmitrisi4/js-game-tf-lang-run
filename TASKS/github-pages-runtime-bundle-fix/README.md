# GitHub Pages Runtime Fixes

Fix production-only startup failures on the GitHub Pages deployment caused by Vite/Rolldown splitting Babylon engine modules into circular chunks and by runtime public asset URLs ignoring the configured Pages base path.
