import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined') {
	const storageAvailable =
		typeof window.localStorage !== 'undefined' &&
		typeof window.localStorage.getItem === 'function';

	if (!storageAvailable) {
		const store = new Map<string, string>();

		Object.defineProperty(window, 'localStorage', {
			value: {
				getItem: (key: string) => store.get(key) ?? null,
				setItem: (key: string, value: string) => {
					store.set(key, value);
				},
				removeItem: (key: string) => {
					store.delete(key);
				},
				clear: () => {
					store.clear();
				},
			},
			configurable: true,
		});
	}
}
