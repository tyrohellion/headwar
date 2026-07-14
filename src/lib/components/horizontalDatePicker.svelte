<script>
	import { onMount } from 'svelte';
	import WaTabGroup from '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
	import WaTab from '@awesome.me/webawesome/dist/components/tab/tab.js';

	let { selectedDate = $bindable(), daysRange = 30 } = $props();

	const today = new Date();
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	if (!selectedDate) {
		selectedDate = todayStr;
	}

	let todayTabEl = $state(null);

	let calendarDays = $derived.by(() => {
		const days = [];
		const base = new Date();

		for (let i = -daysRange; i <= daysRange; i++) {
			const current = new Date(base);
			current.setDate(base.getDate() + i);

			const year = current.getFullYear();
			const month = String(current.getMonth() + 1).padStart(2, '0');
			const day = String(current.getDate()).padStart(2, '0');
			const dateStr = `${year}-${month}-${day}`;

			days.push({
				dateString: dateStr,
				dayName: current.toLocaleDateString([], { weekday: 'short' }),
				dayNum: current.getDate(),
				isToday: today.toDateString() === current.toDateString()
			});
		}
		return days;
	});

	$effect(() => {
		if (todayTabEl) {
			requestAnimationFrame(() => {
				setTimeout(() => {
					todayTabEl?.scrollIntoView({
						behavior: 'smooth',
						block: 'nearest',
						inline: 'center'
					});
				}, 100);
			});
		}
	});

	function handleTabShow(event) {
		const tabName = event.detail.name;
		if (tabName && selectedDate !== tabName) {
			selectedDate = tabName;
		}
	}

	function registerTodayElement(node, isToday) {
		if (isToday) {
			todayTabEl = node;
		}
	}
</script>

<div class="calendar-tabs-wrapper">
	<wa-tab-group active={selectedDate} onwa-tab-show={handleTabShow}>
		{#each calendarDays as day (day.dateString)}
			<wa-tab
				slot="nav"
				panel={day.dateString}
				class="calendar-date-tab"
				class:is-today={day.isToday}
				use:registerTodayElement={day.isToday}
			>
				<div class="tab-date-layout">
					<span class="day-name">{day.dayName}</span>
					<span class="day-number">{day.dayNum}</span>
					{#if day.isToday}
						<span class="today-dot-indicator"></span>
					{/if}
				</div>
			</wa-tab>
		{/each}
	</wa-tab-group>
</div>

<style>
	.calendar-tabs-wrapper {
		width: 100%;
	}

	wa-tab-group::part(base) {
		border: none;
	}

	wa-tab-group::part(nav) {
		scrollbar-width: none;
	}

	wa-tab-group::part(nav)::-webkit-scrollbar {
		display: none;
	}

	.calendar-date-tab {
		position: relative;
	}

	.tab-date-layout {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.day-name {
		font-size: var(--wa-font-size-2xs, 0.7rem);
		text-transform: uppercase;
		font-weight: var(--wa-font-weight-semibold, 600);
		letter-spacing: 0.5px;
	}

	.day-number {
		font-size: var(--wa-font-size-m, 1rem);
		font-weight: var(--wa-font-weight-bold, 700);
	}

	.today-dot-indicator {
		position: absolute;
		bottom: 0.5rem;
		left: 50%;
		transform: translateX(-50%);
		width: 1.5rem;
		height: 4px;
		border-radius: 0.25rem;
		background-color: var(--wa-color-brand-text-default, currentColor);
	}
</style>
