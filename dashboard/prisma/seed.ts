import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

async function main() {
  console.log('Seeding database...')

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash,
      plan: 'pro',
    },
  })
  console.log(`Created user: ${user.email}`)

  // Create tags
  const tags = await Promise.all(
    [
      { name: 'UGC', color: '#ef4444', group: 'Ad Type' },
      { name: 'VSL', color: '#f97316', group: 'Ad Type' },
      { name: 'Static', color: '#3b82f6', group: 'Ad Type' },
      { name: 'Competitor', color: '#8b5cf6', group: null },
      { name: 'Insurance', color: '#22c55e', group: 'Vertical' },
      { name: 'E-Commerce', color: '#ec4899', group: 'Vertical' },
      { name: 'SaaS', color: '#06b6d4', group: 'Vertical' },
      { name: 'Great Hook', color: '#f59e0b', group: null },
    ].map((tag) =>
      prisma.tag.upsert({
        where: { name_userId: { name: tag.name, userId: user.id } },
        update: {},
        create: { ...tag, userId: user.id },
      })
    )
  )
  console.log(`Created ${tags.length} tags`)

  // Create folders
  const folder1 = await prisma.folder.create({
    data: { name: 'Competitors', userId: user.id },
  })
  const folder2 = await prisma.folder.create({
    data: { name: 'Inspiration', userId: user.id },
  })
  const folder3 = await prisma.folder.create({
    data: { name: 'Q1 Campaigns', userId: user.id, parentFolderId: folder1.id },
  })
  console.log('Created 3 folders')

  // Create sample ads
  const sampleAds = [
    {
      adLibraryId: '123456789',
      advertiserName: 'Nike',
      pageId: 'nike',
      format: 'video',
      status: 'active',
      primaryText: 'Just Do It. The new Air Max collection is here. Push your limits with innovative cushioning technology designed for every athlete.',
      headline: 'Air Max 2025 Collection',
      description: 'Shop the latest Nike Air Max shoes with free shipping.',
      ctaType: 'Shop Now',
      destinationUrl: 'https://nike.com/air-max',
      platforms: JSON.stringify(['Facebook', 'Instagram']),
      countries: JSON.stringify(['US', 'UK']),
      adStartDate: new Date('2025-01-15'),
      starred: true,
    },
    {
      adLibraryId: '234567890',
      advertiserName: 'Apple',
      pageId: 'apple',
      format: 'image',
      status: 'active',
      primaryText: 'iPhone 16 Pro. The most powerful iPhone ever. Capture stunning photos with the 48MP camera system.',
      headline: 'iPhone 16 Pro',
      description: 'Starting at $999. Trade in your old phone for credit.',
      ctaType: 'Learn More',
      destinationUrl: 'https://apple.com/iphone-16-pro',
      platforms: JSON.stringify(['Facebook', 'Instagram', 'Messenger']),
      countries: JSON.stringify(['US']),
      adStartDate: new Date('2025-02-01'),
      starred: false,
    },
    {
      adLibraryId: '345678901',
      advertiserName: 'Shopify',
      pageId: 'shopify',
      format: 'carousel',
      status: 'active',
      primaryText: 'Start your online store today. No coding required. Join millions of entrepreneurs who trust Shopify.',
      headline: 'Build Your Dream Store',
      description: 'Free trial for 14 days. No credit card required.',
      ctaType: 'Sign Up',
      destinationUrl: 'https://shopify.com/start',
      platforms: JSON.stringify(['Facebook']),
      countries: JSON.stringify(['US', 'CA']),
      adStartDate: new Date('2025-01-20'),
      starred: true,
    },
    {
      adLibraryId: '456789012',
      advertiserName: 'Tesla',
      pageId: 'tesla',
      format: 'video',
      status: 'active',
      primaryText: 'Model Y — The SUV for the future. 0-60 in 3.5 seconds. 330 miles of range.',
      headline: 'Order Model Y Today',
      description: 'Starting at $44,990. Configure yours now.',
      ctaType: 'Learn More',
      destinationUrl: 'https://tesla.com/model-y',
      platforms: JSON.stringify(['Facebook', 'Instagram']),
      countries: JSON.stringify(['US']),
      adStartDate: new Date('2025-01-10'),
      starred: false,
    },
    {
      adLibraryId: '567890123',
      advertiserName: 'Airbnb',
      pageId: 'airbnb',
      format: 'image',
      status: 'inactive',
      primaryText: 'Make your home work for you. List your space on Airbnb and start earning. Average hosts earn $924/month.',
      headline: 'Become a Host',
      description: 'It\'s free to list. You set the price.',
      ctaType: 'Sign Up',
      destinationUrl: 'https://airbnb.com/host',
      platforms: JSON.stringify(['Facebook', 'Instagram']),
      countries: JSON.stringify(['US', 'UK', 'AU']),
      adStartDate: new Date('2024-12-01'),
      adEndDate: new Date('2025-01-31'),
      starred: false,
    },
    {
      adLibraryId: '678901234',
      advertiserName: 'HubSpot',
      pageId: 'hubspot',
      format: 'image',
      status: 'active',
      primaryText: 'The CRM platform that grows with you. Free tools to get started. Premium plans that scale.',
      headline: 'Start Free CRM Today',
      description: 'Join 194,000+ customers worldwide.',
      ctaType: 'Sign Up',
      destinationUrl: 'https://hubspot.com/crm',
      platforms: JSON.stringify(['Facebook']),
      countries: JSON.stringify(['US']),
      adStartDate: new Date('2025-02-01'),
      starred: false,
    },
  ]

  for (const adData of sampleAds) {
    const ad = await prisma.ad.create({
      data: {
        ...adData,
        savedById: user.id,
      },
    })

    // Add to first folder
    await prisma.adFolder.create({
      data: { adId: ad.id, folderId: folder2.id },
    })

    // Add some tags
    const tagIndex = sampleAds.indexOf(adData) % tags.length
    await prisma.adTag.create({
      data: { adId: ad.id, tagId: tags[tagIndex].id },
    })
  }
  console.log(`Created ${sampleAds.length} sample ads`)

  // Add carousel cards for Shopify ad
  const shopifyAd = await prisma.ad.findFirst({
    where: { adLibraryId: '345678901' },
  })
  if (shopifyAd) {
    await prisma.carouselCard.createMany({
      data: [
        { adId: shopifyAd.id, position: 0, headline: 'Online Store', description: 'Beautiful templates' },
        { adId: shopifyAd.id, position: 1, headline: 'Payments', description: 'Accept any payment' },
        { adId: shopifyAd.id, position: 2, headline: 'Marketing', description: 'Built-in SEO tools' },
      ],
    })
    console.log('Created carousel cards')
  }

  // Add a note
  const nikeAd = await prisma.ad.findFirst({
    where: { adLibraryId: '123456789' },
  })
  if (nikeAd) {
    await prisma.note.create({
      data: {
        adId: nikeAd.id,
        userId: user.id,
        content: 'Great hook — test this angle for our next campaign. The "push your limits" messaging resonates well.',
      },
    })
    console.log('Created sample note')
  }

  console.log('Seed complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
