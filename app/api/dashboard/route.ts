import { requireRole } from "@/lib/auth"
import { json } from "@/lib/http"
import { buildDashboard } from "@/lib/views"

export const GET = () => json(async () => buildDashboard(await requireRole("participant")))
