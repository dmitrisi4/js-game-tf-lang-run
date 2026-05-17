import type { CollisionLayerMask, CollisionLayerName } from './collisionLayers';

export type PhysicsBodyKind = 'static' | 'kinematic' | 'dynamic' | 'trigger' | 'visual-only';

export type ColliderShapeKind = 'primitive' | 'compound-primitive' | 'convex' | 'mesh' | 'none';

export type PhysicsAuthorityKind =
	| 'physics-body'
	| 'controller-capsule'
	| 'trigger'
	| 'scripted-transform'
	| 'none';

export type PhysicsMaterialProfile = {
	angularDamping?: number;
	friction?: number;
	gravityEnabled?: boolean;
	linearDamping?: number;
	mass?: number;
	restitution?: number;
};

export type PhysicsLifecyclePolicy = {
	pooled: boolean;
	resetAngularVelocity: boolean;
	resetCollisionState: boolean;
	resetEnabledState: boolean;
	resetEventSubscriptions: boolean;
	resetGameplayOwner: boolean;
	resetLinearVelocity: boolean;
	resetTimers: boolean;
	resetTransform: boolean;
};

export type PhysicsObjectPolicy = {
	authority: PhysicsAuthorityKind;
	bodyKind: PhysicsBodyKind;
	ccdRequired: boolean;
	colliderShape: ColliderShapeKind;
	collisionLayer: CollisionLayerName;
	collisionMask: CollisionLayerMask;
	lifecycle: PhysicsLifecyclePolicy;
	material: PhysicsMaterialProfile;
	sleepingAllowed: boolean;
	visualMeshAuthoritative: false;
};

export const DEFAULT_NON_POOLED_LIFECYCLE: PhysicsLifecyclePolicy = {
	pooled: false,
	resetAngularVelocity: false,
	resetCollisionState: false,
	resetEnabledState: false,
	resetEventSubscriptions: false,
	resetGameplayOwner: false,
	resetLinearVelocity: false,
	resetTimers: false,
	resetTransform: false,
};

export const DEFAULT_POOLED_PHYSICS_LIFECYCLE: PhysicsLifecyclePolicy = {
	pooled: true,
	resetAngularVelocity: true,
	resetCollisionState: true,
	resetEnabledState: true,
	resetEventSubscriptions: true,
	resetGameplayOwner: true,
	resetLinearVelocity: true,
	resetTimers: true,
	resetTransform: true,
};
