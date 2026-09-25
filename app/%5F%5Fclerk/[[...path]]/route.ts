import { createFrontendApiProxyHandlers } from "@clerk/nextjs/server"

/**
 * Proxies Clerk's Frontend API through our own domain (/__clerk/*), so a production
 * (Folder is named %5F%5Fclerk because a plain "__clerk" folder would be a private, non-routable folder.)
 * instance needs no CNAME record and sign-in keeps working behind ad blockers.
 * Activated by setting NEXT_PUBLIC_CLERK_PROXY_URL=https://<domain>/__clerk and the
 * matching proxy URL in the Clerk Dashboard → Domains.
 */
export const { GET, POST, PUT, DELETE, PATCH } = createFrontendApiProxyHandlers()
