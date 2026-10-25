// Player highlight videos from MLB Film Room's public GraphQL gateway.
//
// The MLB video search page (mlb.com/<club>/video/?q=PlayerId == [<id>] Order By
// Timestamp) resolves its results through fastball-gateway.mlb.com. That
// endpoint is CORS-enabled and returns each video's direct MP4/HLS playbacks, so
// these highlights can be played natively on our pages instead of linking out.
const GATEWAY_URL = "https://fastball-gateway.mlb.com/graphql";

const SEARCH_QUERY = `
query Search($query: String!, $page: Int, $limit: Int, $languagePreference: LanguagePreference, $contentPreference: ContentPreference) {
	search(query: $query, limit: $limit, page: $page, languagePreference: $languagePreference, contentPreference: $contentPreference) {
		plays {
			mediaPlayback {
				id
				slug
				title
				blurb
				date
				feeds {
					type
					duration
					image {
						cuts {
							width
							height
							src
						}
					}
					playbacks {
						name
						url
						mimetype
					}
				}
				playInfo {
					gamePk
				}
			}
		}
		total
	}
}
`;

const cache = new Map();

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
});

/** Pick the best thumbnail from a feed's image cuts (closest to 640px wide). */
function pickThumbnail(feed) {
	const cuts = (feed?.image?.cuts || []).filter((cut) => cut?.src);
	if (cuts.length === 0) return "";
	return (
		cuts.find((cut) => cut.width === 640) ??
		cuts.find((cut) => cut.width === 1024) ??
		cuts.reduce((best, cut) => (cut.width > best.width ? cut : best), cuts[0])
	).src;
}

/** Find the most compatible progressive MP4 playback (HLS-only clips are skipped). */
function pickPlayback(feed) {
	const playbacks = feed?.playbacks || [];
	return (
		playbacks.find((playback) => playback.name === "mp4Avc") ??
		playbacks.find((playback) => playback.mimetype === "video/mp4") ??
		playbacks.find((playback) => playback.name === "highBit") ??
		null
	);
}

/** "00:01:26" -> "1:26", "00:34:18" -> "34:18". */
function formatDuration(duration) {
	if (!duration) return "";
	const [hours, minutes, seconds] = duration.split(":").map(Number);
	if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return duration;
	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	}
	return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(date) {
	if (!date) return "";
	// Parse at midday so the displayed calendar date never shifts by timezone.
	const parsed = new Date(`${date}T12:00:00`);
	return Number.isNaN(parsed.getTime()) ? date : DATE_FORMATTER.format(parsed);
}

function normalizeVideo(media, feed) {
	if (!media?.id || !media?.slug) return null;

	const playback = pickPlayback(feed);
	if (!playback?.url) return null;

	return {
		id: media.id,
		slug: media.slug,
		title: media.title || media.blurb || "MLB highlight",
		date: media.date || "",
		dateLabel: formatDate(media.date),
		duration: feed?.duration || "",
		durationLabel: formatDuration(feed?.duration),
		thumbnail: pickThumbnail(feed),
		mp4Url: playback.url,
		hlsUrl:
			feed?.playbacks?.find((item) => item.name === "hlsCloud")?.url || "",
		gamePk: media.playInfo?.gamePk || null,
		pageUrl: `https://www.mlb.com/video/${media.slug}`,
	};
}

/**
 * Fetches a page of a player's latest MLB highlight videos.
 *
 * @param {string|number} id - MLB player id.
 * @param {object} [options]
 * @param {number|string|null} [options.season] - Season year to scope to. Omit for all-time latest.
 * @param {number} [options.limit=12] - Videos per page.
 * @param {number} [options.page=0] - Zero-based page index.
 * @returns {Promise<{ videos: Array<object>, total: number, hasMore: boolean }>}
 */
export async function getPlayerVideos(
	id,
	{ season = null, limit = 12, page = 0 } = {},
) {
	const cacheKey = `${id}-${season || "all"}-${page}-${limit}`;
	const cached = cache.get(cacheKey);
	if (cached) return cached;

	const playerFilter = `PlayerId == [${id}]`;
	const query = season
		? `${playerFilter} AND Season == ${season} Order By Timestamp`
		: `${playerFilter} Order By Timestamp`;

	const params = new URLSearchParams({
		query: SEARCH_QUERY,
		operationName: "Search",
		variables: JSON.stringify({
			query,
			limit,
			page,
			languagePreference: "EN",
			contentPreference: "CMS_FIRST",
		}),
	});

	const response = await fetch(`${GATEWAY_URL}?${params}`);
	if (!response.ok) {
		throw new Error(`MLB video search failed with status: ${response.status}`);
	}

	const data = await response.json();
	if (data.errors?.length) {
		throw new Error(data.errors[0]?.message || "MLB video search failed");
	}

	const result = data.data?.search || {};
	const videos = [];
	const seen = new Set();

	for (const play of result.plays || []) {
		for (const media of play?.mediaPlayback || []) {
			if (!media || seen.has(media.id)) continue;
			// Use the first feed that can actually be played natively.
			const feed = (media.feeds || []).find((item) => pickPlayback(item));
			const video = normalizeVideo(media, feed);
			if (!video?.mp4Url) continue;
			seen.add(media.id);
			videos.push(video);
		}
	}

	const total = result.total || 0;
	const pageResult = {
		videos,
		total,
		hasMore: videos.length > 0 && page * limit + limit < total,
	};
	cache.set(cacheKey, pageResult);
	return pageResult;
}
