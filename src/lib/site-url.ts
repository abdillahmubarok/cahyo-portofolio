// Keep the existing deployment default consistent across metadata and discovery.
export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://cahyo-architecture.com')
if (!['http:', 'https:'].includes(siteUrl.protocol) || siteUrl.search || siteUrl.hash) {
  throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) URL without query or fragment')
}
