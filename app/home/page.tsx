import { redirect } from "next/navigation"
import { homeFor, pageUser } from "@/lib/auth"

/** Post-sign-in landing: send each role to its home. */
export default async function HomeRedirect() {
  const user = await pageUser()
  redirect(homeFor(user.role))
}
