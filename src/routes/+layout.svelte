<script>
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/navbar.svelte';
	import '@awesome.me/webawesome/dist/styles/webawesome.css';
	import Footer from '$lib/components/footer.svelte';
	import '@fontsource-variable/inter/wght.css';
	import '@fontsource-variable/jetbrains-mono/wght.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-layout">
	<Navbar />

	<main class="main">
		{@render children()}
	</main>

	<Footer />
</div>

<style>
	:root {
		--wa-font-family-body: 'Inter Variable', system-ui, sans-serif;
		--wa-font-family-heading: 'Inter Variable', system-ui, sans-serif;
		--wa-font-family-longform: 'Inter Variable', system-ui, sans-serif;
		--wa-font-family-code: 'JetBrains Mono Variable', monospace;
		--font-mono: 'JetBrains Mono Variable', monospace;
	}

	.app-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main {
		margin-top: 6rem;
		width: 100%;
		box-sizing: border-box;
		padding: 0 2rem 4rem 2rem;
		flex: 1 0 auto;
		min-height: calc(100vh - 6rem);
	}

	@media (max-width: 768px) {
		.main {
			padding: 0 1rem 4rem 1rem;
		}
	}
</style>
