import { createServerFn } from '@tanstack/react-start'
import { chat } from '@tanstack/ai'
import { geminiText } from '@tanstack/ai-gemini'
import { z } from 'zod'

export const ReceiptItemSchema = z.object({
    description: z.string().describe('Item or service description'),
    quantity: z.number().optional().describe('Quantity of items purchased'),
    unitPrice: z.number().optional().describe('Price per unit'),
    totalPrice: z.number().describe('Total price for this line item'),
})

export const ReceiptAnalysisSchema = z.object({
    merchantName: z.string().describe('Name of the store, business, or vendor'),
    merchantAddress: z.string().optional().describe('Address or location of vendor if available'),
    merchantPhone: z.string().optional().describe('Phone number of vendor if available'),
    date: z.string().optional().describe('Date of transaction (YYYY-MM-DD format if available)'),
    time: z.string().optional().describe('Time of transaction if available'),
    currency: z.string().default('USD').describe('Currency symbol or ISO code (e.g. USD, EUR, SEK)'),
    subtotal: z.number().optional().describe('Subtotal amount before taxes'),
    taxAmount: z.number().optional().describe('Total tax or VAT amount'),
    tipAmount: z.number().optional().describe('Tip or gratuity amount'),
    totalAmount: z.number().describe('Total amount paid'),
    paymentMethod: z.string().optional().describe('Payment method (e.g. Credit Card, Cash, Apple Pay)'),
    category: z.enum([
        'Dining & Food',
        'Groceries',
        'Transportation & Fuel',
        'Shopping & Retail',
        'Utilities & Bills',
        'Entertainment',
        'Travel',
        'Healthcare',
        'Services',
        'Other'
    ]).describe('Category classification for this receipt'),
    items: z.array(ReceiptItemSchema).describe('List of individual items on the receipt'),
    confidenceScore: z.number().min(0).max(1).describe('Confidence level (0 to 1) of the extracted receipt data'),
    summary: z.string().describe('Brief 1-2 sentence overview of the receipt analysis'),
})

export type ReceiptAnalysis = z.infer<typeof ReceiptAnalysisSchema>

export const uploadImage = createServerFn({
    method: 'POST',
})
    .validator((data: { image: string; prompt?: string }) => data)
    .handler(async ({ data }) => {
        const { image, prompt } = data

        if (!image) {
            throw new Error('Image base64 data is required')
        }

        // Extract mimeType and raw base64 data if client provided a data URI (`data:<mime>;base64,...`)
        let mimeType = 'image/png'
        let rawBase64 = image

        if (typeof image === 'string' && image.startsWith('data:')) {
            const matches = image.match(/^data:([^;]+);base64,(.*)$/)
            if (matches && matches.length >= 3) {
                mimeType = matches[1]
                rawBase64 = matches[2]
            }
        }

        const userPrompt = prompt || 'Analyze this receipt image and extract structured financial receipt data.'

        const response = await chat({
            adapter: geminiText('gemini-2.5-flash'),
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', content: userPrompt },
                        {
                            type: 'image',
                            source: {
                                type: 'data',
                                value: rawBase64,
                                mimeType: mimeType,
                            },
                        },
                    ],
                },
            ],
            outputSchema: ReceiptAnalysisSchema,
        })

        return response
    })

