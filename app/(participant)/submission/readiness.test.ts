import { describe, expect, it } from "vitest"
import type { SubmissionInput } from "@/lib/schemas"
import { missingRequirements } from "./readiness"

const empty: SubmissionInput = {
  name: "",
  tagline: "",
  description: "",
  repoUrl: "",
  demoUrl: "",
  videoUrl: "",
  photoKeys: [],
  consentPhotos: false,
  consentMit: false,
}
const ready: SubmissionInput = {
  ...empty,
  name: "Den Radar",
  tagline: "Find a free table",
  description: "It finds free tables. It works using cameras.",
  repoUrl: "https://github.com/den/radar",
  demoUrl: "https://radar.example.com",
  consentPhotos: true,
  consentMit: true,
}

describe("missingRequirements", () => {
  it("lists everything for an empty draft, in form order", () => {
    expect(missingRequirements(empty)).toEqual([
      "Give your project a name",
      "Add a one-line tagline",
      "Add a short description",
      "Add a GitHub repo link",
      "Add a demo or video link",
      "Accept the photo release",
      "Accept the MIT license terms",
    ])
  })

  it("is empty when ready (video alone is enough)", () => {
    expect(missingRequirements(ready)).toEqual([])
    expect(missingRequirements({ ...ready, demoUrl: "", videoUrl: "https://youtu.be/x" })).toEqual([])
  })

  it("explains malformed values", () => {
    expect(
      missingRequirements({ ...ready, description: "too short", repoUrl: "github.com/den", demoUrl: "radar.app" })
    ).toEqual([
      "Description needs a couple of sentences",
      "GitHub link should look like https://github.com/you/project",
      "Live demo link should start with https://",
    ])
  })

  it("does not duplicate the demo-or-video requirement", () => {
    expect(missingRequirements({ ...ready, demoUrl: "" })).toEqual(["Add a demo or video link"])
  })
})
