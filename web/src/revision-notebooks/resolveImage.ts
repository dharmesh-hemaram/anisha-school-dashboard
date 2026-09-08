// Notebook images are either a full external URL (Wikimedia landmark
// photos) or a path relative to the app's public/ dir (leader portraits) --
// only the latter needs the deployed base path prefixed.
export function resolveImage(src: string): string {
  return /^https?:\/\//.test(src) ? src : `${import.meta.env.BASE_URL}${src}`;
}
