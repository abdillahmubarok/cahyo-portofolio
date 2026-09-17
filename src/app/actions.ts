'use server'

import { createClient } from '@/lib/supabase/server'
import { contactFormSchema } from '@/lib/validations'
import { projectFormSchema, siteSettingsSchema } from '@/lib/validations'
import { getAuthenticatedAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { slugify } from '@/lib/utils'

// ========================
// Contact Message
// ========================

export type ContactFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function submitContactMessage(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const raw = Object.fromEntries(formData.entries())

  // Honeypot check
  if (raw._honeypot && String(raw._honeypot).length > 0) {
    return { success: true } // Silently accept spam
  }

  const parsed = contactFormSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('contact_messages').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    subject: parsed.data.subject || null,
    message: parsed.data.message,
  })

  if (error) {
    return { error: 'Gagal mengirim pesan. Silakan coba lagi.' }
  }

  return { success: true }
}

// ========================
// Admin: Projects
// ========================

export type ProjectFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  projectId?: string
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await getAuthenticatedAdmin()

  const raw = Object.fromEntries(formData.entries())
  raw.published = formData.get('published') === 'on' ? 'true' : 'false'
  raw.featured = formData.get('featured') === 'on' ? 'true' : 'false'

  const parsed = projectFormSchema.safeParse({
    ...raw,
    published: raw.published === 'true',
    featured: raw.featured === 'true',
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  if (!data.slug) {
    data.slug = slugify(data.title)
  }

  const supabase = await createClient()
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      title: data.title,
      slug: data.slug,
      summary: data.summary || null,
      description: data.description || null,
      problem: data.problem || null,
      solution: data.solution || null,
      duration_text: data.duration_text || null,
      size_text: data.size_text || null,
      style_text: data.style_text || null,
      category: data.category || null,
      location: data.location || null,
      client_name: data.client_name || null,
      year: data.year || null,
      published: data.published,
      featured: data.featured,
      sort_order: data.sort_order,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Slug sudah digunakan oleh proyek lain.' }
    }
    return { error: 'Gagal membuat proyek.' }
  }

  revalidatePath('/')
  revalidatePath('/projects')
  redirect(`/admin/projects/${project.id}/edit`)
}

export async function updateProject(
  projectId: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await getAuthenticatedAdmin()

  const raw = Object.fromEntries(formData.entries())

  const parsed = projectFormSchema.safeParse({
    ...raw,
    published: raw.published === 'on' || raw.published === 'true',
    featured: raw.featured === 'on' || raw.featured === 'true',
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data

  const supabase = await createClient()

  // Fetch previous slug to invalidate properly if slug changed
  const { data: previousProject } = await supabase
    .from('projects')
    .select('slug')
    .eq('id', projectId)
    .maybeSingle()

  const { error } = await supabase
    .from('projects')
    .update({
      title: data.title,
      slug: data.slug,
      summary: data.summary || null,
      description: data.description || null,
      problem: data.problem || null,
      solution: data.solution || null,
      duration_text: data.duration_text || null,
      size_text: data.size_text || null,
      style_text: data.style_text || null,
      category: data.category || null,
      location: data.location || null,
      client_name: data.client_name || null,
      year: data.year || null,
      published: data.published,
      featured: data.featured,
      sort_order: data.sort_order,
    })
    .eq('id', projectId)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Slug sudah digunakan oleh proyek lain.' }
    }
    return { error: 'Gagal memperbarui proyek.' }
  }

  // Invalidate old slug if changed
  if (previousProject?.slug && previousProject.slug !== data.slug) {
    revalidatePath(`/projects/${previousProject.slug}`)
  }

  revalidatePath('/')
  revalidatePath('/projects')
  revalidatePath(`/projects/${data.slug}`)
  revalidatePath('/sitemap.xml')
  revalidatePath('/admin/projects')
  revalidatePath(`/admin/projects/${projectId}/edit`)

  return { success: true }
}

export async function deleteProject(projectId: string) {
  await getAuthenticatedAdmin()

  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('slug')
    .eq('id', projectId)
    .maybeSingle()

  // Delete media files from storage first
  const { data: media } = await supabase
    .from('project_media')
    .select('storage_path')
    .eq('project_id', projectId)

  if (media && media.length > 0) {
    await supabase.storage
      .from('portfolio-images')
      .remove(media.map(m => m.storage_path))
  }

  await supabase.from('projects').delete().eq('id', projectId)

  if (project?.slug) {
    revalidatePath(`/projects/${project.slug}`)
  }
  revalidatePath('/')
  revalidatePath('/projects')
  revalidatePath('/sitemap.xml')
  revalidatePath('/admin/projects')
  revalidatePath('/admin')
  redirect('/admin/projects')
}

export async function toggleProjectPublished(projectId: string, published: boolean) {
  await getAuthenticatedAdmin()
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('slug')
    .eq('id', projectId)
    .maybeSingle()

  await supabase.from('projects').update({ published }).eq('id', projectId)

  if (project?.slug) {
    revalidatePath(`/projects/${project.slug}`)
  }
  revalidatePath('/')
  revalidatePath('/projects')
  revalidatePath('/sitemap.xml')
  revalidatePath('/admin/projects')
  revalidatePath('/admin')
}

// ========================
// Admin: Media
// ========================

