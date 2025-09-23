export default function normalizeAssetPath(p) {
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  if (p.startsWith("/assets/")) return p;
  const stripped = p.replace(/^\.{0,2}\//, "");
  return "/" + stripped;
}
