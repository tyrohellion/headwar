import { browser } from '$app/environment';

function getInitialTheme() {
	if (!browser) return false;
	const savedMode = localStorage.getItem('wa-color-scheme');
	if (savedMode !== null) return savedMode === 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

class ThemeManager {
	isDark = $state(getInitialTheme());

	constructor() {
		if (browser) {
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
