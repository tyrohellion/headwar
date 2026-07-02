<script>
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/navbar.svelte';
	import '@awesome.me/webawesome/dist/styles/webawesome.css';
	import Footer from '$lib/components/footer.svelte';
	import '@fontsource-variable/jetbrains-mono/wght.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Navbar />
<div class="main">
	{@render children()}
</div>
<Footer />

<style>
	:root {
		--font-mono: font-family: 'JetBrains Mono Variable', monospace;
	}

	.main {
		margin-top: 6rem;
		width: 100%;
		height: 100%;
		padding: 0 2rem 4rem 2rem;
	}
</style>
