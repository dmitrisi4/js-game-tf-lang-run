import { describe, expect, it } from 'vitest';
import { shouldShowRoofParkourDebug } from './roofParkourController';

describe('roofParkourMarkers', () => {
	it('keeps extended probe visualization opt-in while markers remain gameplay-owned', () => {
		expect(shouldShowRoofParkourDebug('?tenerife=1&terrain=real')).toBe(false);
		expect(shouldShowRoofParkourDebug('?tenerife=1&terrain=real&roofDebug=1')).toBe(true);
	});
});
