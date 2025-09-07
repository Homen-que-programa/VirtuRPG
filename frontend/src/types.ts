// src/types.ts

// Tipo de usuário
export interface User {
  id: number;
  nome: string;
  apelido: string;
  email: string;
}

// Tipo de campanha
export interface Campanha {
  id?: number;
  nome?: string;
  descricao?: string;
  mestre?: string;
  jogadores?: string[];
}

// Relação usuário <-> campanha (opcional, se você precisar)
export interface UsuarioCampanha {
  usuario: User;
  campanha: Campanha;
  papel?: string; // ex: "mestre", "jogador"
}
