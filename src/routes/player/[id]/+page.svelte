<script>
	import { fetchPlayerMacro } from '$lib/pybaseball.js';

	// Declare your reactive variables using Svelte 5 Runes
	let searchName = $state('');
	let selectedSeason = $state(2026);
	let stats = $state(null);
	let loading = $state(false);
	let error = $state('');

	async function handlePlayerLookup() {
		if (!searchName.trim()) return;

		loading = true;
		error = '';
		stats = null;

		try {
			// Server-filtered macro retrieval logic
			stats = await fetchPlayerMacro(searchName.trim(), selectedSeason);
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="app-container">
	<header>
		<h1>Player Metric Analytics</h1>
		<p>Search individual summary statistics directly across structural league databases.</p>
	</header>

	<!-- Search Controls Container -->
	<section class="search-bar">
		<input
			type="text"
			placeholder="Enter Player Name (e.g., Shohei Ohtani)"
			bind:value={searchName}
			onkeydown={(e) => e.key === 'Enter' && handlePlayerLookup()}
		/>
		<select bind:value={selectedSeason}>
			<option value={2026}>2026 Season</option>
			<option value={2025}>2025 Season</option>
			<option value={2024}>2024 Season</option>
		</select>
		<button onclick={handlePlayerLookup} disabled={loading}>
			{loading ? 'Searching...' : 'Search'}
		</button>
	</section>

	<!-- Status Messages -->
	{#if error}
		<div class="message error-msg">{error}</div>
	{/if}

	<!-- Player Analytics Dashboard View -->
	{#if stats}
		<article class="player-profile-card">
			<header class="profile-header">
				<h2>{stats.Name}</h2>
				<div class="meta-badge">{stats.Tm || 'Unknown Team'} — Age {stats.Age}</div>
			</header>

			<div class="metrics-grid">
				<div class="metric-box highlight">
					<span class="metric-label">OPS+</span>
					<span class="metric-value">{stats['OPS+'] ?? 'N/A'}</span>
				</div>
				<div class="metric-box">
					<span class="metric-label">Home Runs</span>
					<span class="metric-value">{stats.HR ?? 0}</span>
				</div>
				<div class="metric-box">
					<span class="metric-label">Batting Avg</span>
					<span class="metric-value">{stats.BA ?? '.000'}</span>
				</div>
				<div class="metric-box">
					<span class="metric-label">OBP</span>
					<span class="metric-value">{stats.OBP ?? '.000'}</span>
				</div>
				<div class="metric-box">
					<span class="metric-label">SLG</span>
					<span class="metric-value">{stats.SLG ?? '.000'}</span>
				</div>
				<div class="metric-box">
					<span class="metric-label">Games Played</span>
					<span class="metric-value">{stats.G ?? 0}</span>
				</div>
			</div>
		</article>
	{/if}
</div>

<style>
	.app-container {
		max-width: 800px;
		margin: 3rem auto;
		padding: 0 1rem;
		font-family: system-ui, sans-serif;
	}
	header {
		margin-bottom: 2rem;
	}
	h1 {
		margin: 0 0 0.5rem 0;
		color: #111;
	}
	header p {
		margin: 0;
		color: #666;
	}

	.search-bar {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	.search-bar input {
		flex: 1;
		padding: 0.75rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 6px;
	}
	.search-bar select {
		padding: 0.75rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: white;
	}
	.search-bar button {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		font-weight: bold;
		color: white;
		background: #0066cc;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	.search-bar button:disabled {
		background: #999;
	}

	.message {
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1.5rem;
		font-weight: 500;
	}
	.error-msg {
		background: #fdf2f2;
		color: #ec5959;
		border: 1px solid #f8baba;
	}

	.player-profile-card {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 2rem;
		background: #ffffff;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
	}
	.profile-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 2px solid #f3f4f6;
		padding-bottom: 1rem;
		margin-bottom: 1.5rem;
	}
	.profile-header h2 {
		margin: 0;
		font-size: 1.75rem;
	}
	.meta-badge {
		background: #eef2f6;
		padding: 0.4rem 0.8rem;
		border-radius: 20px;
		font-size: 0.9rem;
		font-weight: 600;
		color: #475569;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
		gap: 1rem;
	}
	.metric-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
	}
	.metric-box.highlight {
		background: #f0fdf4;
		border-color: #bbf7d0;
	}
	.metric-box.highlight .metric-value {
		color: #16a34a;
	}
	.metric-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		margin-bottom: 0.25rem;
	}
	.metric-value {
		font-size: 1.5rem;
		font-weight: 800;
		color: #1e293b;
	}
</style>
