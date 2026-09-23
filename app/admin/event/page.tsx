import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEvent } from "@/lib/data"
import { EventForm } from "../_components/event-form"
import { AccessCard } from "../_components/access-card"

export const metadata = { title: "Event settings" }

export default async function EventPage() {
  const event = await getEvent()
  return (
    <>
      <PageHeader title="Event settings" description="Name, key times, links and the AI budget per team." />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Times are shown and entered in your browser&apos;s local timezone.</CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm
              initial={{
                name: event.name,
                startsAt: event.startsAt,
                submissionDeadline: event.submissionDeadline,
                endsAt: event.endsAt,
                lumaUrl: event.lumaUrl,
                aiBudgetUsd: event.aiBudgetUsd,
              }}
            />
          </CardContent>
        </Card>
        <AccessCard roomCode={event.roomCode} screenToken={event.screenToken} manage />
      </div>
    </>
  )
}
