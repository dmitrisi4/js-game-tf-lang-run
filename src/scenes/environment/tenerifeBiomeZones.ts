import { TENERIFE_FULL_ISLAND_TEIDE_POSITION } from '@/scenes/environment/tenerifeFullIslandConfig';

/**
 * Tenerife island biome zone definitions.
 *
 * World-space coordinate system (1 unit = 1 m, origin near Puerto de la Cruz):
 *   +X = west  / -X = east
 *   +Z = south / -Z = north
 *
 * Key landmarks (approximate world coords):
 *   Teide summit:       x ≈ -627, z ≈ -12
 *   Puerto de la Cruz:  x ≈  442, z ≈ -272  (north coast)
 *   Santa Cruz:         x ≈  900, z ≈  680  (east coast)
 *   Los Christianos:    x ≈ -200, z ≈  900  (south coast)
 *
 * Biome height bands (world Y after 0.02× scale):
 *   0–12  m  coastal / banana farm zone
 *   12–28 m  transition / scrubland
 *   28–55 m  laurel cloud-forest (humid north slopes)
 *   28–72 m  Canarian pine forest (all slopes outside Teide dry zone)
 *   55–72 m  sub-alpine scrub / sparse pine near caldera rim
 *   >72   m  Teide volcanic desert (no trees)
 */

export type TenerifeBiomeId =
	| 'teide-volcanic-desert'
	| 'subalpine-scrub'
	| 'canarian-pine-forest'
	| 'laurel-cloud-forest'
	| 'banana-farm-belt'
	| 'coastal-scrub';

export type TenerifeBiomeZoneType = {
	/** Short identifier used in generated asset IDs. */
	id: TenerifeBiomeId;
	/** Human-readable display name for editor/debug overlays. */
	displayName: string;
	/** Approximate minimum world-Y for this biome. */
	minHeight: number;
	/** Approximate maximum world-Y for this biome. */
	maxHeight: number;
	/** Minimum terrain slope (rise/run) that enables this biome. */
	minSlope: number;
	/** Maximum terrain slope (rise/run) that enables this biome. */
	maxSlope: number;
	/**
	 * Minimum horizontal distance from Teide summit for this biome.
	 * Use 0 to allow right up to the dry-zone edge.
	 */
	minTeideDistance: number;
	/**
	 * Optional: maximum horizontal distance from Teide summit.
	 * Undefined = no upper limit.
	 */
	maxTeideDistance?: number;
	/**
	 * Whether this biome prefers the humid north side of the island.
	 * north = z < NORTH_THRESHOLD, south = z > SOUTH_THRESHOLD.
	 */
	northernBias: boolean;
};

/** Z-axis threshold below which a position is considered "northern" (north coast). */
export const TENERIFE_NORTH_COAST_Z_THRESHOLD = 0;

/** Radius (world units) of the immediate Teide volcanic desert — no vegetation. */
export const TENERIFE_TEIDE_DRY_ZONE_RADIUS = 390;

/** Returns horizontal distance from any world position to the Teide summit. */
export const getDistanceToTeide = (x: number, z: number): number =>
	Math.hypot(x - TENERIFE_FULL_ISLAND_TEIDE_POSITION.x, z - TENERIFE_FULL_ISLAND_TEIDE_POSITION.z);

/** Returns true when the position falls inside the treeless Teide volcanic desert. */
export const isInsideTeideDesert = (x: number, z: number): boolean =>
	getDistanceToTeide(x, z) < TENERIFE_TEIDE_DRY_ZONE_RADIUS;

/**
 * Canonical biome zone table.
 * Evaluated in order; first passing zone wins.
 */
export const TENERIFE_BIOME_ZONES: TenerifeBiomeZoneType[] = [
	{
		id: 'teide-volcanic-desert',
		displayName: 'Teide Volcanic Desert',
		minHeight: 0,
		maxHeight: 999,
		minSlope: 0,
		maxSlope: 1,
		minTeideDistance: 0,
		maxTeideDistance: TENERIFE_TEIDE_DRY_ZONE_RADIUS,
		northernBias: false,
	},
	{
		id: 'subalpine-scrub',
		displayName: 'Sub-Alpine Scrub',
		minHeight: 55,
		maxHeight: 72,
		minSlope: 0.01,
		maxSlope: 0.85,
		minTeideDistance: TENERIFE_TEIDE_DRY_ZONE_RADIUS,
		northernBias: false,
	},
	{
		id: 'canarian-pine-forest',
		displayName: 'Canarian Pine Forest',
		minHeight: 28,
		maxHeight: 55,
		minSlope: 0.015,
		maxSlope: 0.8,
		minTeideDistance: TENERIFE_TEIDE_DRY_ZONE_RADIUS,
		northernBias: false,
	},
	{
		id: 'laurel-cloud-forest',
		displayName: 'Laurel Cloud Forest',
		minHeight: 22,
		maxHeight: 60,
		minSlope: 0.015,
		maxSlope: 0.75,
		minTeideDistance: TENERIFE_TEIDE_DRY_ZONE_RADIUS,
		northernBias: true,
	},
	{
		id: 'banana-farm-belt',
		displayName: 'Banana Farm Belt',
		minHeight: 3,
		maxHeight: 20,
		minSlope: 0,
		maxSlope: 0.18,
		minTeideDistance: 0,
		northernBias: false,
	},
	{
		id: 'coastal-scrub',
		displayName: 'Coastal Scrub',
		minHeight: 1,
		maxHeight: 26,
		minSlope: 0.005,
		maxSlope: 0.45,
		minTeideDistance: 0,
		northernBias: false,
	},
];

/**
 * Classifies a world position into the most specific biome zone.
 *
 * @param x       World X coordinate.
 * @param z       World Z coordinate.
 * @param height  Terrain Y at this position.
 * @param slope   Local terrain slope (rise/run).
 * @returns The matching biome zone, or `null` when no zone matches.
 */
export const classifyTenerifeBiome = (
	x: number,
	z: number,
	height: number,
	slope: number,
): TenerifeBiomeZoneType | null => {
	const teideDistance = getDistanceToTeide(x, z);
	const isNorthern = z < TENERIFE_NORTH_COAST_Z_THRESHOLD;

	for (const zone of TENERIFE_BIOME_ZONES) {
		if (height < zone.minHeight || height > zone.maxHeight) {
			continue;
		}
		if (slope < zone.minSlope || slope > zone.maxSlope) {
			continue;
		}
		if (teideDistance < zone.minTeideDistance) {
			continue;
		}
		if (zone.maxTeideDistance !== undefined && teideDistance > zone.maxTeideDistance) {
			continue;
		}
		// Zones with northernBias only activate on the north side of the island,
		// but don't block south-side fallthrough to the next matching zone.
		if (zone.northernBias && !isNorthern) {
			continue;
		}

		return zone;
	}

	return null;
};
