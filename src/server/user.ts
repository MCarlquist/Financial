import { auth, clerkClient } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'

export async function ensurePrismaUser(userId: string) {
  if (!userId) return null

  // 1. Check if user already exists in Prisma
  let dbUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!dbUser) {
    let email = `${userId}@clerk.user`
    let name: string | null = null

    try {
      const client = clerkClient()
      const clerkUser = await client.users.getUser(userId)
      if (clerkUser) {
        const primaryEmailObj = clerkUser.emailAddresses?.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )
        email =
          primaryEmailObj?.emailAddress ||
          clerkUser.emailAddresses?.[0]?.emailAddress ||
          email

        const nameParts = [clerkUser.firstName, clerkUser.lastName].filter(Boolean)
        name = nameParts.length > 0 ? nameParts.join(' ') : clerkUser.username || null
      }
    } catch (error) {
      console.error('Could not fetch Clerk user details during Prisma user creation:', error)
    }

    // Upsert to safely avoid race conditions
    dbUser = await prisma.user.upsert({
      where: { id: userId },
      update: {
        email,
        name: name ?? undefined,
      },
      create: {
        id: userId,
        email,
        name,
        currency: 'SEK',
      },
    })
  }

  return dbUser
}

export const syncCurrentUser = createServerFn({ method: 'POST' }).handler(async () => {
  const { userId } = await auth()
  if (!userId) {
    return null
  }
  return await ensurePrismaUser(userId)
})
