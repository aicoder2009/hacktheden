"use client"

import { useFormStatus } from "react-dom"
import { leaveSession } from "@/actions/join"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function LeaveSubmit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Leaving…" : "Leave"}
    </Button>
  )
}

/** Account-less participants can't get back in without their rejoin code, so confirm before signing out. */
export function LeaveDialog({ rejoinCode }: { rejoinCode?: string }) {
  return (
    <Dialog>
      <DialogTrigger className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
        Leave
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave this device?</DialogTitle>
          <DialogDescription>
            {rejoinCode
              ? "You'll be signed out here. To get back in — on this or any other device — you'll need your rejoin code:"
              : "You'll be signed out here, and you'll need an officer's help to get back in."}
          </DialogDescription>
        </DialogHeader>
        {rejoinCode && (
          <div className="bg-muted px-3 py-2.5 text-center">
            <div className="font-mono text-2xl font-semibold tracking-[0.2em]">{rejoinCode}</div>
            <p className="mt-1 text-muted-foreground">Write it down or take a screenshot first.</p>
          </div>
        )}
        <form action={leaveSession}>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <LeaveSubmit />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
