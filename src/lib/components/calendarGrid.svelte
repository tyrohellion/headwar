<script>
	import ArrowButton from './arrowButton.svelte';
	import WaButton from '@awesome.me/webawesome/dist/components/button/button.js';

	let { selectedDate, ondateselect } = $props();

	const today = new Date();
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	let viewMonth = $state(today.getMonth());
	let viewYear = $state(today.getFullYear());

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	let calendarDays = $derived.by(() => {
		const days = [];
		const firstDay = new Date(viewYear, viewMonth, 1);
		const lastDay = new Date(viewYear, viewMonth + 1, 0);
		const startPadding = firstDay.getDay();

		for (let i = 0; i < startPadding; i++) {
			days.push({
				day: null,
				dateString: null,
				isCurrentMonth: false,
				isToday: false,
				isSelected: false
			});
		}

		for (let d = 1; d <= lastDay.getDate(); d++) {
			const month = String(viewMonth + 1).padStart(2, '0');
			const day = String(d).padStart(2, '0');
			const dateStr = `${viewYear}-${month}-${day}`;

			days.push({
				day: d,
				dateString: dateStr,
				isCurrentMonth: true,
				isToday: todayStr === dateStr,
				isSelected: selectedDate === dateStr
			});
		}

		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			days.push({
				day: null,
				dateString: null,
				isCurrentMonth: false,
				isToday: false,
				isSelected: false
			});
		}

		return days;
	});

	function prevMonth() {
		if (viewMonth === 0) {
			viewMonth = 11;
			viewYear--;
		} else {
			viewMonth--;
		}
	}

	function nextMonth() {
		if (viewMonth === 11) {
			viewMonth = 0;
			viewYear++;
		} else {
			viewMonth++;
		}
	}

	function selectDate(dateStr) {
		if (dateStr && ondateselect) {
			ondateselect(dateStr);
		}
	}
</script>

<div class="calendar-grid">
	<div class="calendar-header">
		<ArrowButton direction="prev" label="Previous month" onclick={prevMonth} />
		<span class="month-year-label">{monthNames[viewMonth]} {viewYear}</span>
		<ArrowButton direction="next" label="Next month" onclick={nextMonth} />
	</div>

	<div class="day-names-row">
		{#each dayNames as dayName}
			<span class="day-name-cell">{dayName}</span>
		{/each}
	</div>

	<div class="days-grid">
		{#each calendarDays as dayInfo, i (i)}
			{#if dayInfo.day}
				<wa-button
					size="s"
					variant={dayInfo.isToday ? 'brand' : 'neutral'}
					appearance="filled"
					class="day-cell"
					class:is-today={dayInfo.isToday}
					class:is-selected={dayInfo.isSelected}
					onclick={() => selectDate(dayInfo.dateString)}
					aria-label="{monthNames[viewMonth]} {dayInfo.day}, {viewYear}"
				>
					{dayInfo.day}
				</wa-button>
			{:else}
				<span class="day-cell empty"></span>
			{/if}
		{/each}
	</div>
</div>

<style>
	.calendar-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 280px;
		min-height: 375px;
	}

	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1rem 0 1rem;
	}

	.month-year-label {
		font-size: var(--wa-font-size-m, 1rem);
		font-weight: var(--wa-font-weight-semibold, 600);
		color: var(--wa-color-filled-on-normal);
		user-select: none;
	}

	.day-names-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}

	.day-name-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--wa-font-size-2xs);
		font-weight: var(--wa-font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--wa-color-neutral-on-quiet);
		padding: 0.25rem;
	}

	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.5rem;
	}

	wa-button.day-cell::part(base) {
		min-width: 40px;
		min-height: 40px;
		aspect-ratio: 1;
		font-size: var(--wa-font-size-s);
		font-weight: var(--wa-font-weight-normal);
		padding: 0;
	}

	wa-button.day-cell.is-today::part(base) {
		font-weight: var(--wa-font-weight-bold, 700);
	}

	wa-button.day-cell.is-selected::part(base) {
		font-weight: var(--wa-font-weight-bold, 700);
		box-shadow: inset 0 0 0 2px var(--wa-color-brand-text-default);
	}
</style>
