/** Normalizes a deployment base path so public asset concatenation is stable. */
const normalizePublicBase = (base: string): string => {
	if (base.length === 0) {
		return '/';
	}

	return base.endsWith('/') ? base : `${base}/`;
};

/**
 * Resolves a Vite public asset path under the configured deployment base URL.
 */
export const publicAssetUrl = (path: string, base = import.meta.env.BASE_URL): string =>
	`${normalizePublicBase(base)}${path.replace(/^\/+/, '')}`;
