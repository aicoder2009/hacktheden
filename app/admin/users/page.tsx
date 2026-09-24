import { PageHeader } from "@/components/page-header"
import { isSuperAdmin } from "@/lib/auth"
import { listTeams, listUsers } from "@/lib/data"
import { UsersTable, type UserRow } from "../_components/users-table"

export const metadata = { title: "People" }

export default async function UsersPage() {
  const [users, teams] = await Promise.all([listUsers(), listTeams()])
  const teamName = new Map(teams.map((t) => [t.id, t.name]))
  const rows: UserRow[] = users
    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      verified: !!u.verifiedAt,
      teamName: u.teamId ? (teamName.get(u.teamId) ?? "Unknown team") : null,
      rejoinCode: u.rejoinCode ?? null,
      createdAt: u.createdAt,
      superAdmin: isSuperAdmin(u.email),
    }))
  return (
    <>
      <PageHeader
        title="People"
        description="Everyone who has joined or signed in. Staff sign in with Clerk; participants join with the room code and can get back in with their rejoin code."
      />
      <UsersTable rows={rows} />
    </>
  )
}
