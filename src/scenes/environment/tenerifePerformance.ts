const isTenerifePerformanceLoggingEnabled = (): boolean =>
	typeof performance !== 'undefined' && import.meta.env.DEV;

export const measureTenerifeSyncStep = <Result>(label: string, callback: () => Result): Result => {
	if (!isTenerifePerformanceLoggingEnabled()) {
		return callback();
	}

	const measureId = `tenerife-${label}-${performance.now().toFixed(3)}`;
	const startMark = `${measureId}-start`;
	const endMark = `${measureId}-end`;
	performance.mark(startMark);

	try {
		return callback();
	} finally {
		performance.mark(endMark);
		performance.measure(measureId, startMark, endMark);
		const duration = performance.getEntriesByName(measureId).at(-1)?.duration ?? 0;
		console.info(`[Tenerife perf] ${label}: ${duration.toFixed(1)}ms`);
		performance.clearMarks(startMark);
		performance.clearMarks(endMark);
		performance.clearMeasures(measureId);
	}
};

export const measureTenerifeAsyncStep = async <Result>(
	label: string,
	callback: () => Promise<Result>,
): Promise<Result> => {
	if (!isTenerifePerformanceLoggingEnabled()) {
		return callback();
	}

	const measureId = `tenerife-${label}-${performance.now().toFixed(3)}`;
	const startMark = `${measureId}-start`;
	const endMark = `${measureId}-end`;
	performance.mark(startMark);

	try {
		return await callback();
	} finally {
		performance.mark(endMark);
		performance.measure(measureId, startMark, endMark);
		const duration = performance.getEntriesByName(measureId).at(-1)?.duration ?? 0;
		console.info(`[Tenerife perf] ${label}: ${duration.toFixed(1)}ms`);
		performance.clearMarks(startMark);
		performance.clearMarks(endMark);
		performance.clearMeasures(measureId);
	}
};

export const startTenerifePerfTimer = (): number | null => {
	if (!isTenerifePerformanceLoggingEnabled()) {
		return null;
	}

	return performance.now();
};

export const finishTenerifePerfTimer = (label: string, startedAt: number | null): void => {
	if (startedAt === null || !isTenerifePerformanceLoggingEnabled()) {
		return;
	}

	const duration = performance.now() - startedAt;
	console.info(`[Tenerife perf] ${label}: ${duration.toFixed(1)}ms`);
};
