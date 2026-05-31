import OpenAI from 'openai'
import { getOpenAIClient } from '@/lib/openaiClient'

/** OpenAI Assistants API — ID agenta iz platform.openai.com */
export function getAssistantId(): string | null {
  return process.env.OPENAI_ASSISTANT_ID?.trim() || null
}

export function assertAssistantConfigured(): void {
  if (!getAssistantId()) {
    throw new Error('OPENAI_ASSISTANT_ID environment variable is missing or empty')
  }
}

export async function createAssistantThread(
  client: OpenAI,
  userMessage: string
): Promise<string> {
  const thread = await client.beta.threads.create()
  await client.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: userMessage,
  })
  return thread.id
}

export async function appendAssistantUserMessage(
  client: OpenAI,
  threadId: string,
  content: string
): Promise<void> {
  await client.beta.threads.messages.create(threadId, {
    role: 'user',
    content,
  })
}

/** Stream enega assistant run-a; zbira besedilo v buffer (JSON načrt). */
export async function streamAssistantRunToBuffer(
  client: OpenAI,
  threadId: string,
  assistantId: string,
  onToken?: (fullBuffer: string) => void
): Promise<{ buffer: string; finishReason: string | null }> {
  let buffer = ''
  let finishReason: string | null = null

  const stream = client.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  })

  for await (const event of stream) {
    if (event.event === 'thread.message.delta') {
      const delta = event.data.delta
      for (const block of delta.content ?? []) {
        if (block.type === 'text' && 'text' in block && block.text?.value) {
          buffer += block.text.value
          onToken?.(buffer)
        }
      }
    }

    if (event.event === 'thread.run.completed') {
      finishReason = 'stop'
    }

    if (event.event === 'thread.run.incomplete') {
      const reason = event.data.incomplete_details?.reason
      finishReason = reason === 'max_completion_tokens' ? 'length' : reason ?? 'length'
    }

    if (event.event === 'thread.run.failed') {
      const msg = event.data.last_error?.message ?? 'Assistant run failed'
      throw new Error(msg)
    }

    if (event.event === 'thread.run.cancelled') {
      throw new Error('Assistant run was cancelled')
    }
  }

  return { buffer, finishReason }
}

export { getOpenAIClient }
