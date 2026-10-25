<script>
	import WaButton from "@awesome.me/webawesome/dist/components/button/button.js";
	import WaIcon from "@awesome.me/webawesome/dist/components/icon/icon.js";
	import WaSlider from "@awesome.me/webawesome/dist/components/slider/slider.js";
	import WaSpinner from "@awesome.me/webawesome/dist/components/spinner/spinner.js";

	let { video, onPlay = null, autoplay = false } = $props();

	let playerEl = $state(null);
	let videoEl = $state(null);
	let playing = $state(false);
	let ended = $state(false);
	let waiting = $state(false);
	let failed = $state(false);
	let muted = $state(false);
	let volume = $state(1);
	let lastVolume = $state(1);
	let currentTime = $state(0);
	let duration = $state(0);
	let isFullscreen = $state(false);
	let controlsVisible = $state(false);
	let hideControlsTimer;

	let volumeIcon = $derived(
		muted || volume === 0
			? "volume-xmark"
			: volume < 0.5
				? "volume-low"
				: "volume-high",
	);

	function formatTime(seconds) {
		if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
		const total = Math.floor(seconds);
		const hours = Math.floor(total / 3600);
		const minutes = Math.floor((total % 3600) / 60);
		const secs = total % 60;
		if (hours > 0) {
			return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
		}
		return `${minutes}:${String(secs).padStart(2, "0")}`;
	}

	function clearHideControlsTimer() {
		if (hideControlsTimer) {
			clearTimeout(hideControlsTimer);
			hideControlsTimer = undefined;
		}
	}

	function scheduleHideControls() {
		clearHideControlsTimer();
		hideControlsTimer = setTimeout(() => {
			hideControlsTimer = undefined;
			controlsVisible = false;
		}, 1000);
	}

	function revealControls() {
		controlsVisible = true;
		scheduleHideControls();
	}

	function releasePointerFocus(event) {
		// Mouse clicks focus the clicked control, and focus-within keeps the
		// overlay visible even after the pointer leaves. Keyboard focus should
		// still pin the controls, so only release focus for pointer clicks.
		if (!event.detail) return;
		const active = document.activeElement;
		if (active && active !== playerEl && playerEl?.contains(active)) {
			active.blur();
		}
	}

	function togglePlay() {
		if (!videoEl || failed) return;
		if (ended) {
			videoEl.currentTime = 0;
			ended = false;
		}
		if (videoEl.paused) {
			videoEl.play().catch(() => {});
		} else {
			videoEl.pause();
		}
	}

	function seek(event) {
		const nextTime = Number(event.currentTarget.value);
		if (!Number.isFinite(nextTime)) return;
		currentTime = nextTime;
		if (videoEl) videoEl.currentTime = nextTime;
	}

	function toggleMute() {
		if (!videoEl) return;
		if (videoEl.muted || videoEl.volume === 0) {
			if (videoEl.volume === 0) videoEl.volume = lastVolume || 1;
			videoEl.muted = false;
		} else {
			videoEl.muted = true;
		}
	}

	function setVolume(event) {
		const nextVolume = Number(event.currentTarget.value);
		if (!videoEl || !Number.isFinite(nextVolume)) return;
		const clamped = Math.min(Math.max(nextVolume, 0), 1);
		if (clamped > 0) lastVolume = clamped;
		videoEl.volume = clamped;
		videoEl.muted = clamped === 0;
	}

	function toggleFullscreen() {
		if (document.fullscreenElement) {
			document.exitFullscreen?.();
			return;
		}
		if (playerEl?.requestFullscreen) {
			playerEl.requestFullscreen().catch(() => {});
		} else if (videoEl?.webkitEnterFullscreen) {
			videoEl.webkitEnterFullscreen();
		}
	}

	$effect(() => {
		const handleFullscreenChange = () => {
			isFullscreen = document.fullscreenElement === playerEl;
		};
		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () =>
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
	});

	// The modal gets a fresh player after a click, so the user activation is
	// still alive for this play() call. If a browser blocks it anyway, the big
	// play button stays available.
	$effect(() => {
		if (!autoplay || !videoEl) return;
		videoEl.play().catch(() => {});
	});

	$effect(() => () => clearHideControlsTimer());
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="player"
	class:controls-visible={controlsVisible}
	bind:this={playerEl}
	onclick={releasePointerFocus}
	onpointerenter={revealControls}
	onpointermove={revealControls}
	onpointerdown={revealControls}
