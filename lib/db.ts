import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb"
import { isLocalData } from "./demo/mode"
import { memDelete, memGet, memPut, memQuery, memTransact, memUpdate } from "./demo/memory-db"
import { seedDemo } from "./demo/seed"
import { awsConfig, env } from "./env"

let client: DynamoDBDocumentClient | undefined
function ddb() {
  client ??= DynamoDBDocumentClient.from(new DynamoDBClient(awsConfig()), {
    marshallOptions: { removeUndefinedValues: true },
  })
  return client
}

const table = () => env().DYNAMODB_TABLE
/** Every item for the current event lives in one partition. */
export const pk = () => `EVENT#${env().EVENT_ID}`

type Item = Record<string, unknown>

/** Demo mode keeps data in a local file; seeded with sample data on first use. */
function demo() {
  if (!isLocalData()) return false
  seedDemo(pk())
  return true
}

function strip<T>(item: Item | undefined): T | undefined {
  if (!item) return undefined
  return Object.fromEntries(Object.entries(item).filter(([k]) => k !== "PK" && k !== "SK")) as T
}

export async function getItem<T>(sk: string): Promise<T | undefined> {
  if (demo()) return strip<T>(memGet(pk(), sk))
  const res = await ddb().send(new GetCommand({ TableName: table(), Key: { PK: pk(), SK: sk } }))
  return strip<T>(res.Item)
}

export async function putItem(sk: string, data: object, opts: { ifNotExists?: boolean } = {}) {
  if (demo()) return memPut({ PK: pk(), SK: sk, ...data }, opts.ifNotExists ? "attribute_not_exists(PK)" : undefined)
  await ddb().send(
    new PutCommand({
      TableName: table(),
      Item: { PK: pk(), SK: sk, ...data },
      ...(opts.ifNotExists && { ConditionExpression: "attribute_not_exists(PK)" }),
    })
  )
}

/**
 * SET the given fields. `condition` uses `#`/`:` placeholders supplied via names/values.
 */
export async function updateItem(
  sk: string,
  fields: Item,
  opts: { condition?: string; names?: Record<string, string>; values?: Item; remove?: string[] } = {}
) {
  const names: Record<string, string> = { ...opts.names }
  const values: Item = { ...opts.values }
  const sets = Object.entries(fields).map(([k, v], i) => {
    names[`#f${i}`] = k
    values[`:f${i}`] = v
    return `#f${i} = :f${i}`
  })
  const removes = (opts.remove ?? []).map((k, i) => {
    names[`#r${i}`] = k
    return `#r${i}`
  })
  const expr = [sets.length && `SET ${sets.join(", ")}`, removes.length && `REMOVE ${removes.join(", ")}`]
    .filter(Boolean)
    .join(" ")
  if (demo()) {
    return strip<Item>(memUpdate(pk(), sk, expr, opts.condition, names, Object.keys(values).length ? values : undefined))
  }
  const res = await ddb().send(
    new UpdateCommand({
      TableName: table(),
      Key: { PK: pk(), SK: sk },
      UpdateExpression: expr,
      ConditionExpression: opts.condition,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
      ReturnValues: "ALL_NEW",
    })
  )
  return strip<Item>(res.Attributes)
}

export async function deleteItem(sk: string) {
  if (demo()) return memDelete(pk(), sk)
  await ddb().send(new DeleteCommand({ TableName: table(), Key: { PK: pk(), SK: sk } }))
}

export async function queryPrefix<T>(prefix: string, opts: { newestFirst?: boolean; limit?: number } = {}) {
  if (demo()) return memQuery(pk(), prefix, opts.newestFirst, opts.limit).map((it) => strip<T>(it)!)
  const items: T[] = []
  let startKey: Record<string, unknown> | undefined
  do {
    const res = await ddb().send(
      new QueryCommand({
        TableName: table(),
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :p)",
        ExpressionAttributeValues: { ":pk": pk(), ":p": prefix },
        ScanIndexForward: !opts.newestFirst,
        Limit: opts.limit,
        ExclusiveStartKey: startKey,
      })
    )
    for (const it of res.Items ?? []) items.push(strip<T>(it)!)
    startKey = opts.limit ? undefined : res.LastEvaluatedKey
  } while (startKey)
  return items
}

/** Build transaction items without repeating TableName/PK everywhere. */
export const tx = {
  put: (sk: string, data: object, condition?: string) => ({
    Put: { TableName: table(), Item: { PK: pk(), SK: sk, ...data }, ConditionExpression: condition },
  }),
  del: (sk: string) => ({ Delete: { TableName: table(), Key: { PK: pk(), SK: sk } } }),
  update: (
    sk: string,
    expr: string,
    opts: { condition?: string; names?: Record<string, string>; values?: Item }
  ) => ({
    Update: {
      TableName: table(),
      Key: { PK: pk(), SK: sk },
      UpdateExpression: expr,
      ConditionExpression: opts.condition,
      ExpressionAttributeNames: opts.names,
      ExpressionAttributeValues: opts.values,
    },
  }),
}

export async function transact(items: NonNullable<TransactWriteCommandInput["TransactItems"]>) {
  if (demo()) return memTransact(items as Parameters<typeof memTransact>[0])
  await ddb().send(new TransactWriteCommand({ TransactItems: items }))
}

export function isConditionFailure(e: unknown) {
  const name = (e as { name?: string })?.name
  return name === "ConditionalCheckFailedException" || name === "TransactionCanceledException"
}
