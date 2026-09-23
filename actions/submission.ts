"use server"

import { revalidatePath } from "next/cache"
import { parse, run } from "@/lib/action"
import { AppError, requireVerifiedParticipant } from "@/lib/auth"
import { newId } from "@/lib/codes"
import { MAX_PHOTO_BYTES, PHOTO_TYPES } from "@/lib/constants"
import { getEvent, getSubmission, keys } from "@/lib/data"
import { putItem } from "@/lib/db"
import { isLocked } from "@/lib/rules"
import { presignPut, teamPhotoPrefix } from "@/lib/s3"
import { photoKeysValid, submissionDraftSchema, submissionFinalSchema } from "@/lib/schemas"
import type { Submission } from "@/lib/types"

async function requireEditableTeam() {
  const user = await requireVerifiedParticipant()
  if (!user.teamId) throw new AppError("Join or create a team first.")
  if (isLocked(await getEvent(), new Date())) throw new AppError("Submissions are closed.")
  return { user, teamId: user.teamId }
}

export async function presignPhoto(contentType: string, size: number) {
  return run(async () => {
    const { teamId } = await requireEditableTeam()
    const ext = PHOTO_TYPES[contentType as keyof typeof PHOTO_TYPES]
    if (!ext) throw new AppError("Photos must be JPEG, PNG or WebP.")
    if (size > MAX_PHOTO_BYTES) throw new AppError("Photos must be under 8 MB.")
    const key = `${teamPhotoPrefix(teamId)}${newId()}.${ext}`
    return { key, url: await presignPut(key, contentType) }
  })
}

/** `final` validates strictly and marks the project submitted; otherwise saves a draft. */
export async function saveSubmission(input: unknown, final: boolean) {
  return run(async () => {
    const { user, teamId } = await requireEditableTeam()
    const existing = await getSubmission(teamId)
    if (!final && existing?.status === "submitted") {
      throw new AppError("Already submitted — use “Update submission” to save changes.")
    }
    const data = parse(final ? submissionFinalSchema : submissionDraftSchema, input)
    if (!photoKeysValid(data.photoKeys, teamPhotoPrefix(teamId))) throw new AppError("Invalid photo.")

    const now = new Date().toISOString()
    const sub: Submission = {
      ...data,
      teamId,
      status: final ? "submitted" : "draft",
      firstSubmittedAt: existing?.firstSubmittedAt ?? (final ? now : undefined),
      updatedAt: now,
      updatedBy: user.name,
    }
    await putItem(keys.sub(teamId), sub)
    revalidatePath("/", "layout")
    return { status: sub.status }
  })
}
