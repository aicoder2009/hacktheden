import fs from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { isDemo } from "@/lib/demo/mode"

// Demo mode stand-in for S3: stores uploaded photos under .demo/uploads.
const ROOT = path.join(process.cwd(), ".demo", "uploads")
const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" }

function fileFor(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? ""
  if (!isDemo() || !key.startsWith("events/") || key.includes("..")) return null
  return path.join(ROOT, key)
}

export async function PUT(req: Request) {
  const file = fileFor(req)
  if (!file) return new NextResponse(null, { status: 404 })
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, Buffer.from(await req.arrayBuffer()))
  return new NextResponse(null, { status: 200 })
}

export async function GET(req: Request) {
  const file = fileFor(req)
  const body = file && (await fs.readFile(file).catch(() => null))
  if (!body) return new NextResponse(null, { status: 404 })
  return new NextResponse(body, { headers: { "Content-Type": TYPES[path.extname(file).slice(1)] ?? "application/octet-stream" } })
}
