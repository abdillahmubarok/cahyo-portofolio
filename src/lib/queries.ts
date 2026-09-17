import 'server-only'
import { createClient, createPublicClient } from '@/lib/supabase/server'
import type { Project, ProjectWithCover, ProjectWithMedia, ProjectMedia, SiteSettings, ContactMessage, Service } from '@/lib/types'

// ========================
// Projects
// ========================

export async function getPublishedProjects(): Promise<ProjectWithCover[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, project_media(*)')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getPublishedProjects error:', error)
    return []
  }

  return (data ?? []).map((p: ProjectWithMedia) => ({
    ...p,
    cover: p.project_media?.find(m => m.is_cover) ?? p.project_media?.[0] ?? null,
  }))
}

export async function getFeaturedProjects(): Promise<ProjectWithCover[]> {
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*, project_media(*)')
    .eq('published', true)
    .eq('featured', true)
    .order('sort_order', { ascending: true })
    .limit(6)

  if (error) {
    console.error('getFeaturedProjects error:', error)
    return []
  }

  return (data ?? []).map((p: ProjectWithMedia) => ({
    ...p,
    cover: p.project_media?.find((m: ProjectMedia) => m.is_cover) ?? p.project_media?.[0] ?? null,
  }))
}

export async function getProjectBySlug(slug: string): Promise<ProjectWithMedia | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, project_media(*)')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (error) {
    console.error('Database query error in getProjectBySlug:', error)
    throw new Error(`Gagal memuat proyek dari database: ${error.message}`)
  }
  if (!data) return null

  // Sort media deterministically by sort_order ASC, then created_at ASC
  if (data.project_media) {
    data.project_media.sort((a: ProjectMedia, b: ProjectMedia) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    })
  }

  return data as ProjectWithMedia
}

export type AdjacentProject = Pick<Project, 'title' | 'slug' | 'category'> & {
  coverUrl?: string | null
}

export async function getAdjacentProjects(currentSlug: string): Promise<{
  prev: AdjacentProject | null
  next: AdjacentProject | null
}> {
  const supabase = createPublicClient()
  const { data: current } = await supabase
    .from('projects')
    .select('sort_order')
    .eq('slug', currentSlug)
    .eq('published', true)
    .maybeSingle()

  if (!current) return { prev: null, next: null }

  // Next project: first published project with greater sort_order
  const { data: next } = await supabase
    .from('projects')
    .select('title, slug, category, project_media(storage_path, is_cover)')
    .eq('published', true)
    .gt('sort_order', current.sort_order)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  // Previous project: last published project with lesser sort_order
  const { data: prev } = await supabase
    .from('projects')
    .select('title, slug, category, project_media(storage_path, is_cover)')
    .eq('published', true)
    .lt('sort_order', current.sort_order)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  type AdjacentRaw = {
    title: string
    slug: string
    category: string | null
    project_media: Array<{ storage_path: string; is_cover: boolean | null }> | null
  }

  const mapAdj = (item: AdjacentRaw | null): AdjacentProject | null => {
    if (!item) return null
    const cover = item.project_media?.find(m => m.is_cover) ?? item.project_media?.[0]
    return {
      title: item.title,
      slug: item.slug,
      category: item.category,
      coverUrl: cover?.storage_path ? cover.storage_path : null,
    }
  }

  return {
    prev: mapAdj(prev),
    next: mapAdj(next),
  }
}

// Backward compatibility alias
export async function getNextProject(currentSlug: string): Promise<Pick<Project, 'title' | 'slug'> | null> {
  const { next } = await getAdjacentProjects(currentSlug)
  return next ? { title: next.title, slug: next.slug } : null
}

export async function getPublishedProjectSlugs(): Promise<string[]> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('projects')
    .select('slug')
    .eq('published', true)

  return (data ?? []).map(p => p.slug)
}

// ========================
// Site Settings
// ========================

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single()

  return data
}

// ========================
// Services
// ========================

export async function getServices(): Promise<Service[]> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true })

  return data ?? []
}

// ========================
// Admin Queries
// ========================

export async function getAllProjects(): Promise<ProjectWithCover[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*, project_media(*)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (data ?? []).map((p: ProjectWithMedia) => ({
    ...p,
    cover: p.project_media?.find((m: ProjectMedia) => m.is_cover) ?? p.project_media?.[0] ?? null,
  }))
}

export async function getProjectById(id: string): Promise<ProjectWithMedia | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, project_media(*)')
    .eq('id', id)
    .single()

  if (error || !data) return null

  if (data.project_media) {
    data.project_media.sort((a: ProjectMedia, b: ProjectMedia) => a.sort_order - b.sort_order)
  }

  return data as ProjectWithMedia
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)

  return count ?? 0
}

export async function getProjectStats() {
  const supabase = await createClient()

  const [
    { count: total },
    { count: published },
    { count: drafts },
    { count: totalImages },
    { count: unreadMessages },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('published', false),
    supabase.from('project_media').select('*', { count: 'exact', head: true }),
    supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('read', false),
  ])

  return {
    total: total ?? 0,
    published: published ?? 0,
    drafts: drafts ?? 0,
    totalImages: totalImages ?? 0,
    unreadMessages: unreadMessages ?? 0,
  }
}
