// src/utils/trpc.ts
import type { AppRouter } from '@/server/trpc/appRouter'
import { createTRPCReact } from '@trpc/react-query'

export const trpc = createTRPCReact<AppRouter>()
