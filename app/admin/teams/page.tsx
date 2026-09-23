import { disableAllAiKeys, refreshAiUsage, setAiKeyDisabled } from "@/actions/admin"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listSubmissions, listTeams } from "@/lib/data"
import { fmtUsd } from "@/lib/format"
import { ActionButton } from "../_components/action-button"
import { LocalTime } from "../_components/local-time"
import { SubmissionBadge } from "../_components/submission-badge"

export const metadata = { title: "Teams" }

export default async function TeamsPage() {
  const [teams, subs] = await Promise.all([listTeams(), listSubmissions()])
  const subStatus = new Map(subs.map((s) => [s.teamId, s.status]))
  // Only non-secret fields leave this function — never the raw key.
  const rows = teams
    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((t) => ({
      id: t.id,
      name: t.name,
      joinCode: t.joinCode,
      members: Object.entries(t.members)
        .toSorted(([, a], [, b]) => a.joinedAt.localeCompare(b.joinedAt))
        .map(([id, m]) => ({ id, name: m.name, captain: id === t.captainId })),
      submission: subStatus.get(t.id) ?? null,
      ai:
        t.ai?.status === "active"
          ? { status: "active" as const, usageUsd: t.ai.usageUsd, limitUsd: t.ai.limitUsd, disabled: t.ai.disabled, usageAt: t.ai.usageAt }
          : t.ai
            ? { status: "pending" as const }
            : null,
    }))
  const activeKeys = rows.filter((r) => r.ai?.status === "active").length
  const totalUsage = rows.reduce((a, r) => a + (r.ai?.status === "active" ? r.ai.usageUsd : 0), 0)

  return (
    <>
      <PageHeader
        title="Teams"
        description={`${rows.length} teams · ${activeKeys} AI keys · ${fmtUsd(totalUsage)} spent (as of last refresh)`}
      >
        <ActionButton action={refreshAiUsage} success="AI usage refreshed">
          Refresh AI usage
        </ActionButton>
        <ActionButton
          action={disableAllAiKeys}
          variant="destructive"
          confirm="Disable every team's AI key? Use this at the end of the event. You can re-enable keys one by one."
          success="All AI keys disabled"
        >
          Disable all AI keys
        </ActionButton>
      </PageHeader>
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Join code</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Submission</TableHead>
              <TableHead>AI usage</TableHead>
              <TableHead className="text-right">AI key</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="font-mono tracking-wider">{t.joinCode}</TableCell>
                <TableCell className="whitespace-normal">
                  <ul className="grid min-w-40 gap-0.5">
                    {t.members.map((m) => (
                      <li key={m.id}>
                        {m.name}
                        {m.captain && <span className="ml-1 text-[10px] text-primary uppercase">captain</span>}
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>
                  <SubmissionBadge status={t.submission} />
                </TableCell>
                <TableCell>
                  {t.ai?.status === "active" ? (
                    <div className="grid gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums">
                          {fmtUsd(t.ai.usageUsd)} / {fmtUsd(t.ai.limitUsd)}
                        </span>
                        {t.ai.disabled && <Badge variant="destructive">disabled</Badge>}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        updated <LocalTime iso={t.ai.usageAt} mode="ago" />
                      </span>
                    </div>
                  ) : t.ai?.status === "pending" ? (
                    <Badge variant="outline">provisioning…</Badge>
                  ) : (
                    <span className="text-muted-foreground">No key</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {t.ai?.status === "active" && (
                    <ActionButton
                      size="xs"
                      variant={t.ai.disabled ? "outline" : "destructive"}
                      action={setAiKeyDisabled.bind(null, t.id, !t.ai.disabled)}
                      confirm={t.ai.disabled ? undefined : `Disable ${t.name}'s AI key? Their tools stop working immediately.`}
                      success={t.ai.disabled ? "Key enabled" : "Key disabled"}
                    >
                      {t.ai.disabled ? "Enable" : "Disable"}
                    </ActionButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No teams yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
