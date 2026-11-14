const PHOTO_CDN = 'https://img.mlbstatic.com/mlb-photos/image/upload';

export function getPlayerPictureLarge(id) {
	return `${PHOTO_CDN}/c_fill,g_auto/w_150,d_people:generic:headshot:67:current.png,q_auto:best/v1/people/${id}/headshot/67/current`;
}

// Full-body action portrait used as the cover art for MLB's player Stories /
// Shorts. Same CDN as headshots, deterministic by player id, and 404s when a
// player has no action photo (so callers should fall back to their headshot).
export function getPlayerActionPicture(id, width = 240) {
	return `${PHOTO_CDN}/w_${width},q_auto:good,f_webp/v1/people/${id}/action/vertical/current`;
}

// Transparent cutout of the same portrait via Cloudinary's background
// removal. Useful for compositing a player over card art. Not guaranteed to
// be clean on busy backgrounds, so treat it as a progressive enhancement.
export function getPlayerActionCutout(id, width = 240) {
	return `${PHOTO_CDN}/w_${width},q_auto:good,f_webp,e_background_removal/v1/people/${id}/action/vertical/current`;
}
