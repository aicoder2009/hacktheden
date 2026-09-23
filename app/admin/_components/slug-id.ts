/** Stable-ish id for new rubric criteria / prizes: "use-of-ai-x7k2". Call from event handlers only. */
export function slugId(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
  return `${slug || "item"}-${Math.random().toString(36).slice(2, 6)}`
}
