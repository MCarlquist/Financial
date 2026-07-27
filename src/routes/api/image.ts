import { createOpenRouterText } from '@tanstack/ai-openrouter'
import { createFileRoute } from '@tanstack/react-router'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import type { ImagePart } from '@tanstack/ai'
import fs from 'node:fs'
import path from 'node:path'

export const Route = createFileRoute('/api/image')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const filePath = body.filepath
          if (!filePath || !fs.existsSync(filePath)) {
            return new Response(
              JSON.stringify({ error: 'Valid local filepath is required.' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            )
          }
          // Convert local file to base64
          const imageBuffer = fs.readFileSync(filePath)
          const base64Data = imageBuffer.toString('base64')
          const ext = path.extname(filePath).toLowerCase()
          const mimeMap: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
          }
          const mimeType = mimeMap[ext] || 'image/jpeg'

          // Call OpenRouter
          const openRouterAdapter = createOpenRouterText(
            'openrouter/auto',
            process.env.OPENROUTER_API_KEY!,
          )

          const aiResponse = await chat({
            adapter: openRouterAdapter,
            stream: false,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', content: 'Describe this image briefly.' },
                  {
                    type: 'image',
                    source: {
                      type: 'data',
                      value: base64Data,
                      mimeType: mimeType,
                    },
                  },
                ],
              },
            ],
          })

          return new Response(JSON.stringify({ text: aiResponse }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {}
      },
    },
  },
})
