# Physics Plan: Full Tenerife Island

## Identity

- Object id: `tenerife-full-island-terrain`
- Related asset: `tenerife-full-island-source`
- Runtime owner: environment scene
- Source files:
	- `public/models/land/tenerife._islas_canarias.glb`
	- future `public/models/environment/tenerife-full-island-normalized.glb`
- Date: 2026-05-18

## Body Policy

- Body type: static for active terrain collision, visual-only for distant terrain if split later
- Gameplay authority: player physics capsule remains authoritative for movement
- Visual mesh authoritative: no
- Collider shape: simplified static mesh or heightfield proxy
- Shape dimensions: same normalized terrain coordinate space
- Offset from visual: should be zero after normalization

## Material And Motion

- Mass: `0`
- Inertia policy: not applicable
- Linear damping: not applicable
- Angular damping: not applicable
- Friction: start around `0.74`, tune after movement checks
- Restitution: start around `0.03`
- Gravity: not applicable for static body
- Sleeping: not applicable
- CCD/swept collision: not required for static terrain; player controller handles movement constraints

## Collision Filtering

- Collision layer: environment terrain
- Collision mask:
	- player capsule
	- ground raycasts
	- placement raycasts
- Can collide with:
	- player
	- grounded movement checks
	- future vehicles or traversal tools if added
- Must ignore:
	- non-physical visual overlays
	- ocean visual mesh
	- distant decorative markers
- Trigger-only interactions: none for terrain itself

## Lifecycle

- Spawned: at environment load
- Pool reset needed: no
- Reset fields: not applicable

## Validation

- Physics debug checked: no
- Tunneling checked: no
- Resting/sleeping checked: no
- Performance risk: high if full visual mesh is used as collider
- Open issues:
	- determine whether Havok static mesh collision on decimated island is acceptable
	- decide active-area collision strategy around Puerto before enabling long-distance traversal
	- ensure water reset does not fight steep coastal terrain
