import { supabaseAdmin } from './supabase'

// Database types based on our schema
export interface User {
  id: string
  email: string
  name?: string
  image?: string
  subscriptionTier: string
  createdAt: string
  updatedAt: string
}

export interface BrandKit {
  id: string
  userId: string
  name: string
  description?: string
  companyName: string
  tagline?: string
  vision?: string
  mission?: string
  values?: any[]
  colors?: any
  typography?: any
  tone?: string
  voiceDescriptor?: string
  audienceDescription?: string
  products?: any[]
  logoUrl?: string
  brandGuidelinesUrl?: string
  productImages?: any[]
  status: string
  createdAt: string
  updatedAt: string
}

export interface GeneratedContent {
  id: string
  userId: string
  brandKitId: string
  contentType: string
  platform: string
  content?: string
  imageUrl?: string
  metadata?: any
  createdAt: string
}

export interface PosterSession {
  id: string
  userId: string
  brandKitId: string
  initialDescription?: string
  conversationHistory?: any[]
  gatheredInfo?: any
  currentStage: string
  refinedPrompt?: string
  nanoBananaJobId?: string
  generatedImageUrl?: string
  imageVersions?: any[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface APIUsage {
  id: string
  userId: string
  endpoint: string
  tokensUsed: number
  costUSD: number
  createdAt: string
}

// Database operations
export class Database {
  // User operations
  static async findUserById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
    return data
  }

  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('User')
      .insert(userData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('User')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // BrandKit operations
  static async findBrandKitsByUserId(userId: string, options?: { orderBy?: string }): Promise<BrandKit[]> {
    let query = supabaseAdmin
      .from('BrandKit')
      .select('*')
      .eq('userId', userId)

    if (options?.orderBy) {
      query = query.order('updatedAt', { ascending: false })
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async findBrandKitById(id: string): Promise<BrandKit | null> {
    const { data, error } = await supabaseAdmin
      .from('BrandKit')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async findBrandKitByIdAndUserId(id: string, userId: string): Promise<BrandKit | null> {
    const { data, error } = await supabaseAdmin
      .from('BrandKit')
      .select('*')
      .eq('id', id)
      .eq('userId', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async createBrandKit(brandKitData: Omit<BrandKit, 'id' | 'createdAt' | 'updatedAt'>): Promise<BrandKit> {
    const { data, error } = await supabaseAdmin
      .from('BrandKit')
      .insert(brandKitData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateBrandKit(id: string, updates: Partial<BrandKit>): Promise<BrandKit> {
    const { data, error } = await supabaseAdmin
      .from('BrandKit')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteBrandKit(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('BrandKit')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // GeneratedContent operations
  static async createGeneratedContent(contentData: Omit<GeneratedContent, 'id' | 'createdAt'>): Promise<GeneratedContent> {
    const { data, error } = await supabaseAdmin
      .from('GeneratedContent')
      .insert(contentData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // PosterSession operations
  static async createPosterSession(sessionData: Omit<PosterSession, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>): Promise<PosterSession> {
    const { data, error } = await supabaseAdmin
      .from('PosterSession')
      .insert(sessionData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async findPosterSessionById(id: string): Promise<PosterSession | null> {
    const { data, error } = await supabaseAdmin
      .from('PosterSession')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async updatePosterSession(id: string, updates: Partial<PosterSession>): Promise<PosterSession> {
    const { data, error } = await supabaseAdmin
      .from('PosterSession')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // APIUsage operations
  static async createAPIUsage(usageData: Omit<APIUsage, 'id' | 'createdAt'>): Promise<APIUsage> {
    const { data, error } = await supabaseAdmin
      .from('APIUsage')
      .insert(usageData)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
