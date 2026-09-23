import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { isDemo } from "./demo/mode"
import { awsConfig, env } from "./env"

let client: S3Client | undefined
const s3 = () => (client ??= new S3Client(awsConfig()))

export const teamPhotoPrefix = (teamId: string) => `events/${env().EVENT_ID}/teams/${teamId}/`

export async function presignPut(key: string, contentType: string) {
  if (isDemo()) return `/api/demo/files?key=${encodeURIComponent(key)}`
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: env().S3_BUCKET, Key: key, ContentType: contentType }), {
    expiresIn: 300,
  })
}

export async function presignGet(key: string) {
  if (isDemo()) return `/api/demo/files?key=${encodeURIComponent(key)}`
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: env().S3_BUCKET, Key: key }), { expiresIn: 3600 })
}

export async function presignMany(keys: string[]) {
  return Promise.all(keys.map(presignGet))
}
