export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

/** Checked against OpenRouter pricing Sep 2026 — re-verify the week before the event. */
export const RECOMMENDED_MODELS = [
  { id: "deepseek/deepseek-v4.1-flash", note: "Best default — fast, cheap, 1M context" },
  { id: "qwen/qwen3-coder-next", note: "Strong agentic coding" },
  { id: "z-ai/glm-5.3-flash", note: "Cheap and capable" },
  { id: "minimax/minimax-m3", note: "Great for long agent runs" },
  { id: "deepseek/deepseek-v4-pro", note: "Smartest — burns budget faster" },
] as const

export const CONSENT_PHOTOS =
  "By uploading photos of our team and/or product, we release them to the Basha DevOps Club for use in promoting this and future hackathons (website, social media, slides) without compensation."

export const CONSENT_MIT =
  "We understand that every project submitted to this hackathon is released as free and open-source software under the MIT License, and we have the right to release it."

export const MAX_PHOTOS = 10
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024
export const PHOTO_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const

export function setupSnippets(key: string, model: string = RECOMMENDED_MODELS[0].id) {
  return [
    {
      tool: "Any OpenAI-compatible tool",
      code: `Base URL: ${OPENROUTER_BASE_URL}\nAPI key:  ${key}\nModel:    ${model}`,
    },
    {
      tool: "opencode",
      code: `export OPENROUTER_API_KEY=${key}\nopencode   # then /models → openrouter → ${model}`,
    },
    {
      tool: "Cline / Roo (VS Code)",
      code: `Settings → API Provider: OpenRouter\nAPI key: ${key}\nModel: ${model}`,
    },
    {
      tool: "Cursor",
      code: `Settings → Models → OpenAI API Key: ${key}\nOverride base URL: ${OPENROUTER_BASE_URL}\nAdd model: ${model}`,
    },
    {
      tool: "curl",
      code: `curl ${OPENROUTER_BASE_URL}/chat/completions \\\n  -H "Authorization: Bearer ${key}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model":"${model}","messages":[{"role":"user","content":"hi"}]}'`,
    },
  ]
}
