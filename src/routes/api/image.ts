// app/server/analyze.ts
import { createServerFn } from '@tanstack/react-start';
import { useChat } from '@tanstack/ai-react';
import type { ImagePart } from '@tanstack/ai';
import { openaiText } from '@tanstack/ai-openai';

interface AnalyzePayload {
  base64Data: string
  mimeType: string
  prompt: string
}

export const analyzeImageFn = createServerFn({ method: 'POST' }).validator((data: string) => data).handler(async ({ data }) => {
    return { data }
});
