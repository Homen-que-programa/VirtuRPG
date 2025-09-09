-- Tabelas para o sistema de chat

-- Tabela de salas de chat
CREATE TABLE salas_chat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campanha_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  criado_por INT NOT NULL,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id) ON DELETE CASCADE,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de mensagens de chat
CREATE TABLE mensagens_chat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sala_id INT NOT NULL,
  usuario_id INT NOT NULL,
  mensagem TEXT NOT NULL,
  enviada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sala_id) REFERENCES salas_chat(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_salas_campanha ON salas_chat(campanha_id);
CREATE INDEX idx_mensagens_sala ON mensagens_chat(sala_id);
CREATE INDEX idx_mensagens_usuario ON mensagens_chat(usuario_id);
