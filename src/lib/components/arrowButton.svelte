<script>
	import WaIcon from '@awesome.me/webawesome/dist/components/icon/icon.js';

	let { direction = 'next', disabled = false, label = '', onclick = undefined } = $props();
</script>

<button
	type="button"
	class="arrow-btn"
	{disabled}
	{onclick}
	aria-label={label || (direction === 'prev' ? 'Previous' : 'Next')}
>
	<wa-icon name={direction === 'prev' ? 'chevron-left' : 'chevron-right'}></wa-icon>
</button>

<style>
	.arrow-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--wa-border-radius-circle, 50%);
		border: 1px solid var(--wa-color-border-quiet);
		background-color: var(--wa-color-fill-normal);
		color: var(--wa-color-filled-on-normal);
		cursor: pointer;
		transition: all 100ms ease;
		flex-shrink: 0;
	}

	.arrow-btn:hover:not(:disabled) {
		background-color: var(--wa-color-fill-brand);
		transform: scale(1.03);
	}

	.arrow-btn:active:not(:disabled) {
		transform: scale(0.9);
	}

	.arrow-btn:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}
</style>
