<script>
	import { onDestroy, onMount } from 'svelte';
	import WaButton from '@awesome.me/webawesome/dist/components/button/button.js';
	import '@fontsource/bbh-bartle/400.css';

	let { featuredPlayers = [] } = $props();

	let scrollY = $state(0);
	let heroElement;
	let flowCanvas;
	let cleanupFlowField = () => {};

	const cueOpacity = $derived(Math.max(0, 1 - scrollY / 180));

	function mulberry32(seed) {
		return () => {
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	function hash3(x, y, z) {
		let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1442695041);
		n = Math.imul(n ^ (n >>> 13), 1274126177);
		return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
	}

	function noise3(x, y, z) {
		const xi = Math.floor(x);
		const yi = Math.floor(y);
		const zi = Math.floor(z);
		const xf = x - xi;
		const yf = y - yi;
		const zf = z - zi;
		const u = xf * xf * (3 - 2 * xf);
		const v = yf * yf * (3 - 2 * yf);
		const w = zf * zf * (3 - 2 * zf);
		const lerp = (a, b, t) => a + (b - a) * t;

		const c000 = hash3(xi, yi, zi);
		const c100 = hash3(xi + 1, yi, zi);
		const c010 = hash3(xi, yi + 1, zi);
		const c110 = hash3(xi + 1, yi + 1, zi);
		const c001 = hash3(xi, yi, zi + 1);
		const c101 = hash3(xi + 1, yi, zi + 1);
		const c011 = hash3(xi, yi + 1, zi + 1);
		const c111 = hash3(xi + 1, yi + 1, zi + 1);

		return lerp(
			lerp(lerp(c000, c100, u), lerp(c010, c110, u), v),
			lerp(lerp(c001, c101, u), lerp(c011, c111, u), v),
			w
		);
	}

	function startFlowField() {
		const canvas = flowCanvas;
		const host = heroElement;
		if (!canvas || !host) return () => {};

		const ctx = canvas.getContext('2d');
		if (!ctx) return () => {};

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const rand = mulberry32(0x48454144);
		const noiseScale = 0.0016;
		const timeStep = 0.0015;
		const drawStep = 0.45;
		const moveSpeed = 0.1;
		const drawSegments = 20;

		let width = 0;
		let height = 0;
		let dpr = 1;
		let time = 0;
		let raf = 0;
		let running = false;
		let particles = [];

		let strokeColor = '#4f8fd4';

		function syncThemeColors() {
			const isDark = document.documentElement.classList.contains('wa-dark');
			strokeColor = isDark ? '#bcd9ff' : '#4f8fd4';
			canvas.style.opacity = isDark ? '0.78' : '0.9';

			if (reduceMotion && width && height && particles.length) step(28);
		}

		syncThemeColors();
		const themeObserver = new MutationObserver(syncThemeColors);
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});

		function spawn(particle) {
			particle.x = rand() * width;
			particle.y = rand() * height;
			particle.age = Math.floor(rand() * 120);
		}

		function step(segments = drawSegments) {
			ctx.clearRect(0, 0, width, height);
			ctx.globalCompositeOperation = 'source-over';
			ctx.globalAlpha = 1;
			ctx.strokeStyle = strokeColor;
			ctx.lineWidth = 1.5;
			ctx.lineCap = 'round';
			ctx.beginPath();

			const segmentTime = timeStep / segments;

			for (const particle of particles) {
				let x = particle.x;
				let y = particle.y;
				ctx.moveTo(x, y);

				for (let i = 0; i < segments; i += 1) {
					const angle =
						noise3(x * noiseScale, y * noiseScale, time + i * segmentTime) * Math.PI * 2;
					const nextX = x + Math.cos(angle) * drawStep;
					const nextY = y + Math.sin(angle) * drawStep;

					if (nextX < 0 || nextX > width || nextY < 0 || nextY > height) break;

					ctx.lineTo(nextX, nextY);
					x = nextX;
					y = nextY;
				}

				const moveAngle =
					noise3(particle.x * noiseScale, particle.y * noiseScale, time) * Math.PI * 2;
				particle.x += Math.cos(moveAngle) * moveSpeed;
				particle.y += Math.sin(moveAngle) * moveSpeed;
				particle.age += 1;

				if (
					particle.x < 0 ||
					particle.x > width ||
					particle.y < 0 ||
					particle.y > height ||
					particle.age > 240
				) {
					spawn(particle);
				}
			}

			ctx.stroke();
			time += timeStep;
		}

		function resize() {
			const rect = host.getBoundingClientRect();
			if (rect.width === width && rect.height === height) return;

			width = rect.width;
			height = rect.height;
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, width, height);

			const count = Math.min(700, Math.max(260, Math.round((width * height) / 2200)));
			particles = Array.from({ length: count }, () => {
				const particle = { x: 0, y: 0, age: 0 };
				spawn(particle);
				return particle;
			});

			if (reduceMotion) step(28);
		}

		function loop() {
			if (!running) return;
			step();
			raf = requestAnimationFrame(loop);
		}

		function start() {
			if (running) return;
			running = true;
			raf = requestAnimationFrame(loop);
		}

		function stop() {
			running = false;
			if (raf) cancelAnimationFrame(raf);
			raf = 0;
		}

		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(host);
		resize();

		if (reduceMotion) {
			return () => {
				themeObserver.disconnect();
				resizeObserver.disconnect();
			};
		}

		const visibilityObserver = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) start();
				else stop();
			},
			{ threshold: 0 }
		);
		visibilityObserver.observe(host);
		start();

		return () => {
			stop();
			themeObserver.disconnect();
			visibilityObserver.disconnect();
			resizeObserver.disconnect();
		};
	}

	onMount(() => {
		cleanupFlowField = startFlowField();
	});

	onDestroy(() => cleanupFlowField());
