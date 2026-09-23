import { requireRole } from "@/lib/auth"
import { listTickets } from "@/lib/data"
import { json } from "@/lib/http"

export const GET = () =>
  json(async () => {
    await requireRole("mentor", "officer")
    return listTickets()
  })
