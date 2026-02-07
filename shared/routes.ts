import { z } from 'zod';
import { insertDebateSchema, debates, messages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  debates: {
    list: {
      method: 'GET' as const,
      path: '/api/debates' as const,
      responses: {
        200: z.array(z.custom<typeof debates.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/debates' as const,
      input: insertDebateSchema,
      responses: {
        201: z.custom<typeof debates.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/debates/:id' as const,
      responses: {
        200: z.object({
          debate: z.custom<typeof debates.$inferSelect>(),
          messages: z.array(z.custom<typeof messages.$inferSelect>())
        }),
        404: errorSchemas.notFound,
      },
    },
    addMessage: {
      method: 'POST' as const,
      path: '/api/debates/:id/messages' as const,
      input: z.object({
        content: z.string()
      }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(), // Returns the AI response
        404: errorSchemas.notFound,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