</script>

<svelte:window bind:scrollY />

<section class="hero" bind:this={heroElement} aria-labelledby="hero-title">
	<canvas class="flow-field" bind:this={flowCanvas} aria-hidden="true"></canvas>

	<div class="hero-inner">
		<div class="hero-title-wrap">
			{#if featuredPlayers.length > 0}
				<div class="featured-players" aria-label="Recent award winners">
					{#each featuredPlayers as player (player.id)}
						<wa-button
							class="featured-player"
							pill
							size="s"
							variant="primary"
							appearance="filled"
							href={player.href}
							aria-label="{player.name}, {player.awardLabel} {player.season}"
						>
							{player.name}
						</wa-button>
					{/each}
				</div>
			{/if}

			<h1 class="statement" id="hero-title">
				<span class="hero-mark">HEADWAR</span>
				<span class="hero-line">The modern player index.</span>
			</h1>
		</div>
	</div>
</section>

<div
	class="search-cue"
	aria-hidden="true"
	style:opacity={cueOpacity}
	style:transform={`translateX(-50%) translateY(${(1 - cueOpacity) * 10}px)`}
>
	<svg class="cue-arrow" viewBox="0 0 64 96" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g class="cue-strokes" transform="rotate(8 32 48)">
			<path
				class="arrow ghost"
				d="M12 8 C24 18 10 34 24 44 C36 53 34 68 42 80"
				transform="translate(1.2 -0.8)"
			/>
			<path class="arrow" d="M12 8 C24 18 10 34 24 44 C36 53 34 68 42 80" />
			<path
				class="arrow ghost"
				d="M32 70 C35 76 39 80 43 83 C48 78 51 74 53 69"
				transform="translate(1.2 -0.8)"
			/>
			<path class="arrow" d="M32 70 C35 76 39 80 43 83 C48 78 51 74 53 69" />
		</g>
	</svg>

	<svg class="cue-arrow" viewBox="0 0 64 96" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g class="cue-strokes" transform="rotate(-1 32 48)">
			<path
				class="arrow ghost"
				d="M32 6 C38 18 26 30 34 42 C42 54 30 66 33 86"
				transform="translate(-1 1)"
			/>
			<path class="arrow" d="M32 6 C38 18 26 30 34 42 C42 54 30 66 33 86" />
			<path
				class="arrow ghost"
				d="M23 76 C26 82 30 86 34 89 C40 84 44 80 47 75"
				transform="translate(-1 1)"
			/>
			<path class="arrow" d="M23 76 C26 82 30 86 34 89 C40 84 44 80 47 75" />
		</g>
	</svg>

	<svg class="cue-arrow" viewBox="0 0 64 96" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g class="cue-strokes" transform="rotate(-8 32 48)">
			<path
				class="arrow ghost"
				d="M52 8 C40 18 54 34 40 44 C28 53 30 68 22 80"
				transform="translate(1 1.2)"
			/>
			<path class="arrow" d="M52 8 C40 18 54 34 40 44 C28 53 30 68 22 80" />
			<path
				class="arrow ghost"
				d="M11 69 C14 74 17 78 22 83 C27 79 31 75 34 70"
				transform="translate(1 1.2)"
			/>
			<path class="arrow" d="M11 69 C14 74 17 78 22 83 C27 79 31 75 34 70" />
		</g>
	</svg>
</div>

<style>
	.hero {
		position: relative;
		display: grid;
		place-items: center;
		box-sizing: border-box;
		min-height: calc(100vh - 5rem);
		min-height: calc(100dvh - 5rem);
		overflow: hidden;
		isolation: isolate;
		margin-top: calc(var(--page-pad-top, 2.5rem) * -1);
		padding: clamp(2rem, 6vh, 4rem) 1rem clamp(4.5rem, 11vh, 7rem);
	}

	.flow-field {
		position: absolute;
		inset: 0;
		z-index: -1;
		display: block;
		width: 100%;
		height: 100%;
		pointer-events: none;
		opacity: 0.55;
	}

	.hero::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		mask-image:
			linear-gradient(to right, black 0%, transparent 12%, transparent 88%, black 100%),
			linear-gradient(to bottom, transparent 68%, black 100%);
		-webkit-mask-image:
			linear-gradient(to right, black 0%, transparent 12%, transparent 88%, black 100%),
			linear-gradient(to bottom, transparent 68%, black 100%);
		mask-composite: add;
		-webkit-mask-composite: source-over;
	}

	.hero::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background: radial-gradient(
			ellipse 85% 75% at 50% 42%,
			transparent 25%,
			var(--wa-color-surface-default) 100%
		);
	}

	.search-cue {
		--cue-blue: #2564ab;
		--nav-top: calc(max(1.5rem, env(safe-area-inset-bottom)) + 2.75rem);
		position: fixed;
		left: 50%;
		bottom: calc(var(--nav-top) + 0.35rem);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 1rem;
		max-width: calc(100vw - 2rem);
		height: 5.5rem;
		z-index: 100;
		pointer-events: none;
		will-change: opacity, transform;
		transition:
			opacity 120ms linear,
			transform 120ms linear;
	}

	:global(html.wa-dark) .search-cue {
		--cue-blue: #8ab9f3;
	}

	.cue-arrow {
		display: block;
		width: 3.5rem;
		height: 5.5rem;
		flex: 0 0 auto;
		overflow: visible;
		filter: drop-shadow(0 1px 0 color-mix(in srgb, var(--cue-blue) 22%, transparent));
		animation: cue-drift 3.2s ease-in-out infinite;
	}

	.cue-arrow:nth-child(2) {
		animation-delay: -1.1s;
	}

	.cue-arrow:nth-child(3) {
		animation-delay: -2.2s;
	}

	.cue-strokes .arrow {
		stroke: var(--cue-blue);
		stroke-width: 2.6;
		stroke-linecap: round;
		stroke-linejoin: round;
		opacity: 0.82;
	}

	.cue-strokes .arrow.ghost {
		stroke-width: 1.1;
		opacity: 0.32;
	}

	@keyframes cue-drift {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		50% {
			transform: translateY(4px) rotate(0.6deg);
		}
	}

	@keyframes hero-rise {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.hero-inner {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(1.75rem, 4vw, 3rem);
		width: 100%;
		margin: 0 auto;
		container-type: inline-size;
	}

	.hero-inner::before {
		content: '';
		position: absolute;
		inset: -6rem -10rem;
		z-index: -1;
		pointer-events: none;
		background: radial-gradient(
			ellipse at center,
			color-mix(in srgb, var(--wa-color-surface-default) 90%, transparent) 0%,
			transparent 74%
		);
		backdrop-filter: blur(18px);
		-webkit-backdrop-filter: blur(18px);
		mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
		-webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
	}

	.hero-title-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2.5rem;
		width: 100%;
	}

	.featured-players {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.6rem;
		max-width: min(90vw, 64rem);
	}

	.featured-player::part(base) {
		white-space: nowrap;
		font-weight: 600;
		letter-spacing: -0.01em;
		box-shadow: var(--wa-shadow-m);
	}

	.featured-player::part(label) {
		display: block;
		white-space: nowrap;
	}

	.statement {
		display: flex;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 0.75rem clamp(1.25rem, 3cqi, 2.75rem);
		max-width: 100%;
		margin: 0;
		animation: hero-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.hero-mark {
		font-family: 'BBH Bartle', 'Inter Variable', system-ui, sans-serif;
		font-weight: 400;
		font-size: clamp(1.5rem, 6.4cqi, 200px);
		line-height: 0.8;
		letter-spacing: 0;
		white-space: nowrap;
		color: #2564ab;
	}

	:global(html.wa-dark) .hero-mark {
		color: #8ab9f3;
	}

	@container (max-width: 640px) {
		.hero-mark {
			font-size: clamp(1.5rem, 10.2cqi, 200px);
		}
	}

	.hero-line {
		padding-bottom: 0.08em;
		max-width: 9em;
		font-family: 'Inter Variable', system-ui, sans-serif;
		font-size: clamp(1.4rem, 2cqi, 2.6rem);
		line-height: 1.04;
		font-weight: 400;
		letter-spacing: -0.03em;
		color: var(--wa-color-text-normal);
		animation: hero-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) 90ms both;
	}

	@media (max-width: 480px) {
		.search-cue {
			--nav-top: calc(max(2rem, env(safe-area-inset-bottom)) + 2.75rem);
		}

		.cue-arrow {
			width: 3rem;
			height: 4.75rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.statement,
		.hero-line {
			animation: none;
		}

		.search-cue {
			transition: none;
		}

		.cue-arrow {
			animation: none;
		}
	}
</style>
