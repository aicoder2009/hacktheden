"use client"

import { useRef, useState } from "react"
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

type Photo = { key: string; url: string }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
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
  const fileInput = useRef<HTMLInputElement>(null)
  const submitted = initial?.status === "submitted"

  const set = <K extends keyof SubmissionInput>(k: K, v: SubmissionInput[K]) => setForm((f) => ({ ...f, [k]: v }))
  const payload = () => ({ ...form, photoKeys: photos.map((p) => p.key) })

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
        exec(() => saveSubmission(payload(), true), { success: submitted ? "Submission updated" : "Submitted! 🎉" })
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
            <Field label="Project name">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
            </Field>
            <Field label="Tagline" hint="One line. What is it?">
              <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={140} />
            </Field>
            <Field label="Description" hint="What problem does it solve, how does it work, what are you proud of?">
              <Textarea
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
            <Field label="GitHub repo" hint="Add an MIT LICENSE file to the repo.">
              <Input
                value={form.repoUrl}
                onChange={(e) => set("repoUrl", e.target.value)}
                placeholder="https://github.com/you/project"
                inputMode="url"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Live demo URL">
                <Input value={form.demoUrl} onChange={(e) => set("demoUrl", e.target.value)} placeholder="https://" inputMode="url" />
              </Field>
              <Field label="Video URL" hint="YouTube, Loom, etc.">
                <Input value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://" inputMode="url" />
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
                        className="absolute top-1 right-1 bg-background/90 px-1.5 text-xs opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
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
          <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur">
            {!submitted && (
              <Button
                type="button"
                variant="outline"
                disabled={pending || uploading > 0}
                onClick={() => exec(() => saveSubmission(payload(), false), { success: "Draft saved" })}
              >
                Save draft
              </Button>
            )}
            <Button type="submit" disabled={pending || uploading > 0}>
              {submitted ? "Update submission" : "Submit project"}
            </Button>
          </div>
        )}
      </fieldset>
    </form>
  )
}
