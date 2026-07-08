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

		animate(displayObject, {
			current: numericTarget,
			round: targetPrecision === 0 ? 1 : false,
			ease: 'outExpo',
			duration: 750,
			onUpdate: () => {
				if (!elementNode) return;

				let output = displayObject.current.toFixed(targetPrecision);

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
