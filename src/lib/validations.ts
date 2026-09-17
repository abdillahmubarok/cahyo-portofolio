import { z } from 'zod'

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Email tidak valid').max(200),
  phone: z.string().max(30).optional().or(z.literal('')),
  subject: z.string().max(200).optional().or(z.literal('')),
  message: z.string().min(10, 'Pesan minimal 10 karakter').max(5000),
  _honeypot: z.string().max(0, 'Spam detected').optional(),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

export const projectFormSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').max(200),
  slug: z.string().min(1, 'Slug wajib diisi').max(100),
  summary: z.string().max(500).optional().or(z.literal('')),
  description: z.string().max(10000).optional().or(z.literal('')),
  problem: z.string().max(5000).optional().or(z.literal('')),
  solution: z.string().max(5000).optional().or(z.literal('')),
  duration_text: z.string().max(200).optional().or(z.literal('')),
  size_text: z.string().max(200).optional().or(z.literal('')),
  style_text: z.string().max(200).optional().or(z.literal('')),
  category: z.string().max(100).optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  client_name: z.string().max(200).optional().or(z.literal('')),
  year: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal('').transform(() => undefined)),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  sort_order: z.coerce.number().int().default(0),
})

export type ProjectFormData = z.infer<typeof projectFormSchema>

export const siteSettingsSchema = z.object({
  architect_name: z.string().max(200).optional().or(z.literal('')),
  studio_name: z.string().max(200).optional().or(z.literal('')),
  hero_title: z.string().max(500).optional().or(z.literal('')),
  hero_subtitle: z.string().max(500).optional().or(z.literal('')),
  about_short: z.string().max(2000).optional().or(z.literal('')),
  about_long: z.string().max(10000).optional().or(z.literal('')),
  email: z.string().max(200).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  whatsapp: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  instagram_url: z.string().max(300).optional().or(z.literal('')),
  linkedin_url: z.string().max(300).optional().or(z.literal('')),
  behance_url: z.string().max(300).optional().or(z.literal('')),
  footer_text: z.string().max(500).optional().or(z.literal('')),
})

export type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>
