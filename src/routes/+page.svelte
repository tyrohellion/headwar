<script>
	import { fetchPybaseball } from '$lib/pybaseball.js';
	import WaButton from '@awesome.me/webawesome/dist/components/button/button.js';
	import WaIcon from '@awesome.me/webawesome/dist/components/icon/icon.js';
	import WaTooltip from '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';

	let rawData = $state('');
	let loading = $state(false);

	async function loadTestData() {
		loading = true;
		rawData = '';
		try {
			const data = await fetchPybaseball('statcast_batter_percentile_ranks', { year: 2026 });
			rawData = JSON.stringify(data, null, 2);
		} catch (err) {
			rawData = `Error: ${err.message}`;
		} finally {
			loading = false;
		}
	}
</script>

<wa-button
	size="s"
	variant={loading ? 'neutral' : 'primary'}
	loading={loading || undefined}
	disabled={loading}
	onclick={loadTestData}
>
	{loading ? 'Neutral' : 'fetch'}
</wa-button>

<wa-button
	size="s"
	id="refresh-button"
	variant={loading ? 'neutral' : 'primary'}
	loading={loading || undefined}
	disabled={loading}
	onclick={loadTestData}
>
	<wa-icon name="undo"></wa-icon>
</wa-button>

{#if rawData}
	<p
		style="white-space: pre-wrap; font-family: monospace; background: black; padding: 15px; border-radius: 5px;"
	>
		{rawData}
	</p>
{/if}
