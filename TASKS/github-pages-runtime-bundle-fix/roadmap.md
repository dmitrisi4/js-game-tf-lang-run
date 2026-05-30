# Roadmap

## Phase 1: Diagnose
- Confirm the deployed page serves the production artifact.
- Identify the generated chunk causing the runtime exception.

## Phase 2: Fix Bundling
- Adjust Vite/Rolldown output to avoid invalid circular Babylon chunks.
- Keep GitHub Pages base path unchanged.

## Phase 3: Validate And Deploy
- Run local validation.
- Push to `main` and confirm the GitHub Actions deployment succeeds.

## Phase 4: Fix Public Asset Base Paths
- Resolve runtime `public/` asset URLs through Vite's configured base path.
- Validate local production preview and push the Pages asset-path fix.
