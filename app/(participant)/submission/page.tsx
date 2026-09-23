import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"
import { pageUser } from "@/lib/auth"
import { getEvent, getSubmission } from "@/lib/data"
import { fmtDateTime } from "@/lib/format"
import { isLocked } from "@/lib/rules"
import { presignMany } from "@/lib/s3"
import { SubmissionForm } from "./submission-form"

export const metadata: Metadata = { title: "Submission" }

export default async function SubmissionPage() {
  const user = await pageUser("participant")
  if (!user.teamId) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Submission" description="You need a team (even a team of one) to submit." />
        <Link href="/team" className={buttonVariants()}>Create or join a team</Link>
      </div>
    )
  }
  const [event, sub] = await Promise.all([getEvent(), getSubmission(user.teamId)])
  const photoKeys = sub?.photoKeys ?? []
  const urls = await presignMany(photoKeys)
  const locked = isLocked(event, new Date())

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Project submission"
        description={
          locked
            ? "Submissions are closed. This is what the judges see."
            : `Anyone on your team can edit. Due ${fmtDateTime(event.submissionDeadline)}.`
        }
      />
      <SubmissionForm
        initial={sub ?? null}
        photos={photoKeys.map((key, i) => ({ key, url: urls[i] }))}
        locked={locked}
      />
    </div>
  )
}
