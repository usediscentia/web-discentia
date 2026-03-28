import { getDB } from "@/services/storage/database"
import { apiFetch } from "@/lib/api-client"

async function buildSnapshot(): Promise<Record<string, unknown[]>> {
  const db = await getDB()
  const tableNames = db.tables.map((t) => t.name)

  const entries = await Promise.all(
    tableNames.map(async (name) => {
      const rows = await (db.table(name) as unknown as { toArray: () => Promise<unknown[]> }).toArray()
      return [name, rows] as const
    })
  )

  return Object.fromEntries(entries)
}

export async function sendBackup(): Promise<void> {
  const snapshot = await buildSnapshot()
  await apiFetch("/backup", {
    method: "POST",
    body: JSON.stringify({ snapshot }),
  })
}
