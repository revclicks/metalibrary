import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Legacy aliases
export const signUpSchema = registerSchema
export const signInSchema = loginSchema

// Ad schemas
export const createAdSchema = z.object({
  adLibraryId: z.string().optional(),
  advertiserName: z.string().min(1, 'Advertiser name is required'),
  pageId: z.string().optional(),
  format: z.enum(['image', 'video', 'carousel', 'collection']).default('image'),
  status: z.enum(['active', 'inactive']).default('active'),
  primaryText: z.string().optional(),
  headline: z.string().optional(),
  description: z.string().optional(),
  ctaType: z.string().optional(),
  destinationUrl: z.string().url().optional().or(z.literal('')),
  displayUrl: z.string().optional(),
  creativeUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  screenshotUrl: z.string().optional(),
  platforms: z.string().optional(),
  countries: z.string().optional(),
  adStartDate: z.string().optional(),
  adEndDate: z.string().optional(),
  starred: z.boolean().default(false),
  folderIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  note: z.string().optional(),
  carouselCards: z
    .array(
      z.object({
        position: z.number(),
        imageUrl: z.string().optional(),
        headline: z.string().optional(),
        description: z.string().optional(),
        url: z.string().optional(),
      })
    )
    .optional(),
})

export const updateAdSchema = z.object({
  advertiserName: z.string().min(1).optional(),
  pageId: z.string().optional(),
  format: z.enum(['image', 'video', 'carousel', 'collection']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  primaryText: z.string().optional(),
  headline: z.string().optional(),
  description: z.string().optional(),
  ctaType: z.string().optional(),
  destinationUrl: z.string().optional(),
  displayUrl: z.string().optional(),
  creativeUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  screenshotUrl: z.string().optional(),
  platforms: z.string().optional(),
  countries: z.string().optional(),
  adStartDate: z.string().optional(),
  adEndDate: z.string().optional(),
  starred: z.boolean().optional(),
  folderIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
})

// Folder schemas
export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentFolderId: z.string().optional(),
  isSmart: z.boolean().default(false),
  smartRules: z.any().optional(),
})

export const updateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  parentFolderId: z.string().nullable().optional(),
  isSmart: z.boolean().optional(),
  smartRules: z.any().nullable().optional(),
  isShared: z.boolean().optional(),
})

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  color: z.string().default('#6366f1'),
  group: z.string().optional(),
})

export const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  group: z.string().nullable().optional(),
})

// Note schemas
export const createNoteSchema = z.object({
  adId: z.string().min(1, 'Ad ID is required'),
  content: z.string().min(1, 'Note content is required'),
})

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
})

// Annotation schemas
export const createAnnotationSchema = z.object({
  adId: z.string().min(1, 'Ad ID is required'),
  xPosition: z.number().min(0).max(100),
  yPosition: z.number().min(0).max(100),
  content: z.string().min(1, 'Annotation content is required'),
})

// Auto tag rule schemas
export const autoTagRuleSchema = z.object({
  tagName: z.string().min(1),
  field: z.enum(['primaryText', 'headline', 'advertiserName', 'format']),
  operator: z.enum(['contains', 'equals', 'startsWith']),
  value: z.string().min(1),
})

// Export schemas
export const exportSchema = z.object({
  format: z.enum(['csv', 'json']),
  adIds: z.array(z.string()).optional(),
  folderId: z.string().optional(),
})
