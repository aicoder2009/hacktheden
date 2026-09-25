"use client"

import { useEffect, useEffectEvent, useRef, useState } from "react"
import { toast } from "sonner"
import { presignPhoto, saveSubmission } from "@/actions/submission"
import { useAction } from "@/components/use-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CONSENT_MIT, CONSENT_PHOTOS, MAX_PHOTOS, MAX_PHOTO_BYTES, PHOTO_TYPES } from "@/lib/constants"
import { fmtDateTime } from "@/lib/format"
import type { SubmissionInput } from "@/lib/schemas"
import type { Submission } from "@/lib/types"
import { cn } from "@/lib/utils"
import { missingRequirements } from "./readiness"

type Photo = { key: string; url: string }
type SaveState = { kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string }

const AUTOSAVE_MS = 1500

/** `id` links the label to its control so tapping the label focuses the field (matters on phones). */
function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function SubmissionForm({
  initial,
  photos: initialPhotos,
  locked,
}: {
  initial: Submission | null
  photos: Photo[]
  locked: boolean
}) {
  const { pending, exec } = useAction()
  const [form, setForm] = useState<SubmissionInput>({
    name: initial?.name ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    repoUrl: initial?.repoUrl ?? "",
    demoUrl: initial?.demoUrl ?? "",
    videoUrl: initial?.videoUrl ?? "",
    photoKeys: initial?.photoKeys ?? [],
    consentPhotos: initial?.consentPhotos ?? false,
    consentMit: initial?.consentMit ?? false,
  })
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(0)
  const [submittedHere, setSubmittedHere] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" })
  const [serverError, setServerError] = useState<{ message: string; snapshot: string } | null>(null)
  const [showAll, setShowAll] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const submitted = submittedHere || initial?.status === "submitted"

  const payload: SubmissionInput = { ...form, photoKeys: photos.map((p) => p.key) }
  const snapshot = JSON.stringify(payload)
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot)
  const dirty = snapshot !== savedSnapshot
  const missing = missingRequirements(payload)
  const error = serverError?.snapshot === snapshot ? serverError.message : null
  const canAutosave = !locked && !submitted && uploading === 0 && !pending

  const set = <K extends keyof SubmissionInput>(k: K, v: SubmissionInput[K]) => setForm((f) => ({ ...f, [k]: v }))

  /** Saves run one at a time, so a slow autosave can never land after (and undo) a submit. */
  function enqueue<T>(fn: () => Promise<T>) {
    const p = queue.current.then(fn)
    queue.current = p.catch(() => {})
    return p
  }

  const autosave = useEffectEvent((snap: string) => {
    setSaveState({ kind: "saving" })
    enqueue(() => saveSubmission(JSON.parse(snap), false)).then(
      (res) => {
        if (res.ok) {
          setSavedSnapshot(snap)
          setSaveState({ kind: "saved" })
        } else setSaveState({ kind: "error", message: res.error })
      },
      () => setSaveState({ kind: "error", message: "Network error" })
    )
  })

  // Debounced draft autosave. Never once submitted — edits there need an explicit "Update submission".
  useEffect(() => {
    if (!canAutosave || snapshot === savedSnapshot) return
    const t = setTimeout(() => autosave(snapshot), AUTOSAVE_MS)
    timer.current = t
    return () => clearTimeout(t)
  }, [canAutosave, snapshot, savedSnapshot])

  // Flush a pending draft change when leaving the page mid-debounce.
  const latest = useRef({ canAutosave, snapshot, savedSnapshot })
  useEffect(() => {
    latest.current = { canAutosave, snapshot, savedSnapshot }
  })
  useEffect(() => {
    const last = latest
    const q = queue
    return () => {
      const l = last.current
      if (l.canAutosave && l.snapshot !== l.savedSnapshot) {
        q.current = q.current.then(() => saveSubmission(JSON.parse(l.snapshot), false))
      }
    }
  }, [])

  function save(final: boolean) {
    clearTimeout(timer.current)
    const snap = snapshot
    void exec(
      () =>
        enqueue(async () => {
          const res = await saveSubmission(JSON.parse(snap), final)
          if (res.ok) {
            setSavedSnapshot(snap)
            setServerError(null)
            setSaveState({ kind: "saved" })
            if (res.data.status === "submitted") setSubmittedHere(true)
          } else {
            setServerError({ message: res.error, snapshot: snap })
            if (final) setShowAll(true)
          }
          return res
        }),
      { success: final ? (submitted ? "Submission updated" : "Submitted! 🎉") : "Draft saved" }
    )
  }

  async function upload(files: FileList | null) {
    if (!files) return
    const list = [...files].slice(0, MAX_PHOTOS - photos.length)
    for (const file of list) {
      if (!(file.type in PHOTO_TYPES)) {
        toast.error(`${file.name}: use JPEG, PNG or WebP`)
        continue
      }
      if (file.size > MAX_PHOTO_BYTES) {
        toast.error(`${file.name} is over 8 MB`)
        continue
      }
      setUploading((n) => n + 1)
      try {
        const res = await presignPhoto(file.type, file.size)
        if (!res.ok) throw new Error(res.error)
        const put = await fetch(res.data.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
        if (!put.ok) throw new Error("Upload failed")
        setPhotos((p) => [...p, { key: res.data.key, url: URL.createObjectURL(file) }])
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed")
      } finally {
        setUploading((n) => n - 1)
      }
    }
    if (fileInput.current) fileInput.current.value = ""
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save(true)
      }}
    >
      <fieldset disabled={locked} className="space-y-4">
        {initial && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {submitted ? <Badge>Submitted</Badge> : <Badge variant="outline">Draft</Badge>}
            Last saved {fmtDateTime(initial.updatedAt)} by {initial.updatedBy}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>The project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field id="name" label="Project name">
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
            </Field>
            <Field id="tagline" label="Tagline" hint="One line. What is it?">
              <Input id="tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={140} />
            </Field>
            <Field id="description" label="Description" hint="What problem does it solve, how does it work, what are you proud of?">
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={7}
                maxLength={5000}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
            <CardDescription>A public GitHub repo, plus a live demo and/or a short video.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field id="repoUrl" label="GitHub repo" hint="Add an MIT LICENSE file to the repo.">
              <Input
                id="repoUrl"
                value={form.repoUrl}
                onChange={(e) => set("repoUrl", e.target.value)}
                placeholder="https://github.com/you/project"
                inputMode="url"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="demoUrl" label="Live demo URL">
                <Input id="demoUrl" value={form.demoUrl} onChange={(e) => set("demoUrl", e.target.value)} placeholder="https://" inputMode="url" />
              </Field>
              <Field id="videoUrl" label="Video URL" hint="YouTube, Loom, etc.">
                <Input id="videoUrl" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://" inputMode="url" />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              Screenshots of the product and/or your team. Up to {MAX_PHOTOS}. The first one is shown on the big screen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {photos.map((p, i) => (
                  <div key={p.key} className="group relative aspect-video overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- presigned S3 URLs */}
                    <img src={p.url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                    {!locked && (
                      <button
                        type="button"
                        onClick={() => setPhotos((ps) => ps.filter((x) => x.key !== p.key))}
                        className="absolute top-1 right-1 bg-background/90 px-2 py-1 text-xs transition-opacity focus:opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    )}
                    {i === 0 && <Badge className="absolute bottom-1 left-1">Cover</Badge>}
                  </div>
                ))}
              </div>
            )}
            {!locked && photos.length < MAX_PHOTOS && (
              <div>
                <input
                  ref={fileInput}
                  type="file"
                  accept={Object.keys(PHOTO_TYPES).join(",")}
                  multiple
                  hidden
                  onChange={(e) => upload(e.target.files)}
                />
                <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading > 0}>
                  {uploading > 0 ? `Uploading ${uploading}…` : "Add photos"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>The fine print</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex gap-3 text-xs leading-relaxed">
              <Checkbox className="mt-0.5" checked={form.consentPhotos} onCheckedChange={(c) => set("consentPhotos", !!c)} />
              <span>{CONSENT_PHOTOS}</span>
            </label>
            <label className="flex gap-3 text-xs leading-relaxed">
              <Checkbox className="mt-0.5" checked={form.consentMit} onCheckedChange={(c) => set("consentMit", !!c)} />
              <span>{CONSENT_MIT}</span>
            </label>
          </CardContent>
        </Card>

        {!locked && (
          // On phones, sit on top of the participant tab bar (h-14 + safe area, see components/mobile-nav.tsx).
          <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 -mx-4 space-y-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:bottom-0 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <Readiness
              missing={missing}
              error={error}
              submitted={submitted}
              open={showAll}
              onToggle={() => setShowAll((o) => !o)}
            />
            <div className="flex items-center justify-between gap-2">
              <SaveStatus state={saveState} submitted={submitted} dirty={dirty} />
              <div className="flex shrink-0 gap-2">
                {!submitted && (
                  <Button type="button" variant="outline" disabled={pending || uploading > 0} onClick={() => save(false)}>
                    Save draft
                  </Button>
                )}
                <Button type="submit" disabled={pending || uploading > 0}>
                  {submitted ? "Update submission" : "Submit project"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </fieldset>
    </form>
  )
}

function Readiness({
  missing,
  error,
  submitted,
  open,
  onToggle,
}: {
  missing: string[]
  error: string | null
  submitted: boolean
  open: boolean
  onToggle: () => void
}) {
  const n = missing.length
  return (
    <div className="space-y-2 text-xs">
      {error && (
        <p role="alert" className="border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-destructive">
          {error}
        </p>
      )}
      {n === 0 ? (
        <p aria-live="polite" className="font-medium text-primary">
          ✓ All set — you can {submitted ? "update your submission" : "submit"}
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="flex w-full min-w-0 items-baseline gap-2 py-0.5 text-left"
          >
            <span className="shrink-0 font-heading font-semibold">Ready to {submitted ? "update" : "submit"}?</span>
            <span aria-live="polite" className="min-w-0 truncate text-muted-foreground">
              {n} {n === 1 ? "thing" : "things"} left{!open && ` · ${missing[0]}`}
            </span>
            <span className="ml-auto shrink-0 text-primary underline-offset-4 hover:underline">
              {open ? "Hide" : "Show all"}
            </span>
          </button>
          {open && (
            <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
              {missing.map((m) => (
                <li key={m} className="flex gap-2">
                  <span aria-hidden className="text-muted-foreground">
                    ○
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function SaveStatus({ state, submitted, dirty }: { state: SaveState; submitted: boolean; dirty: boolean }) {
  let text = submitted ? "" : "Drafts save automatically"
  if (submitted && dirty) text = "Unsaved changes"
  else if (state.kind === "saving") text = "Saving…"
  else if (state.kind === "error") text = `Autosave failed: ${state.message}`
  else if (state.kind === "saved") text = "Saved ✓"
  return (
    <span
      aria-live="polite"
      className={cn(
        "min-w-0 truncate text-xs text-muted-foreground",
        state.kind === "error" && "text-destructive",
        submitted && dirty && "font-medium text-foreground"
      )}
    >
      {text}
    </span>
  )
}
