<script>
	import WaIcon from '@awesome.me/webawesome/dist/components/icon/icon.js';
	import WaTooltip from '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
	import WaBadge from '@awesome.me/webawesome/dist/components/badge/badge.js';
	import WaDivider from '@awesome.me/webawesome/dist/components/divider/divider.js';
</script>

<div class="footer">
	<wa-tooltip for="github">Source Code</wa-tooltip>
	<a href="https://github.com/tyrohellion/empyreon" target="_blank" aria-label="Home" id="github">
		<wa-button size="s" variant="neutral" appearance="plain">
			<wa-icon family="brands" name="github"></wa-icon>
		</wa-button>
	</a>
	<wa-divider></wa-divider>
	<div class="main-section-wrapper">
		<div class="main-section">
			<a href="https://svelte.dev" target="_blank" aria-label="svelte">
				<p>svelte</p>
			</a>
			<a href="https://webawesome.com" target="_blank" aria-label="webawesome">
				<p>webawesome</p>
			</a>
			<a href="https://github.com/jldbc/pybaseball" target="_blank" aria-label="pybaseball">
				<p>pybaseball</p>
			</a>
			<a href="http://statsapi.mlb.com/api/v1" target="_blank" aria-label="mlb-api">
				<p>mlb api</p>
			</a>
		</div>
		<wa-badge size="xs" variant="neutral" appearance="filled">
			This website is a non-commercial, open-source educational project built for fun. It is not
			affiliated with, endorsed by, or sponsored by Major League Baseball (MLB) or any of its
			constituent clubs. All player statistics and biographical data are retrieved via public
			endpoints and used for informational purposes only. All team names, logos, and brands are
			property of their respective owners.
		</wa-badge>
	</div>
</div>

<style>
	.footer {
		display: flex;
		flex-direction: column;
		padding: 1rem 2rem 1rem 2rem;
		flex-wrap: wrap;
		background-color: var(--wa-color-fill-normal, var(--wa-color-brand-fill-normal));
		border-top: 1px solid var(--wa-color-surface-border);
		width: 100%;
		box-sizing: border-box;
		flex-shrink: 0;
	}

	.main-section-wrapper {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: end;
		padding: 0 12px 0 12px;
	}

	.main-section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.5rem;
	}

	a {
		width: min-content;
		text-decoration: none;
		color: var(--wa-color-text-normal);
	}

	p {
		font-size: var(--wa-font-size-s);
		margin: 0px;
		white-space: nowrap;
		width: min-content;
	}

	p:hover {
		text-decoration: underline;
		cursor: pointer;
	}

	wa-badge {
		white-space: wrap;
		min-width: 320px;
		max-width: 700px;
		height: min-content;
	}
</style>
