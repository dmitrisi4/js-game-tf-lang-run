# Runtime Architecture

## Architectural Mandates
1. Strict modularity:
	- decompose code into small, single-responsibility modules
	- keep scene composition separate from gameplay behavior
	- avoid monolithic scene files
2. Type safety:
	- do not use `interface`
	- use `type` exclusively
	- component props must be named `PropsType`
3. Documentation:
	- add JSDoc for functions, hooks, and non-trivial components
	- explain why, not only what
4. Formatting:
	- tabs only
	- use Biome-compatible formatting
5. Imports:
	- use absolute aliases such as `@/...`
6. Session logging:
	- every meaningful architecture or implementation session must be logged in `docs/history/logs/`
7. Testing:
	- every new feature or bug fix should include tests in the same phase of work
	- prefer unit tests for pure gameplay logic and focused integration coverage for scene behavior

## Runtime Ownership Rules
### React owns
- app composition
- overlays and HUD
- non-frame-critical UI rendering

### Babylon owns
- scene graph
- camera rig
- physics bodies and aggregates
- raycasts
- per-frame updates

### Zustand owns
- persistent gameplay state such as:
	- player stats
	- inventory
	- progression
	- UI visibility state

### Event bus owns
- ephemeral one-shot signals only
- examples:
	- pickup feedback
	- damage notifications
	- craft success effects

The event bus must not become a second source of truth for HP, XP, inventory, or interaction state.
