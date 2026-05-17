import { describe, expect, it } from 'vitest';

import { DEFAULT_NON_POOLED_LIFECYCLE, DEFAULT_POOLED_PHYSICS_LIFECYCLE } from './physicsMetadata';

describe('physicsMetadata', () => {
	it('requires pooled physics objects to reset all runtime state categories', () => {
		expect(Object.values(DEFAULT_POOLED_PHYSICS_LIFECYCLE).every(Boolean)).toBe(true);
	});

	it('keeps non-pooled lifecycle metadata explicit but inactive', () => {
		expect(DEFAULT_NON_POOLED_LIFECYCLE.pooled).toBe(false);
		expect(DEFAULT_NON_POOLED_LIFECYCLE.resetTransform).toBe(false);
		expect(DEFAULT_NON_POOLED_LIFECYCLE.resetCollisionState).toBe(false);
	});
});
