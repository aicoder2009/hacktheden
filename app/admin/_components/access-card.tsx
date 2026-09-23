"use client"

import { toast } from "sonner"
import { regenerateRoomCode, rotateScreenToken } from "@/actions/admin"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAction } from "@/components/use-action"
import { useOrigin } from "./client-only"

/** Room code + projector link. `manage` adds regenerate/rotate controls. */
export function AccessCard({ roomCode, screenToken, manage }: { roomCode: string; screenToken: string; manage?: boolean }) {
  const origin = useOrigin()
  const { pending, exec } = useAction()
  const path = `/screen/${screenToken}`
  const url = `${origin}${path}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Screen link copied")
    } catch {
      toast.error("Couldn't copy — select the link and copy it manually.")
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Room access</CardTitle>
        <CardDescription>Participants verify with the room code shown on the big screen.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <div className="text-[11px] tracking-widest text-muted-foreground uppercase">Room code</div>
          <div className="mt-1 font-mono text-4xl font-semibold tracking-[0.2em] text-primary">{roomCode}</div>
          {manage && (
            <Button
              className="mt-2"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Generate a new room code? The old code stops working for anyone who hasn't verified yet.")) return
                void exec(regenerateRoomCode, { success: "New room code generated" })
              }}
            >
              Regenerate code
            </Button>
          )}
        </div>
        <Separator />
        <div className="grid gap-2">
          <div className="text-[11px] tracking-widest text-muted-foreground uppercase">Projector screen</div>
          <code className="block overflow-x-auto bg-muted px-2 py-1.5 font-mono text-[11px] break-all whitespace-normal">
            {origin ? url : path}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={copy} disabled={!origin}>
              Copy link
            </Button>
            <a href={path} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Open screen
            </a>
            {manage && (
              <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() => {
                  if (
                    !window.confirm(
                      "Rotate the screen link? The current link stops working immediately — you'll need to open the new one on the projector."
                    )
                  )
                    return
                  void exec(rotateScreenToken, { success: "Screen link rotated" })
                }}
              >
                Rotate link
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Anyone with this link can see the room code. Rotate it if it leaks.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
