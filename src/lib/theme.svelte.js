import { browser } from '$app/environment';

// Helper to determine initial state safely during Server-Side Rendering (SSR)
function getInitialTheme() {
	if (!browser) return false;
	const savedMode = localStorage.getItem('wa-color-scheme');
	if (savedMode !== null) return savedMode === 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Create a reactive state object using Svelte 5 runes
class ThemeManager {
	isDark = $state(getInitialTheme());

	constructor() {
		if (browser) {
			// Keep the DOM and localStorage synced reactively
			$effect.root(() => {
				$effect(() => {
					document.documentElement.classList.toggle('wa-dark', this.isDark);
					localStorage.setItem('wa-color-scheme', this.isDark ? 'dark' : 'light');
				});
			});

			// Listen for changes in system preference
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			mediaQuery.addEventListener('change', (event) => {
				const savedMode = localStorage.getItem('wa-color-scheme');
				if (!savedMode) {
					this.isDark = event.matches;
				}
			});
		}
	}

	toggle() {
		this.isDark = !this.isDark;
	}
}

export const theme = new ThemeManager();
