export type Project = {
  id: string
  title: string
  slug: string
  summary: string | null
  description: string | null
  problem: string | null
  solution: string | null
  duration_text: string | null
  size_text: string | null
  style_text: string | null
  category: string | null
  location: string | null
  client_name: string | null
  year: number | null
  status: string | null
  featured: boolean
  published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type ProjectMedia = {
  id: string
  project_id: string
  storage_path: string
  alt_text: string | null
  caption: string | null
  width: number | null
  height: number | null
  aspect_ratio: number | null
  sort_order: number
  is_cover: boolean
  created_at: string
}

export type SiteSettings = {
  id: number
  architect_name: string | null
  studio_name: string | null
  hero_title: string | null
  hero_subtitle: string | null
  about_short: string | null
  about_long: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  instagram_url: string | null
  linkedin_url: string | null
  behance_url: string | null
  footer_text: string | null
  updated_at: string
}

export type AdminProfile = {
  user_id: string
  display_name: string | null
  created_at: string
}

export type ContactMessage = {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  read: boolean
  created_at: string
}

export type Service = {
  id: string
  title: string
  description: string | null
  icon_name: string | null
  sort_order: number
  created_at: string
}

export type ProjectWithCover = Project & {
  cover: ProjectMedia | null
}

export type ProjectWithMedia = Project & {
  project_media: ProjectMedia[]
}