>
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		bind:this={videoEl}
		class="media"
		preload="none"
		playsinline
		poster={video.thumbnail || undefined}
		aria-label={video.title}
		onclick={togglePlay}
		onplay={() => {
			playing = true;
			ended = false;
			waiting = false;
			onPlay?.(videoEl);
			revealControls();
		}}
		onpause={() => {
			playing = false;
			revealControls();
		}}
		onended={() => {
			playing = false;
			ended = true;
			revealControls();
		}}
		onwaiting={() => {
			waiting = true;
		}}
		onplaying={() => {
			waiting = false;
		}}
		oncanplay={() => {
			waiting = false;
		}}
		onloadedmetadata={() => {
			duration = videoEl?.duration || 0;
		}}
		ontimeupdate={() => {
			currentTime = videoEl?.currentTime || 0;
		}}
		onvolumechange={() => {
			const nextVolume = videoEl?.volume ?? 1;
			muted = videoEl?.muted ?? false;
			volume = nextVolume;
			if (!muted && nextVolume > 0) lastVolume = nextVolume;
		}}
		onerror={() => {
			failed = true;
			waiting = false;
		}}
	>
		<source src={video.mp4Url} type="video/mp4" />
	</video>

	{#if !playing && !failed && !waiting}
		<wa-button
			class="big-play"
			pill
			variant="brand"
			appearance="accent"
			onclick={togglePlay}
		>
			<wa-icon name={ended ? "rotate-left" : "play"}></wa-icon>
			<span class="sr-only">{ended ? "Replay" : "Play"}</span>
		</wa-button>
	{/if}

	{#if waiting && !failed}
		<div class="buffering" aria-hidden="true">
			<wa-spinner></wa-spinner>
		</div>
	{/if}

	{#if failed}
		<div class="video-error">
			<span>Video unavailable</span>
			<a href={video.pageUrl} target="_blank" rel="noopener noreferrer">
				Watch on MLB
				<wa-icon name="arrow-up-right-from-square"></wa-icon>
			</a>
		</div>
	{/if}

	<div class="controls">
		<div class="controls-row">
			<wa-button class="control" appearance="plain" onclick={togglePlay}>
				<wa-icon name={playing ? "pause" : "play"}></wa-icon>
				<span class="sr-only">{playing ? "Pause" : "Play"}</span>
			</wa-button>

			<span class="time">
				{formatTime(currentTime)} / {formatTime(duration)}
			</span>

			<span class="spacer"></span>

			<div class="volume">
				<wa-button class="control" appearance="plain" onclick={toggleMute}>
					<wa-icon name={volumeIcon}></wa-icon>
					<span class="sr-only">
						{muted || volume === 0 ? "Unmute" : "Mute"}
					</span>
				</wa-button>

				<wa-slider
					class="volume-slider"
					size="xs"
					min={0}
					max={1}
					step={0.05}
					value={muted ? 0 : volume}
					oninput={setVolume}
				>
					<span slot="label" class="sr-only">Volume</span>
				</wa-slider>
			</div>

			<wa-button class="control" appearance="plain" onclick={toggleFullscreen}>
				<wa-icon name={isFullscreen ? "compress" : "expand"}></wa-icon>
				<span class="sr-only">
					{isFullscreen ? "Exit fullscreen" : "Fullscreen"}
				</span>
			</wa-button>
		</div>

		<wa-slider
			class="seek"
			size="xs"
			min={0}
			max={duration || 1}
			step={0.1}
			value={currentTime}
			disabled={!duration}
			oninput={seek}
		>
			<span slot="label" class="sr-only">Seek</span>
		</wa-slider>
	</div>
</div>

<style>
	.player {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		background-color: #000;
		overflow: hidden;
		isolation: isolate;
	}

	.media {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		background-color: #000;
		cursor: pointer;
	}

	.big-play {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 2;
	}

	.big-play::part(base) {
		width: 3.25rem;
		height: 3.25rem;
		padding: 0;
		border-radius: 50%;
		box-shadow: 0 4px 18px rgb(0 0 0 / 0.45);
	}

	.big-play wa-icon {
		font-size: 1.2rem;
	}

	.buffering {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		pointer-events: none;
		color: #fff;
	}

	.buffering wa-spinner {
		font-size: 2rem;
	}

	.video-error {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: 1rem;
		background-color: rgb(0 0 0 / 0.8);
		color: #fff;
		text-align: center;
		font-size: var(--wa-font-size-s);
	}

	.video-error a {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--wa-color-brand-fill-loud, #fff);
	}

	.controls {
		position: absolute;
		inset: auto 0 0 0;
		z-index: 3;
		display: flex;
		flex-direction: column;
		padding-top: 0.85rem;
		background: linear-gradient(to bottom, transparent, rgb(0 0 0 / 0.72));
		opacity: 0;
		pointer-events: none;
		transition: opacity 150ms ease;
	}

	/* Let clicks through the transparent gradient area; only the controls capture input. */
	.controls :is(wa-button, .seek, .volume-slider) {
		pointer-events: none;
	}

	.player.controls-visible .controls,
	.player:focus-within .controls {
		opacity: 1;
	}

	.player.controls-visible .controls :is(wa-button, .seek, .volume-slider),
	.player:focus-within .controls :is(wa-button, .seek, .volume-slider) {
		pointer-events: auto;
	}

	.controls-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
		height: 1.75rem;
		padding: 0 1rem 0 1rem;
		pointer-events: none;
	}

	.control::part(base) {
		min-width: 1.75rem;
		height: 1.75rem;
		padding: 0 0.3rem;
		color: #fff;
		background: transparent;
	}

	.control::part(base):hover {
		background-color: rgb(255 255 255 / 0.16);
	}

	.control wa-icon {
		font-size: 0.9rem;
	}

	.time {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: rgb(255 255 255 / 0.85);
		white-space: nowrap;
	}

	.spacer {
		flex: 1;
	}

	.volume {
		display: flex;
		align-items: center;
		gap: 0.1rem;
		padding-right: 0.5rem;
		min-width: 0;
	}

	.volume-slider {
		width: 4rem;
		min-width: 0;
	}

	.volume-slider::part(label) {
		margin-bottom: 0;
	}

	.volume-slider::part(slider) {
		margin-top: 0;
		padding: 6px 0;
	}

	.volume-slider::part(track) {
		
	}

	.volume-slider::part(indicator) {
		
	}

	.volume-slider::part(thumb) {
		
	}


	.seek {
		padding: 0.5rem 1rem 1rem 1rem;
	}

	/* Collapse the hidden label area and give the thin track a larger hit target. */
	.seek::part(label) {
		margin-bottom: 0;
	}

	.seek::part(slider) {
		margin-top: 0;
		padding: 7px 0 5px;
	}

	.seek::part(track) {
		
	}

	.seek::part(indicator) {
		
	}

	.seek::part(thumb) {
		
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (hover: none), (pointer: coarse) {
		.controls-row {
			height: 2rem;
		}

		.control::part(base) {
			min-width: 2rem;
			height: 2rem;
		}

		.volume-slider {
			width: 3.25rem;
		}

		.seek::part(slider) {
			padding: 9px 0 7px;
		}

		.volume-slider::part(slider) {
			padding: 8px 0;
		}
	}

	.player:fullscreen {
		width: 100vw;
		height: 100vh;
		aspect-ratio: auto;
	}

	.player:fullscreen .media {
		height: 100%;
	}
</style>
