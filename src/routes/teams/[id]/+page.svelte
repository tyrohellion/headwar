<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { teamModalTrigger } from '#lib/teamModalTrigger.svelte.js';

	// Old/deep team links no longer lead to a full page. Open the same modal the
	// rest of the site uses, then return home when it is dismissed.
	onMount(() => {
		teamModalTrigger.open({ id: page.params.id }, { returnTo: '/' });
	});
</script>

<div class="team-route-placeholder" aria-hidden="true"></div>

<style>
	.team-route-placeholder {
		min-height: 60dvh;
	}
</style>
