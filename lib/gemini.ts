import { z } from 'zod';

const GeminiModelSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  supportedGenerationMethods: z.array(z.string()).optional()
});

export interface GeminiModelInfo {
  name: string;
  displayName?: string;
  recommended: boolean;
}

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

function normalizeModelName(name: string) {
  return name.replace('models/', '');
}

export async function fetchGeminiModels(apiKey: string): Promise<GeminiModelInfo[]> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`Gemini models request failed: ${res.status}`);
  }

  const raw = await res.json();
  const list = z.array(GeminiModelSchema).parse(raw.models ?? []);
  const filtered = list
    .filter((model) => (model.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((model) => ({
      name: normalizeModelName(model.name),
      displayName: model.displayName,
      recommended: false
    }));

  const recommendIndex = filtered.findIndex((m) => m.name.includes('2.0-flash'));
  if (recommendIndex >= 0) {
    filtered[recommendIndex].recommended = true;
  } else if (filtered.length > 0) {
    filtered[0].recommended = true;
  }

  return filtered;
}

export async function validateGeminiKey(apiKey: string) {
  const models = await fetchGeminiModels(apiKey);
  return { valid: models.length > 0, models };
}

async function callGemini(params: {
  apiKey: string;
  model: string;
  parts: GeminiPart[];
  responseMimeType?: string;
  temperature?: number;
}) {
  const started = Date.now();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: params.parts }],
        generationConfig: {
          temperature: params.temperature ?? 0.4,
          topP: 0.9,
          ...(params.responseMimeType ? { responseMimeType: params.responseMimeType } : {})
        }
      })
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini generate failed: ${res.status} ${text}`);
  }

  const payload = await res.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned empty content');
  }

  return { text, latencyMs: Date.now() - started };
}

export async function streamGeminiText(params: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:streamGenerateContent?alt=sse&key=${params.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: params.prompt }] }],
        generationConfig: {
          temperature: 0.55,
          topP: 0.9,
          responseMimeType: 'text/plain'
        }
      })
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini stream failed: ${res.status} ${text}`);
  }

  if (!res.body) {
    throw new Error('Gemini stream body is empty');
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const source = res.body.getReader();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = '';

      const flushEvent = (eventText: string) => {
        const lines = eventText.split('\n').filter((line) => line.startsWith('data: '));
        for (const line of lines) {
          const payloadText = line.slice(6).trim();
          if (!payloadText || payloadText === '[DONE]') continue;

          const payload = JSON.parse(payloadText);
          const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      };

      try {
        while (true) {
          const { value, done } = await source.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';
          for (const event of events) {
            flushEvent(event);
          }
        }

        if (buffer.trim()) {
          flushEvent(buffer);
        }
      } catch (error) {
        controller.error(error);
        return;
      }

      controller.close();
    }
  });
}

export async function generateGeminiJson<T>(params: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<{ data: T; rawText: string; latencyMs: number }> {
  const result = await callGemini({
    apiKey: params.apiKey,
    model: params.model,
    parts: [{ text: params.prompt }],
    responseMimeType: 'application/json'
  });

  let parsed: T;
  try {
    parsed = JSON.parse(result.text) as T;
  } catch {
    throw new Error(`Gemini returned non-json output: ${result.text.slice(0, 120)}`);
  }

  return { data: parsed, rawText: result.text, latencyMs: result.latencyMs };
}

export async function generateGeminiText(params: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<{ text: string; latencyMs: number }> {
  return callGemini({
    apiKey: params.apiKey,
    model: params.model,
    parts: [{ text: params.prompt }],
    responseMimeType: 'text/plain'
  });
}

export async function transcribeGeminiAudio(params: {
  apiKey: string;
  model: string;
  prompt: string;
  mimeType: string;
  base64Data: string;
}): Promise<{ text: string; latencyMs: number }> {
  return callGemini({
    apiKey: params.apiKey,
    model: params.model,
    parts: [{ text: params.prompt }, { inlineData: { mimeType: params.mimeType, data: params.base64Data } }],
    responseMimeType: 'text/plain',
    temperature: 0.2
  });
}
