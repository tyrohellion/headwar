<script>
	import { animate } from 'animejs';

	let { value = '0', precision = null } = $props();

	let elementNode = $state(null);
	let displayObject = { current: 0 };
	let previousValue = 0;

	let isDecimal = $derived(precision !== null || value.toString().includes('.'));
	let targetPrecision = $derived(
		precision !== null ? precision : isDecimal ? (value.toString().split('.')[1] || '').length : 0
	);

	$effect(() => {
		let numericTarget = parseFloat(value.toString().startsWith('.') ? `0${value}` : value);
		if (isNaN(numericTarget)) return;

		// Anime.js v4 Implementation
		animate(displayObject, {
			current: numericTarget,
			round: targetPrecision === 0 ? 1 : false, // Integer rounding vs float tracking
			ease: 'outExpo', // v4 property is 'ease' (no longer 'easing'), string format shortened
			duration: 750,
			onUpdate: () => {
				// v4 callback is 'onUpdate' (no longer 'update')
				if (!elementNode) return;

				let output = displayObject.current.toFixed(targetPrecision);

				// Keep consistency with leading-zero removal layout policy (.300 over 0.300)
				if (value.toString().startsWith('.') && output.startsWith('0.')) {
					output = output.substring(1);
				}

				elementNode.textContent = output;
			}
		});

		previousValue = numericTarget;
	});
</script>

<span bind:this={elementNode}>{value}</span>
