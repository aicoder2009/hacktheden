"use server"

import { revalidatePath } from "next/cache"
import { parse, run } from "@/lib/action"
import { AppError, requireRole, requireVerifiedParticipant } from "@/lib/auth"
import { newId } from "@/lib/codes"
import { getTeam, keys, listTickets } from "@/lib/data"
import { getItem, putItem, updateItem } from "@/lib/db"
import { canTransitionTicket, isActiveTicket } from "@/lib/rules"
import { ticketSchema } from "@/lib/schemas"
import type { Ticket, TicketStatus } from "@/lib/types"

export async function openTicket(input: unknown) {
  return run(async () => {
    const user = await requireVerifiedParticipant()
    const team = user.teamId && (await getTeam(user.teamId))
    if (!team) throw new AppError("Join or create a team first.")
    const data = parse(ticketSchema, input)
    if ((await listTickets()).some((t) => t.teamId === team.id && isActiveTicket(t))) {
      throw new AppError("Your team already has an open request.")
    }
    const now = new Date().toISOString()
    const ticket: Ticket = {
      ...data,
      id: `${now}#${newId()}`,
      teamId: team.id,
      teamName: team.name,
      status: "open",
      createdAt: now,
      updatedAt: now,
    }
    await putItem(keys.ticket(ticket.id), ticket)
    revalidatePath("/", "layout")
    return null
  })
}

async function move(id: string, to: TicketStatus, extra: Partial<Ticket> = {}, remove: string[] = []) {
  const ticket = await getItem<Ticket>(keys.ticket(id))
  if (!ticket) throw new AppError("Request not found.")
  if (!canTransitionTicket(ticket.status, to)) throw new AppError("That request has already moved on.")
  await updateItem(keys.ticket(id), { ...extra, status: to, updatedAt: new Date().toISOString() }, {
    condition: "#s = :from",
    names: { "#s": "status" },
    values: { ":from": ticket.status },
    remove,
  })
  return ticket
}

export async function cancelTicket(id: string) {
  return run(async () => {
    const user = await requireVerifiedParticipant()
    const ticket = await getItem<Ticket>(keys.ticket(id))
    if (!ticket || ticket.teamId !== user.teamId) throw new AppError("Request not found.")
    await move(id, "cancelled")
    revalidatePath("/", "layout")
    return null
  })
}

export async function claimTicket(id: string) {
  return run(async () => {
    const user = await requireRole("mentor", "officer")
    await move(id, "claimed", { mentorId: user.id, mentorName: user.name })
    return null
  })
}

export async function unclaimTicket(id: string) {
  return run(async () => {
    await requireRole("mentor", "officer")
    await move(id, "open", {}, ["mentorId", "mentorName"])
    return null
  })
}

export async function resolveTicket(id: string) {
  return run(async () => {
    await requireRole("mentor", "officer")
    await move(id, "resolved")
    return null
  })
}
