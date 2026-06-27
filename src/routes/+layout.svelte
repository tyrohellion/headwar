<script>
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/navbar.svelte';
	import '@awesome.me/webawesome/dist/styles/webawesome.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Navbar />
<div class="spacer"></div>

{@render children()}

<style>
	.spacer {
		height: 6rem;
	}
</style>
