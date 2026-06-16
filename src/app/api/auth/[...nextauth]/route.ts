// src/app/api/auth/[...nextauth]/route.ts
// Rota obrigatória do Auth.js — captura todos os requests de autenticação

import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers