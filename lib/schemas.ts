import { z } from "zod"
import { MAX_PHOTOS } from "./constants"
import { ROLES } from "./types"

const text = (max: number) => z.string().trim().max(max)
const optionalUrl = z.union([z.literal(""), z.url({ protocol: /^https?$/ })])

export const teamNameSchema = z.string().trim().min(2, "Team name is too short").max(40)

export const submissionDraftSchema = z.object({
  name: text(80).default(""),
  tagline: text(140).default(""),
  description: text(5000).default(""),
  repoUrl: z.string().trim().max(300).default(""),
  demoUrl: z.string().trim().max(300).default(""),
  videoUrl: z.string().trim().max(300).default(""),
  aiTools: z.array(text(40)).max(20).default([]),
  aiToolsOther: text(500).default(""),
  photoKeys: z.array(z.string()).max(MAX_PHOTOS).default([]),
  consentPhotos: z.boolean().default(false),
  consentMit: z.boolean().default(false),
})
export type SubmissionInput = z.infer<typeof submissionDraftSchema>

export const GITHUB_REPO = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/

export const submissionFinalSchema = submissionDraftSchema
  .extend({
    name: text(80).min(1, "Project name is required"),
    tagline: text(140).min(1, "Tagline is required"),
    description: text(5000).min(20, "Description needs at least a couple of sentences"),
    repoUrl: z.string().trim().regex(GITHUB_REPO, "Must be a GitHub repo URL like https://github.com/you/project"),
    demoUrl: optionalUrl,
    videoUrl: optionalUrl,
    consentPhotos: z.literal(true, "You must accept the photo release"),
    consentMit: z.literal(true, "You must accept the MIT license terms"),
  })
  .refine((s) => s.demoUrl || s.videoUrl, { message: "Add a demo link or a video link", path: ["demoUrl"] })

/** Photo keys must live under this team's own prefix. */
export function photoKeysValid(keys: string[], prefix: string) {
  return keys.every((k) => k.startsWith(prefix) && !k.includes(".."))
}

export const eventSettingsSchema = z.object({
  name: text(80).min(1),
  startsAt: z.iso.datetime().nullable(),
  submissionDeadline: z.iso.datetime().nullable(),
  endsAt: z.iso.datetime().nullable(),
  lumaUrl: optionalUrl,
  aiBudgetUsd: z.number().min(0).max(100),
})

export const criteriaSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      name: text(60).min(1),
      description: text(300),
      weight: z.number().positive("Weight must be > 0").max(10),
    })
  )
  .max(10)

export const prizesSchema = z
  .array(z.object({ id: z.string().min(1), name: text(60).min(1), description: text(300) }))
  .max(10)

export const scoreSchema = z.object({
  scores: z.record(z.string(), z.number().int().min(1).max(10)),
  notes: text(2000),
})

export const ticketSchema = z.object({
  topic: text(80).min(1, "What do you need help with?"),
  description: text(1000),
  location: text(60).min(1, "Where are you sitting?"),
})

export const announcementSchema = z.object({ body: text(500).min(1) })

export const scheduleItemSchema = z.object({
  id: z.string().optional(),
  title: text(80).min(1),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime().nullable(),
  location: text(60),
})

export const roleSchema = z.enum(ROLES)

export const resultsSchema = z.object({
  placements: z.array(z.object({ place: z.number().int().min(1).max(10), teamId: z.string().min(1) })).max(10),
  categories: z.array(z.object({ prizeId: z.string().min(1), teamId: z.string().min(1) })).max(10),
})
