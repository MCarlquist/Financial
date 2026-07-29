import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { prisma } from '#/db'
import { ensurePrismaUser } from '#/server/user'
import { z } from 'zod'

export const SaveReceiptItemSchema = z.object({
  description: z.string().min(1, 'Item name/description is required'),
  quantity: z.number().optional().default(1),
  unitPrice: z.number().optional(),
  totalPrice: z.number(),
})

export const SaveReceiptInputSchema = z.object({
  merchantName: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  currency: z.string().default('SEK'),
  subtotal: z.number().optional(),
  taxAmount: z.number().optional(),
  tipAmount: z.number().optional(),
  totalAmount: z.number(),
  paymentMethod: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  confidenceScore: z.number().optional(),
  summary: z.string().optional(),
  items: z.array(SaveReceiptItemSchema).default([]),
  rawAIResponse: z.any().optional(),
})

export type SaveReceiptInput = z.infer<typeof SaveReceiptInputSchema>

export const saveReceipt = createServerFn({ method: 'POST' })
  .validator((data: SaveReceiptInput) => SaveReceiptInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized: You must be logged in to save receipts.')
    }

    // 1. Ensure user exists in Prisma
    await ensurePrismaUser(userId)

    // 2. Handle Merchant
    let merchantId: string | undefined = undefined
    if (data.merchantName && data.merchantName.trim()) {
      const trimmedName = data.merchantName.trim()
      const existingMerchant = await prisma.merchant.findFirst({
        where: { name: { equals: trimmedName, mode: 'insensitive' } },
      })
      if (existingMerchant) {
        merchantId = existingMerchant.id
      } else {
        const newMerchant = await prisma.merchant.create({
          data: { name: trimmedName },
        })
        merchantId = newMerchant.id
      }
    }

    // 3. Handle ProductCategory
    let categoryId: string | undefined = undefined
    if (data.category && data.category.trim()) {
      const trimmedCategory = data.category.trim()
      const existingCategory = await prisma.productCategory.findFirst({
        where: {
          name: { equals: trimmedCategory, mode: 'insensitive' },
          OR: [{ userId: userId }, { userId: null }],
        },
      })
      if (existingCategory) {
        categoryId = existingCategory.id
      } else {
        const newCategory = await prisma.productCategory.create({
          data: {
            userId: userId,
            name: trimmedCategory,
            isDefault: false,
          },
        })
        categoryId = newCategory.id
      }
    }

    // 4. Parse Purchase Date
    let purchaseDate: Date = new Date()
    if (data.date) {
      const parsedDate = new Date(data.date)
      if (!isNaN(parsedDate.getTime())) {
        purchaseDate = parsedDate
      }
    }

    // 5. Create Receipt, Items, and AIClassifications in Prisma
    const receipt = await prisma.receipt.create({
      data: {
        userId,
        merchantId,
        status: 'COMPLETED',
        source: 'IMPORT',
        total: data.totalAmount,
        subtotal: data.subtotal !== undefined ? data.subtotal : undefined,
        tax: data.taxAmount !== undefined ? data.taxAmount : undefined,
        currency: data.currency || 'SEK',
        purchaseDate: purchaseDate,
        aiConfidence: data.confidenceScore ?? 1.0,
        notes: data.notes || (data.summary ? data.summary : undefined),
        rawAIResponse: data.rawAIResponse ? (data.rawAIResponse as any) : undefined,
        items: {
          create: data.items.map((item) => ({
            name: item.description,
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice ?? item.totalPrice,
            totalPrice: item.totalPrice,
            categoryId: categoryId,
            aiClassification: {
              create: {
                predictedCategory: data.category || 'Other',
                confidence: data.confidenceScore ?? 1.0,
                reasoning: data.summary || 'Extracted via AI receipt scanner',
              },
            },
          })),
        },
      },
      include: {
        merchant: true,
        items: {
          include: {
            category: true,
            aiClassification: true,
          },
        },
      },
    })

    // Return serializable numbers for Decimals
    return {
      ...receipt,
      total: Number(receipt.total),
      subtotal: receipt.subtotal !== null ? Number(receipt.subtotal) : null,
      tax: receipt.tax !== null ? Number(receipt.tax) : null,
      items: receipt.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    }
  })

export const getReceipts = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  if (!userId) {
    return []
  }

  const receipts = await prisma.receipt.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      merchant: true,
      items: {
        include: {
          category: true,
        },
      },
    },
  })

  // Convert Prisma Decimal fields to numbers for JSON serialization
  return receipts.map((r) => ({
    ...r,
    total: Number(r.total),
    subtotal: r.subtotal !== null ? Number(r.subtotal) : null,
    tax: r.tax !== null ? Number(r.tax) : null,
    items: r.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  }))
})

export const deleteReceipt = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized: You must be logged in to delete receipts.')
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: data.id },
    })

    if (!receipt || receipt.userId !== userId) {
      throw new Error('Receipt not found or permission denied')
    }

    await prisma.receipt.delete({
      where: { id: data.id },
    })

    return { success: true }
  })
