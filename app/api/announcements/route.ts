import { requireUser } from "@/lib/auth"
import { json } from "@/lib/http"
import { buildLatestAnnouncement } from "@/lib/views"

/** The newest post, polled by the banner pinned to the top of every page. */
export const GET = () =>
  json(async () => {
    await requireUser()
    return buildLatestAnnouncement()
  })
