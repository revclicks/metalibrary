export type AdWithRelations = {
  id: string
  adLibraryId: string | null
  advertiserName: string
  pageId: string | null
  format: string
  status: string
  primaryText: string | null
  headline: string | null
  description: string | null
  ctaType: string | null
  destinationUrl: string | null
  displayUrl: string | null
  creativeUrl: string | null
  videoUrl: string | null
  screenshotUrl: string | null
  platforms: string[]
  countries: string[]
  adStartDate: string | null
  adEndDate: string | null
  savedAt: string
  updatedAt: string
  starred: boolean
  savedById: string
  carouselCards: CarouselCardType[]
  tags: { tag: TagType }[]
  folders: { folder: FolderType }[]
  notes: NoteType[]
  annotations: AnnotationType[]
}

export type CarouselCardType = {
  id: string
  position: number
  imageUrl: string | null
  headline: string | null
  description: string | null
  url: string | null
}

export type FolderType = {
  id: string
  name: string
  parentFolderId: string | null
  isSmart: boolean
  smartRules: unknown
  isShared?: boolean
  shareLink?: string | null
  createdAt: string
  _count?: { ads: number }
  subfolders?: FolderType[]
}

export type TagType = {
  id: string
  name: string
  color: string
  group: string | null
  _count?: { ads: number }
}

export type NoteType = {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string | null; avatar: string | null }
}

export type AnnotationType = {
  id: string
  xPosition: number
  yPosition: number
  content: string
  createdAt: string
  user: { id: string; name: string | null }
}

export type UserType = {
  id: string
  email: string
  name: string | null
  avatar: string | null
  plan: string
  role: string
  teamId: string | null
  createdAt: string
}

export type ActivityType = {
  id: string
  action: string
  entityType: string
  entityId: string
  metadata: unknown
  createdAt: string
  user: { id: string; name: string | null; avatar: string | null }
}

export type FilterState = {
  search: string
  folders: string[]
  tags: string[]
  advertiser: string
  format: string[]
  formats: string[]
  status: string[]
  statuses: string[]
  dateRange: { start: string | null; end: string | null }
  ctaType: string[]
  ctaTypes: string[]
  platforms: string[]
  starred: boolean | null | undefined
  tagLogic: 'AND' | 'OR'
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export type ViewMode = 'grid' | 'list'

// Simplified Ad type for components
export type Ad = {
  id: string
  adLibraryId?: string | null
  advertiserName: string
  pageId?: string | null
  format: string
  status: string
  primaryText?: string | null
  headline?: string | null
  description?: string | null
  ctaType?: string | null
  destinationUrl?: string | null
  displayUrl?: string | null
  creativeUrl?: string | null
  videoUrl?: string | null
  screenshotUrl?: string | null
  platforms?: string | string[] | null
  countries?: string | string[] | null
  adStartDate?: string | null
  adEndDate?: string | null
  starred: boolean
  savedAt: string
  tags?: TagType[]
  folders?: FolderType[]
  notes?: NoteType[]
  carouselCards?: CarouselCardType[]
}

// Aliases for convenience
export type Tag = TagType
export type Folder = FolderType
export type Note = NoteType
export type Annotation = AnnotationType
export type User = UserType
export type Activity = ActivityType
export type CarouselCard = CarouselCardType
