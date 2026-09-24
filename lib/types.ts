export const ROLES = ["participant", "mentor", "judge", "officer"] as const
export type Role = (typeof ROLES)[number]

export type Criterion = { id: string; name: string; description: string; weight: number }
export type Prize = { id: string; name: string; description: string }

export type Results = {
  placements: { place: number; teamId: string }[]
  categories: { prizeId: string; teamId: string }[]
}

export type EventMeta = {
  name: string
  startsAt: string | null
  submissionDeadline: string | null
  endsAt: string | null
  lumaUrl: string
  roomCode: string
  screenToken: string
  aiBudgetUsd: number
  criteria: Criterion[]
  prizes: Prize[]
  results: Results | null
  revealStage: number | null
  resultsReleased: boolean
}

export type User = {
  id: string
  name: string
  email: string
  role: Role
  verifiedAt?: string
  verifyFails: number
  teamId?: string
  /** Account-less participants: personal code to get back in on another device. */
  rejoinCode?: string
  createdAt: string
}

export type TeamMember = { name: string; joinedAt: string }

export type TeamAI =
  | { status: "pending"; at: string }
  | {
      status: "active"
      hash: string
      key: string
      limitUsd: number
      disabled: boolean
      usageUsd: number
      usageAt: string
    }

export type Team = {
  id: string
  name: string
  joinCode: string
  captainId: string
  members: Record<string, TeamMember>
  memberCount: number
  version: number
  ai?: TeamAI
  createdAt: string
}

export type Submission = {
  teamId: string
  status: "draft" | "submitted"
  name: string
  tagline: string
  description: string
  repoUrl: string
  demoUrl: string
  videoUrl: string
  photoKeys: string[]
  consentPhotos: boolean
  consentMit: boolean
  firstSubmittedAt?: string
  updatedAt: string
  updatedBy: string
}

export type Score = {
  teamId: string
  judgeId: string
  judgeName: string
  scores: Record<string, number>
  notes: string
  updatedAt: string
}

export type Announcement = { id: string; body: string; authorName: string; createdAt: string }

export type ScheduleItem = {
  id: string
  title: string
  startsAt: string
  endsAt: string | null
  location: string
}

export type TicketStatus = "open" | "claimed" | "resolved" | "cancelled"
export type Ticket = {
  id: string
  teamId: string
  teamName: string
  topic: string
  description: string
  location: string
  status: TicketStatus
  mentorId?: string
  mentorName?: string
  createdAt: string
  updatedAt: string
}
