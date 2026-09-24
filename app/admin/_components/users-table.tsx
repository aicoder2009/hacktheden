"use client"

import { useState } from "react"
import { resetRejoinCode, setUserRole, setUserVerified } from "@/actions/admin"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAction } from "@/components/use-action"
import { formatRejoinCode } from "@/lib/codes"
import { ROLES, type Role } from "@/lib/types"
import { LocalTime } from "./local-time"
import { NativeSelect } from "./native-select"

export type UserRow = {
  id: string
  name: string
  email: string
  role: Role
  verified: boolean
  teamName: string | null
  rejoinCode: string | null
  createdAt: string
  superAdmin: boolean
}

const ROLE_LABEL: Record<Role, string> = { participant: "Participant", mentor: "Mentor", judge: "Judge", officer: "Officer" }

export function UsersTable({ rows }: { rows: UserRow[] }) {
  const [q, setQ] = useState("")
  const needle = q.trim().toLowerCase()
  const shown = needle
    ? rows.filter((r) => r.name.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle))
    : rows

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          className="max-w-xs"
          aria-label="Search people"
        />
        <div className="flex flex-wrap gap-1.5 text-xs">
          <Badge variant="secondary">{rows.length} total</Badge>
          {ROLES.map((r) => (
            <Badge key={r} variant="outline">
              {rows.filter((x) => x.role === r).length} {ROLE_LABEL[r].toLowerCase()}s
            </Badge>
          ))}
          <Badge variant="outline">{rows.filter((x) => x.role === "participant" && x.verified).length} verified</Badge>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Super-admins (from SUPER_ADMIN_EMAILS) are always officers — their role can&apos;t be changed.
      </p>
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Rejoin code</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => (
              <UserRowView key={r.id} row={r} />
            ))}
            {shown.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  {rows.length === 0 ? "Nobody has signed in yet." : "No matches."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function UserRowView({ row }: { row: UserRow }) {
  const { pending, exec } = useAction()
  return (
    <TableRow className={pending ? "opacity-60" : undefined}>
      <TableCell className="font-medium">
        {row.name}
        {row.superAdmin && (
          <Badge variant="outline" className="ml-2">
            super-admin
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{row.email}</TableCell>
      <TableCell>
        <NativeSelect
          className="h-7 w-32"
          value={row.role}
          disabled={pending || row.superAdmin}
          aria-label={`Role for ${row.name}`}
          onChange={(e) => {
            const role = e.target.value as Role
            void exec(() => setUserRole(row.id, role), { success: `${row.name} is now ${ROLE_LABEL[role].toLowerCase()}` })
          }}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </NativeSelect>
      </TableCell>
      <TableCell>
        {row.role === "participant" ? (
          <Switch
            checked={row.verified}
            disabled={pending}
            aria-label={`Verified: ${row.name}`}
            onCheckedChange={(checked) =>
              void exec(() => setUserVerified(row.id, checked), { success: checked ? "Marked verified" : "Verification removed" })
            }
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>{row.teamName ?? <span className="text-muted-foreground">—</span>}</TableCell>
      <TableCell>
        {row.rejoinCode ? (
          <span className="flex items-center gap-2">
            <code className="font-mono">{formatRejoinCode(row.rejoinCode)}</code>
            <button
              type="button"
              disabled={pending}
              className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
              onClick={() => {
                if (confirm(`Give ${row.name} a new rejoin code? The old one stops working.`))
                  void exec(() => resetRejoinCode(row.id), { success: "New rejoin code issued" })
              }}
            >
              new
            </button>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        <LocalTime iso={row.createdAt} />
      </TableCell>
    </TableRow>
  )
}
