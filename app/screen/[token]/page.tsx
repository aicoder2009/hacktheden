import type { Metadata } from "next"
import { safeEqual } from "@/lib/codes"
import { getEvent } from "@/lib/data"
import { buildScreen } from "@/lib/views"
import { Screen } from "./_components/screen"

export const metadata: Metadata = { title: "Big screen" }

export default async function ScreenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const event = await getEvent()
  if (!safeEqual(token, event.screenToken)) {
    return (
      <main className="grid min-h-svh place-items-center p-6 text-center">
        <div>
          <p className="font-heading text-xl font-semibold">Invalid or expired screen link</p>
          <p className="mt-2 text-sm text-muted-foreground">Ask an organizer for the current big-screen link.</p>
        </div>
      </main>
    )
  }
  return <Screen token={token} initial={await buildScreen()} />
}
