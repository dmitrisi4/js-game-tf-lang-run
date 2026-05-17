export const COLLISION_LAYERS = {
	ground: 1 << 0,
	player: 1 << 1,
	staticWorld: 1 << 2,
	dynamicWorld: 1 << 3,
	pickup: 1 << 4,
	trigger: 1 << 5,
	enemy: 1 << 6,
	projectile: 1 << 7,
	worldBounds: 1 << 8,
} as const;

export type CollisionLayerName = keyof typeof COLLISION_LAYERS;

export type CollisionLayerMask = number;

export const DEFAULT_COLLISION_MASKS = {
	ground:
		COLLISION_LAYERS.player |
		COLLISION_LAYERS.dynamicWorld |
		COLLISION_LAYERS.enemy |
		COLLISION_LAYERS.projectile,
	player:
		COLLISION_LAYERS.ground |
		COLLISION_LAYERS.staticWorld |
		COLLISION_LAYERS.dynamicWorld |
		COLLISION_LAYERS.pickup |
		COLLISION_LAYERS.trigger |
		COLLISION_LAYERS.enemy |
		COLLISION_LAYERS.projectile |
		COLLISION_LAYERS.worldBounds,
	staticWorld:
		COLLISION_LAYERS.player |
		COLLISION_LAYERS.dynamicWorld |
		COLLISION_LAYERS.enemy |
		COLLISION_LAYERS.projectile,
	dynamicWorld:
		COLLISION_LAYERS.ground |
		COLLISION_LAYERS.player |
		COLLISION_LAYERS.staticWorld |
		COLLISION_LAYERS.dynamicWorld |
		COLLISION_LAYERS.enemy |
		COLLISION_LAYERS.worldBounds,
	pickup: COLLISION_LAYERS.player,
	trigger: COLLISION_LAYERS.player | COLLISION_LAYERS.enemy | COLLISION_LAYERS.projectile,
	enemy:
		COLLISION_LAYERS.ground |
		COLLISION_LAYERS.player |
		COLLISION_LAYERS.staticWorld |
		COLLISION_LAYERS.dynamicWorld |
		COLLISION_LAYERS.trigger |
		COLLISION_LAYERS.projectile |
		COLLISION_LAYERS.worldBounds,
	projectile:
		COLLISION_LAYERS.ground |
		COLLISION_LAYERS.player |
		COLLISION_LAYERS.staticWorld |
		COLLISION_LAYERS.dynamicWorld |
		COLLISION_LAYERS.trigger |
		COLLISION_LAYERS.enemy |
		COLLISION_LAYERS.worldBounds,
	worldBounds:
		COLLISION_LAYERS.player |
		COLLISION_LAYERS.dynamicWorld |
		COLLISION_LAYERS.enemy |
		COLLISION_LAYERS.projectile,
} as const satisfies Record<CollisionLayerName, CollisionLayerMask>;

/** Builds a bit mask from named gameplay collision layers to keep masks readable at call sites. */
export const createCollisionMask = (layers: CollisionLayerName[]): CollisionLayerMask =>
	layers.reduce((mask, layer) => mask | COLLISION_LAYERS[layer], 0);

/** Returns the default interaction mask for a layer in the shared project collision registry. */
export const getDefaultCollisionMask = (layer: CollisionLayerName): CollisionLayerMask =>
	DEFAULT_COLLISION_MASKS[layer];
