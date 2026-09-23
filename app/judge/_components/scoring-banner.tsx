import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LocalTime } from "./local-time"
import type { scoringClosedReason } from "./queue"

export function ScoringBanner({ reason }: { reason: ReturnType<typeof scoringClosedReason> }) {
  if (!reason) return null
  return (
    <Alert className="mb-6 border-primary/40 bg-primary/5">
      <AlertTitle className="font-heading">
        {reason.kind === "locked" ? "Results are locked" : "Scoring isn't open yet"}
      </AlertTitle>
      <AlertDescription>
        {reason.kind === "locked" ? (
          "Winners have been decided, so scores can no longer be changed."
        ) : reason.deadline ? (
          <>
            Scoring opens when hacking ends at <LocalTime iso={reason.deadline} />. You can read submissions in the
            meantime.
          </>
        ) : (
          "Scoring opens when hacking ends — the submission deadline hasn't been set yet. You can read submissions in the meantime."
        )}
      </AlertDescription>
    </Alert>
  )
}
