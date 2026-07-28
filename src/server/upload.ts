import { createServerFn } from '@tanstack/react-start'
import { chat } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'

export const uploadImage = createServerFn({
    method: 'POST',
})
    .validator((data: { image: string }) => data)
    .handler(async ({ data }) => {
        const image = data.image

        // Extract mimeType if the client provided a data URI (`data:<mime>;base64,...`)
        let mimeType = 'image/png'
        if (typeof image === 'string' && image.startsWith('data:')) {
            const m = image.match(/^data:([^;]+);base64,/) as RegExpMatchArray | null
            if (m && m[1]) mimeType = m[1]
        }

        // `chat()` can produce a streaming ChatStream which isn't serializable
        // for server functions. Use `stream: false` and cast the final result
        // to `any` so the handler returns JSON-serializable data.
        const response = (await chat({
            adapter: openaiText('gpt-4o'),
            stream: false,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', content: 'Please describe the contents of this image.' },
                        { type: 'image', source: { type: 'data', value: image, mimeType } },
                    ],
                },
            ],
        })) as any

        return response
    })
