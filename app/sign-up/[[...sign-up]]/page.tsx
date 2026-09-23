import { SignUp } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { isDemo } from "@/lib/demo/mode"

export default function SignUpPage() {
  if (isDemo()) redirect("/demo")
  return (
    <main className="grid min-h-svh place-items-center p-4">
      <SignUp />
    </main>
  )
}
