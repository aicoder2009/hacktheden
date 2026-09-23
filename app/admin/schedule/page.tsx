import { PageHeader } from "@/components/page-header"
import { listSchedule } from "@/lib/data"
import { ScheduleEditor } from "../_components/schedule-editor"

export const metadata = { title: "Schedule" }

export default async function SchedulePage() {
  const items = await listSchedule()
  return (
    <>
      <PageHeader title="Schedule" description="The agenda shown on dashboards and the big screen (now / next)." />
      <ScheduleEditor items={items} />
    </>
  )
}
