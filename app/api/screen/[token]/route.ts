import { AppError } from "@/lib/auth"
import { safeEqual } from "@/lib/codes"
import { getEvent } from "@/lib/data"
import { json } from "@/lib/http"
import { buildScreen } from "@/lib/views"

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return json(async () => {
    if (!safeEqual(token, (await getEvent()).screenToken)) throw new AppError("Invalid screen link")
    return buildScreen()
  })
}
