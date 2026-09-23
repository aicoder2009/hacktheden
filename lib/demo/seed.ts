/** Sample data for demo mode: a hackathon in full swing, ~1h in with 2h of hacking left. */
import type { Announcement, EventMeta, ScheduleItem, Score, Submission, Team, Ticket, User } from "../types"
import { memGet, memPut } from "./memory-db"

export const DEMO_SCREEN_TOKEN = "demo-screen"

export function seedDemo(pk: string) {
  if (memGet(pk, "META")) return
  const now = Date.now()
  const at = (mins: number) => new Date(now + mins * 60_000).toISOString()
  const put = (sk: string, data: object) => memPut({ PK: pk, SK: sk, ...data })

  const event: EventMeta = {
    name: "Basha DevOps AI Hackathon",
    startsAt: at(-60),
    submissionDeadline: at(120),
    endsAt: at(210),
    lumaUrl: "https://lu.ma/",
    roomCode: "HACK26",
    screenToken: DEMO_SCREEN_TOKEN,
    aiBudgetUsd: 5,
    criteria: [
      { id: "innovation", name: "Innovation", description: "How original is the idea?", weight: 1 },
      { id: "technical", name: "Technical execution", description: "Does it work? How hard was it?", weight: 1.5 },
      { id: "ai", name: "Use of AI", description: "How effectively did the team build with AI?", weight: 1 },
      { id: "design", name: "Design & UX", description: "Is it pleasant and easy to use?", weight: 1 },
      { id: "presentation", name: "Presentation", description: "How well did they demo and explain it?", weight: 0.5 },
    ],
    prizes: [
      { id: "best-ai", name: "Best Use of AI", description: "The most creative use of AI in the product itself" },
      { id: "rookie", name: "Best First Hack", description: "Everyone on the team is at their first hackathon" },
    ],
    results: null,
    revealStage: null,
    resultsReleased: false,
  }
  put("META", event)

  const user = (id: string, name: string, role: User["role"], extra: Partial<User> = {}): User => ({
    id,
    name,
    email: `${name.split(" ")[0].toLowerCase()}@example.com`,
    role,
    verifyFails: 0,
    createdAt: at(-120),
    ...extra,
  })
  const users: User[] = [
    user("demo-officer", "Karthick Arun", "officer", { email: "karthickarun2009@gmail.com" }),
    user("demo-judge-1", "Ms. Rivera", "judge"),
    user("demo-judge-2", "Mr. Okafor", "judge"),
    user("demo-mentor", "Priya Shah", "mentor"),
    user("demo-new", "Jordan Lee", "participant"),
    user("demo-solo", "Riley Park", "participant", { verifiedAt: at(-40) }),
  ]

  const teams: { team: Omit<Team, "members" | "memberCount" | "captainId">; people: [string, string][]; sub?: Partial<Submission> }[] = [
    {
      team: { id: "t-null", name: "Null Pointers", joinCode: "NULL42", version: 3, createdAt: at(-50) },
      people: [["demo-aarav", "Aarav Patel"], ["demo-maya", "Maya Chen"], ["demo-diego", "Diego Ramos"]],
      sub: {
        status: "submitted",
        name: "StudyBuddy",
        tagline: "An AI tutor that quizzes you on your own class notes",
        description:
          "Upload a PDF or paste your notes and StudyBuddy turns them into adaptive quizzes. It tracks what you miss and re-asks it later using spaced repetition. Built with Next.js and DeepSeek V4.1 Flash.",
        repoUrl: "https://github.com/null-pointers/studybuddy",
        demoUrl: "https://studybuddy.vercel.app",
        aiTools: ["Claude Code", "opencode", "v0"],
        aiToolsOther: "DeepSeek V4.1 Flash via opencode for the backend; v0 for the quiz UI.",
      },
    },
    {
      team: { id: "t-friday", name: "Deploy on Friday", joinCode: "FRI7AY", version: 2, createdAt: at(-48) },
      people: [["demo-sofia", "Sofia Nguyen"], ["demo-liam", "Liam Brooks"]],
      sub: {
        status: "submitted",
        name: "ShipIt",
        tagline: "One-click preview deployments for student projects",
        description: "Connect a GitHub repo and every pull request gets a live preview URL and a QR code, so teachers can grade from their phone.",
        repoUrl: "https://github.com/deploy-on-friday/shipit",
        videoUrl: "https://youtu.be/dQw4w9WgXcQ",
        aiTools: ["Cursor", "GitHub Copilot"],
        aiToolsOther: "Qwen3 Coder Next in Cursor.",
      },
    },
    {
      team: { id: "t-solo", name: "Solo Sam", joinCode: "SAM333", version: 1, createdAt: at(-45) },
      people: [["demo-sam", "Sam Ortiz"]],
      sub: { status: "draft", name: "LunchLine", tagline: "Predicts the cafeteria line so you never wait" },
    },
    {
      team: { id: "t-prompt", name: "Prompt Engineers", joinCode: "PR3MPT", version: 4, createdAt: at(-44) },
      people: [["demo-emma", "Emma Wilson"], ["demo-noah", "Noah Kim"], ["demo-ava", "Ava Singh"], ["demo-ethan", "Ethan Lee"]],
      sub: {
        status: "submitted",
        name: "CarbonCoach",
        tagline: "Tracks your carbon footprint from receipts you snap",
        description: "Snap a receipt, and a vision model itemizes it and estimates the carbon cost of each purchase, with weekly nudges toward greener swaps.",
        repoUrl: "https://github.com/prompt-engineers/carboncoach",
        demoUrl: "https://carboncoach.vercel.app",
        videoUrl: "https://youtu.be/dQw4w9WgXcQ",
        aiTools: ["Claude Code", "Gemini", "Lovable / Bolt"],
        aiToolsOther: "GLM-5.3 Flash for receipt parsing.",
      },
    },
  ]

  for (const { team, people, sub } of teams) {
    const members = Object.fromEntries(people.map(([id, name], i) => [id, { name, joinedAt: at(-50 + i) }]))
    const t: Team = {
      ...team,
      members,
      memberCount: people.length,
      captainId: people[0][0],
      ai:
        team.id === "t-solo"
          ? undefined
          : { status: "active", hash: `demo-${now - 40 * 60_000}-${team.id}`, key: `sk-or-v1-demo-${team.id}-7f3a9c2e1b4d`, limitUsd: 5, disabled: false, usageUsd: 0, usageAt: at(-60) },
    }
    put(`TEAM#${t.id}`, t)
    put(`JOIN#${t.joinCode}`, { teamId: t.id })
    for (const [id, name] of people) users.push(user(id, name, "participant", { verifiedAt: at(-55), teamId: t.id }))
    if (sub) {
      const full: Submission = {
        teamId: t.id,
        status: "draft",
        name: "",
        tagline: "",
        description: "",
        repoUrl: "",
        demoUrl: "",
        videoUrl: "",
        aiTools: [],
        aiToolsOther: "",
        photoKeys: [],
        consentPhotos: sub.status === "submitted",
        consentMit: sub.status === "submitted",
        firstSubmittedAt: sub.status === "submitted" ? at(-20) : undefined,
        updatedAt: at(-15),
        updatedBy: people[0][1],
        ...sub,
      }
      put(`SUB#${t.id}`, full)
    }
  }
  for (const u of users) put(`USER#${u.id}`, u)

  // One judge has already scored so the leaderboard has something to show.
  const score = (teamId: string, s: number[]): Score => ({
    teamId,
    judgeId: "demo-judge-2",
    judgeName: "Mr. Okafor",
    scores: Object.fromEntries(event.criteria.map((c, i) => [c.id, s[i]])),
    notes: "",
    updatedAt: at(-5),
  })
  for (const sc of [score("t-null", [9, 8, 9, 7, 8]), score("t-friday", [7, 9, 6, 7, 8]), score("t-prompt", [9, 7, 9, 9, 8])]) {
    put(`SCORE#${sc.teamId}#${sc.judgeId}`, sc)
  }

  const schedule: ScheduleItem[] = [
    { id: "s1", title: "Check-in & breakfast", startsAt: at(-90), endsAt: at(-65), location: "Library foyer" },
    { id: "s2", title: "Kickoff", startsAt: at(-65), endsAt: at(-60), location: "Main room" },
    { id: "s3", title: "Hacking", startsAt: at(-60), endsAt: at(120), location: "Everywhere" },
    { id: "s4", title: "Lunch", startsAt: at(30), endsAt: at(70), location: "Cafeteria" },
    { id: "s5", title: "Demos & judging", startsAt: at(125), endsAt: at(185), location: "Main room" },
    { id: "s6", title: "Awards", startsAt: at(190), endsAt: at(210), location: "Main room" },
  ]
  for (const s of schedule) put(`SCHED#${s.id}`, s)

  const anns: Announcement[] = [
    { id: `${at(-45)}#a1`, body: "Wi-Fi: BashaGuest — password is on the whiteboard. Mentors are wearing orange lanyards.", authorName: "Karthick Arun", createdAt: at(-45) },
    { id: `${at(-3)}#a2`, body: "🍕 Lunch is in the cafeteria in 30 minutes — bring your badge!", authorName: "Karthick Arun", createdAt: at(-3) },
  ]
  for (const a of anns) put(`ANN#${a.id}`, a)

  const tickets: Ticket[] = [
    { id: `${at(-9)}#k1`, teamId: "t-friday", teamName: "Deploy on Friday", topic: "Vercel build failing on env vars", description: "Works locally, fails on deploy with 'DATABASE_URL undefined'.", location: "Table 6", status: "open", createdAt: at(-9), updatedAt: at(-9) },
    { id: `${at(-2)}#k2`, teamId: "t-solo", teamName: "Solo Sam", topic: "opencode won't pick up my key", description: "", location: "Table 2, by the window", status: "open", createdAt: at(-2), updatedAt: at(-2) },
    { id: `${at(-15)}#k3`, teamId: "t-prompt", teamName: "Prompt Engineers", topic: "CORS error calling our API", description: "fetch from localhost:5173 is blocked", location: "Table 9", status: "claimed", mentorId: "demo-mentor", mentorName: "Priya Shah", createdAt: at(-15), updatedAt: at(-11) },
  ]
  for (const t of tickets) put(`TICKET#${t.id}`, t)
}
