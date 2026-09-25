import type { z } from "zod"
import { submissionDraftSchema, submissionFinalSchema, type SubmissionInput } from "@/lib/schemas"

const NEED_LINK = "Add a demo or video link"
const FIELD_ORDER: string[] = Object.keys(submissionDraftSchema.shape)

function friendly(issue: z.core.$ZodIssue, s: SubmissionInput): string {
  const field = String(issue.path[0] ?? "")
  const invalid = issue.code === "invalid_format"
  switch (field) {
    case "name":
      if (issue.code === "too_small") return "Give your project a name"
      break
    case "tagline":
      if (issue.code === "too_small") return "Add a one-line tagline"
      break
    case "description":
      if (issue.code === "too_small")
        return s.description.trim() ? "Description needs a couple of sentences" : "Add a short description"
      break
    case "repoUrl":
      return s.repoUrl.trim() ? "GitHub link should look like https://github.com/you/project" : "Add a GitHub repo link"
    case "demoUrl":
      if (issue.code === "custom") return NEED_LINK
      if (invalid) return "Live demo link should start with https://"
      break
    case "videoUrl":
      if (invalid) return "Video link should start with https://"
      break
    case "consentPhotos":
      return "Accept the photo release"
    case "consentMit":
      return "Accept the MIT license terms"
  }
  return issue.message
}

/** What still blocks a final submission, in form order and plain words. Empty when ready. */
export function missingRequirements(s: SubmissionInput): string[] {
  const res = submissionFinalSchema.safeParse(s)
  const items = (res.success ? [] : res.error.issues).map((i) => ({ field: String(i.path[0] ?? ""), text: friendly(i, s) }))
  // The schema's demo-or-video refine only runs once every field passes, so check it up front.
  if (!s.demoUrl.trim() && !s.videoUrl.trim()) items.push({ field: "demoUrl", text: NEED_LINK })
  items.sort((a, b) => FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field))
  return [...new Set(items.map((i) => i.text))]
}
