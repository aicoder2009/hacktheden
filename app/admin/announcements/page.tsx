import { deleteAnnouncement } from "@/actions/admin"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ANNOUNCEMENT_FRESH_MS, ANNOUNCEMENT_TAKEOVER_MS } from "@/lib/announcements"
import { listAnnouncements } from "@/lib/data"
import { ActionButton } from "../_components/action-button"
import { AnnouncementForm } from "../_components/announcement-form"
import { LocalTime } from "../_components/local-time"

export const metadata = { title: "Announcements" }

const TAKEOVER_MIN = ANNOUNCEMENT_TAKEOVER_MS / 60_000
const FRESH_MIN = ANNOUNCEMENT_FRESH_MS / 60_000

export default async function AnnouncementsPage() {
  const announcements = await listAnnouncements()
  return (
    <>
      <PageHeader
        title="Announcements"
        description={`A new post takes over the big screen for ${TAKEOVER_MIN} minutes and pins to the top of every page in the app for ${FRESH_MIN} minutes. After that it stays in the screen's announcement panel and on participant dashboards.`}
      />
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New announcement</CardTitle>
            <CardDescription>Keep it short — it has to read well on a projector.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnnouncementForm />
          </CardContent>
        </Card>
        <div className="grid h-fit gap-3">
          {announcements.length === 0 && <p className="text-sm text-muted-foreground">Nothing posted yet.</p>}
          {announcements.map((a, i) => (
            <Card key={a.id} size="sm">
              <CardContent className="grid gap-2">
                <p className="text-sm whitespace-pre-wrap">{a.body}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  {i === 0 && <span className="font-semibold text-primary uppercase">On screen</span>}
                  <span>{a.authorName}</span>
                  <LocalTime iso={a.createdAt} />
                  <span className="ml-auto">
                    <ActionButton
                      size="xs"
                      variant="ghost"
                      action={deleteAnnouncement.bind(null, a.id)}
                      confirm="Delete this announcement? It disappears from dashboards and the big screen."
                      success="Announcement deleted"
                    >
                      Delete
                    </ActionButton>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
