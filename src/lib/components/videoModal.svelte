<script>
	import { onMount } from "svelte";
	import { fade, fly } from "svelte/transition";
	import WaButton from "@awesome.me/webawesome/dist/components/button/button.js";
	import WaIcon from "@awesome.me/webawesome/dist/components/icon/icon.js";
	import VideoPlayer from "./videoPlayer.svelte";

	let { video, onClose } = $props();

	let dialogEl = $state(null);

	function handleKeydown(event) {
		if (event.key !== "Escape") return;
		// Esc is also how a browser leaves fullscreen; don't close the whole
		// modal when the player itself is fullscreen.
		if (document.fullscreenElement) return;
		event.preventDefault();
		onClose();
	}

	onMount(() => {
		dialogEl?.focus();
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="video-modal-backdrop"
	role="presentation"
	onclick={onClose}
	transition:fade={{ duration: 150 }}
></div>

<div class="video-modal-layer">
	<div
		class="video-modal"
		role="dialog"
		aria-modal="true"
		aria-label={video.title}
		tabindex="-1"
		bind:this={dialogEl}
		transition:fly={{ y: 12, duration: 180 }}
	>
		<header class="video-modal-header">
			<div class="video-modal-heading">
				<h2>{video.title}</h2>
				<p>
					{video.dateLabel}
					{#if video.durationLabel}
						<span class="meta-dot" aria-hidden="true">·</span>
						{video.durationLabel}
					{/if}
				</p>
			</div>

			<div class="video-modal-actions">
				<kbd class="esc-kbd" title="Press esc to close">esc</kbd>
				<wa-button
					size="m"
					appearance="plain"
					onclick={onClose}
					aria-label="Close video"
				>
					<wa-icon name="xmark" label="Close"></wa-icon>
				</wa-button>
			</div>
		</header>

		<VideoPlayer {video} autoplay />
	</div>
</div>

<style>
	.video-modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 201;
		background: var(--wa-color-overlay-modal);
	}

	.video-modal-layer {
		position: fixed;
		inset: 0;
		z-index: 202;
		display: grid;
		place-items: center;
		padding: 1rem;
		pointer-events: none;
	}

	.video-modal {
		/* Roughly 70% of the viewport wide, but also capped by height so the
		   whole player plus its header fits on short/landscape screens. */
		width: min(70dvw, calc((88dvh - 6rem) * 16 / 9), 80rem);
		max-width: 100%;
		display: flex;
		flex-direction: column;
		pointer-events: auto;
		background-color: var(--wa-color-surface-default);
		border: 1px solid var(--wa-color-border-quiet);
		border-radius: var(--wa-border-radius-l);
		box-shadow:
			0 0.75rem 2rem -0.5rem var(--wa-color-shadow),
			var(--wa-shadow-l);
		overflow: hidden;
		outline: none;
	}

	.video-modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		flex-shrink: 0;
		padding: 0.75rem 0.75rem 0.6rem 1rem;
	}

	.video-modal-heading {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.video-modal-heading h2 {
		margin: 0;
		font-size: var(--wa-font-size-m);
		font-weight: var(--wa-font-weight-semibold, 600);
		line-height: 1.35;
		color: var(--wa-color-text-normal);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.video-modal-heading p {
		margin: 0;
		font-size: var(--wa-font-size-xs);
		color: var(--wa-color-text-quiet);
	}

	.meta-dot {
		margin: 0 0.2rem;
	}

	.video-modal-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.esc-kbd {
		font-family: var(--font-mono, monospace);
		font-size: 0.75rem;
		border: 1px solid var(--wa-color-border-quiet);
		border-radius: 6px;
		padding: 0.05rem 0.4rem;
		opacity: 0.7;
		cursor: default;
		height: min-content;
		align-self: center;
		flex-shrink: 0;
	}

	@media (max-width: 600px) {
		.video-modal {
			width: 100%;
		}
	}
</style>
