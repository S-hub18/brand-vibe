export interface BrandKit {
    id: string
    userId: string
    name: string
    description?: string
    companyName: string
    tagline?: string
    vision?: string
    mission?: string
    values: string[] | null
    colors: BrandColors | null
    typography: BrandTypography | null
    tone?: string
    voiceDescriptor?: string
    audienceDescription?: string
    products: Product[] | null
    logoUrl?: string
    brandGuidelinesUrl?: string
    productImages: ProductImage[] | null
    status?: string
    createdAt: string
    updatedAt: string
}

export interface BrandColors {
    primary: string
    secondary: string
    accent: string
    palette: string[]
}

export interface BrandTypography {
    primaryFont: string
    secondaryFont: string
    headingStyle: string
    bodyStyle: string
}

export interface Product {
    name: string
    description: string
    keyFeatures: string[]
    targetAudience?: string
}

export interface ProductImage {
    url: string
    label: string
}

export interface BrandKitFormData {
    name: string
    companyName: string
    description?: string
    tagline?: string
    vision?: string
    mission?: string
    values?: string[]
    colors?: BrandColors
    typography?: BrandTypography
    tone?: string
    voiceDescriptor?: string
    audienceDescription?: string
    products?: Product[]
    logoUrl?: string
    brandGuidelinesUrl?: string
    productImages?: ProductImage[]
}