export async function registerProjectMedia(
  projectId: string,
  mediaData: {
    storage_path: string
    width?: number | null
    height?: number | null
    aspect_ratio?: number | null
    sort_order: number
    is_cover: boolean
  }
) {
  await getAuthenticatedAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('project_media')
    .insert({
      project_id: projectId,
      storage_path: mediaData.storage_path,
      width: mediaData.width,
      height: mediaData.height,
      aspect_ratio: mediaData.aspect_ratio,
      sort_order: mediaData.sort_order,
      is_cover: mediaData.is_cover,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  const { data: project } = await supabase
    .from('projects')
    .select('slug')
    .eq('id', projectId)
    .maybeSingle()

  if (project?.slug) {
    revalidatePath(`/projects/${project.slug}`)
  }
  revalidatePath('/')
  revalidatePath('/projects')
  revalidatePath(`/admin/projects/${projectId}/edit`)

  return data
}

export async function deleteMedia(mediaId: string, storagePath: string) {
  await getAuthenticatedAdmin()
  const supabase = await createClient()

  // Find project_id before deleting
  const { data: mediaItem } = await supabase
    .from('project_media')
    .select('project_id')
    .eq('id', mediaId)
    .maybeSingle()

  await supabase.storage.from('portfolio-images').remove([storagePath])
  await supabase.from('project_media').delete().eq('id', mediaId)

  if (mediaItem?.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('slug')
      .eq('id', mediaItem.project_id)
      .maybeSingle()

    if (project?.slug) {
      revalidatePath(`/projects/${project.slug}`)
    }
  }
  revalidatePath('/')
  revalidatePath('/projects')
  revalidatePath('/admin/projects')
}

export async function setCoverImage(mediaId: string, projectId: string) {
  await getAuthenticatedAdmin()
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('slug')
    .eq('id', projectId)
    .maybeSingle()

  // Remove current cover
  await supabase
    .from('project_media')
    .update({ is_cover: false })
    .eq('project_id', projectId)

  // Set new cover
  await supabase
    .from('project_media')
    .update({ is_cover: true })
    .eq('id', mediaId)

  if (project?.slug) {
    revalidatePath(`/projects/${project.slug}`)
  }
  revalidatePath('/')
  revalidatePath('/projects')
  revalidatePath('/admin/projects')
  revalidatePath(`/admin/projects/${projectId}/edit`)
}

export async function updateMediaAlt(mediaId: string, altText: string, caption: string) {
  await getAuthenticatedAdmin()
  const supabase = await createClient()

  const { data: mediaItem } = await supabase
    .from('project_media')
    .select('project_id')
    .eq('id', mediaId)
    .maybeSingle()

  await supabase
    .from('project_media')
    .update({ alt_text: altText, caption })
    .eq('id', mediaId)

  if (mediaItem?.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('slug')
      .eq('id', mediaItem.project_id)
      .maybeSingle()

    if (project?.slug) {
      revalidatePath(`/projects/${project.slug}`)
    }
  }
  revalidatePath('/')
  revalidatePath('/projects')
}

export async function updateMediaOrder(items: { id: string; sort_order: number }[]) {
  await getAuthenticatedAdmin()
  const supabase = await createClient()

  for (const item of items) {
    await supabase
      .from('project_media')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
  }

  if (items.length > 0) {
    const { data: media } = await supabase
      .from('project_media')
      .select('project_id')
      .eq('id', items[0].id)
      .maybeSingle()

    if (media?.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('slug')
        .eq('id', media.project_id)
        .maybeSingle()

      if (project?.slug) {
        revalidatePath(`/projects/${project.slug}`)
      }
    }
  }

  revalidatePath('/')
  revalidatePath('/projects')
  revalidatePath('/admin/projects')
}

// ========================
// Admin: Site Settings
// ========================

export async function updateSiteSettings(
  _prevState: { success?: boolean; error?: string },
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  await getAuthenticatedAdmin()

  const raw = Object.fromEntries(formData.entries())
  const parsed = siteSettingsSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: 'Data tidak valid.' }
  }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from('site_settings')
    .update({
      architect_name: data.architect_name || null,
      studio_name: data.studio_name || null,
      hero_title: data.hero_title || null,
      hero_subtitle: data.hero_subtitle || null,
      about_short: data.about_short || null,
      about_long: data.about_long || null,
      email: data.email || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      address: data.address || null,
      instagram_url: data.instagram_url || null,
      linkedin_url: data.linkedin_url || null,
      behance_url: data.behance_url || null,
      footer_text: data.footer_text || null,
    })
    .eq('id', 1)

  if (error) {
    return { error: 'Gagal menyimpan pengaturan.' }
  }

  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/contact')
  revalidatePath('/services')
  revalidatePath('/projects')
  revalidatePath('/admin/settings')
  return { success: true }
}

// ========================
// Admin: Messages
// ========================

export async function markMessageRead(messageId: string) {
  await getAuthenticatedAdmin()
  const supabase = await createClient()
  await supabase.from('contact_messages').update({ read: true }).eq('id', messageId)
  revalidatePath('/admin/messages')
}

export async function deleteMessage(messageId: string) {
  await getAuthenticatedAdmin()
  const supabase = await createClient()
  await supabase.from('contact_messages').delete().eq('id', messageId)
  revalidatePath('/admin/messages')
}

// ========================
// Auth
// ========================

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/admin/login?error=invalid')
  }

  redirect('/admin')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
