<script>
	import { onMount } from 'svelte';
	import WaTabGroup from '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
	import WaTab from '@awesome.me/webawesome/dist/components/tab/tab.js';
	import WaDialog from '@awesome.me/webawesome/dist/components/dialog/dialog.js';
	import WaButton from '@awesome.me/webawesome/dist/components/button/button.js';
	import WaIcon from '@awesome.me/webawesome/dist/components/icon/icon.js';
	import CalendarGrid from './calendarGrid.svelte';

	let { selectedDate = $bindable(), daysRange = 30 } = $props();

	let isCalendarOpen = $state(false);

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

	function handleCalendarDateSelect(dateStr) {
		selectedDate = dateStr;
		isCalendarOpen = false;
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
		<wa-button
			class="calendar-button"
			slot="nav"
			variant="neutral"
			size="s"
			tabindex="-1"
			onclick={() => (isCalendarOpen = true)}
			aria-label="Open calendar picker"
		>
			<wa-icon name="calendar"></wa-icon>
		</wa-button>
	</wa-tab-group>
</div>

<wa-dialog
	label="Select a date"
	class="calendar-dialog"
	open={isCalendarOpen}
	onwa-hide={() => (isCalendarOpen = false)}
>
	<CalendarGrid {selectedDate} ondateselect={handleCalendarDateSelect} />
	<div slot="footer">
		<wa-button variant="neutral" size="s" onclick={() => (isCalendarOpen = false)}>
			Cancel
		</wa-button>
	</div>
</wa-dialog>

<style>
	.calendar-button {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 0.5rem 0 0.5rem;
	}
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

	wa-dialog::part(panel) {
		width: auto;
		min-width: 320px;
		max-width: 90vw;
	}
</style>
