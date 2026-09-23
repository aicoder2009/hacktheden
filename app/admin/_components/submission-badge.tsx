import { Badge } from "@/components/ui/badge"

export function SubmissionBadge({ status }: { status: "draft" | "submitted" | null }) {
  if (status === "submitted") return <Badge>Submitted</Badge>
  if (status === "draft") return <Badge variant="secondary">Draft</Badge>
  return <span className="text-muted-foreground">None</span>
}
