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
<div class="main">
	{@render children()}
</div>

<style>
	.main {
		margin-top: 6rem;
		width: 100%;
		height: 100%;
		padding: 0 2rem 0 2rem;
	}
</style>
