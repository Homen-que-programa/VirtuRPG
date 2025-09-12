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
  mestres?: string | string[]; // string for list, array for individual
  jogadores?: string[];
  participantes?: Array<{ id: number; nome: string; apelido?: string; papel: string; imagem_url?: string }>;
  criado_em?: string;
  tags?: string | null; // comma separated or JSON
  sistema?: string | null;
  status?: string | null;
  imagem_url?: string | null;
  notas?: string | null;
  next_session_datetime?: string | null;
  next_session_local?: string | null;
  next_session_link?: string | null;
  sistema_id?: number | null;
}

// Relação usuário <-> campanha (opcional, se você precisar)
export interface UsuarioCampanha {
  usuario: User;
  campanha: Campanha;
  papel?: string; // ex: "mestre", "jogador"
}
