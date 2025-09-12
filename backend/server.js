import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from './db.js';

// backwards-compatible alias used throughout this file
const database = db;

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const SECRET = process.env.JWT_SECRET || "segredo_super_secreto";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

// 🔹 __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// =================== MIDDLEWARE ===================
app.use(cors({
  origin: NODE_ENV === "development" ? "http://localhost:5174" : "*",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

// Servir frontend em produção
if (NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../frontend/dist/index.html")));
}

// =================== SOCKET.IO ===================
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: NODE_ENV === "development" ? "http://localhost:5174" : "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", socket => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    console.log("Conexão sem token, desconectando:", socket.id);
    socket.disconnect();
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    socket.user = decoded;
    console.log("Novo cliente conectado:", socket.id, "Usuário:", decoded.id);
  } catch (err) {
    console.log("Token inválido ou expirado, desconectando:", socket.id, err.message);
    socket.disconnect();
    return;
  }

  socket.on("entrarSalaUsuario", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Usuário ${userId} entrou na sala user_${userId}`);
  });

  socket.on("entrarSalaChat", (salaId) => {
    socket.join(`sala_${salaId}`);
    console.log(`Usuário entrou na sala de chat ${salaId}`);
  });

  socket.on("sairSalaChat", (salaId) => {
    socket.leave(`sala_${salaId}`);
    console.log(`Usuário saiu da sala de chat ${salaId}`);
  });

  socket.on("join_campaign", (campaignId) => {
    socket.join(`campaign_${campaignId}`);
    console.log(`Usuário ${socket.user.id} entrou na campanha ${campaignId}`);
    emitOnlineUsers(campaignId);
  });

  socket.on("leave_campaign", (campaignId) => {
    socket.leave(`campaign_${campaignId}`);
    console.log(`Usuário ${socket.user.id} saiu da campanha ${campaignId}`);
    emitOnlineUsers(campaignId);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
    // Emit to all campaigns the user was in, but since we don't track, perhaps not necessary, or use a map.
    // For simplicity, skip for now.
  });
});

function emitOnlineUsers(campaignId) {
  const room = io.sockets.adapter.rooms.get(`campaign_${campaignId}`);
  if (room) {
    const onlineUsers = [];
    for (const socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && socket.user) {
        onlineUsers.push({ id: socket.user.id, nome: socket.user.nome, apelido: socket.user.apelido });
      }
    }
    io.to(`campaign_${campaignId}`).emit('users_online', { users: onlineUsers });
  }
}

// =================== FUNÇÃO MIDDLEWARE PARA ROTAS PRIVADAS ===================
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token não fornecido" });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado" });
    }
    return res.status(401).json({ message: "Token inválido" });
  }
}

// Helper to check if current user has one of allowed roles in a campaign
async function userHasRoleInCampaign(userId, campanhaId, allowedRoles = ['admin','mestre','dm-assistant']) {
  try {
    const rows = db.prepare('SELECT papel FROM usuarios_campanhas WHERE usuario_id = ? AND campanha_id = ?').all([userId, campanhaId]);
    if (!rows.length) return false;
    const papel = rows[0].papel;
    return allowedRoles.includes(papel);
  } catch (err) {
    console.error('Erro verificando papel do usuário:', err);
    return false;
  }
}

// =================== ROTAS DE NOTIFICAÇÕES ===================

// Listar notificações de um usuário
app.get("/notificacoes", async (req, res) => {
  try {
    console.log("Headers:", req.headers);
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token não fornecido" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);
    const usuarioId = decoded.id;
    console.log("Usuário logado ID:", usuarioId);

    const rows = database.prepare(
      `SELECT 
          n.id,
          n.tipo,
          n.mensagem,
          n.lida,
          n.criada_em,
          n.usuario_id,
          n.usuario_id_referencia,
          n.campanha_id,
          ur.nome AS usuario_nome,
          ur.apelido AS usuario_apelido,
          c.nome AS campanha_nome
      FROM notificacoes n
      LEFT JOIN usuarios ur ON n.usuario_id_referencia = ur.id
      LEFT JOIN campanhas c ON n.campanha_id = c.id
      WHERE n.usuario_id = ?
      ORDER BY n.criada_em DESC;`,
    ).all([usuarioId]);

    console.log("Notificações encontradas:", rows);
    res.json(rows);
  } catch (err) {
    console.error("Erro no endpoint /notificacoes:", err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});


// Marcar notificação como lida
app.patch("/notificacoes/:id/lida", async (req, res) => {
  try {
    const { id } = req.params;
    await database.query("UPDATE notificacoes SET lida = TRUE WHERE id = ?", [id]);
    res.json({ message: "Notificação marcada como lida" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Criar notificação
app.post("/criar-notificacoes", async (req, res) => {
  try {
    const { usuarioId, tipo, mensagem } = req.body;
    if (!usuarioId || !mensagem) return res.status(400).json({ message: "Campos obrigatórios faltando" });

    database.prepare(
      "INSERT INTO notificacoes (usuario_id, tipo, mensagem) VALUES (?, ?, ?)",
    ).run([usuarioId, tipo || 'geral', mensagem]);

    res.json({ message: "Notificação criada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// =================== ROTAS DE CAMPANHAS ===================

app.post("/procurar-usuario", async (req, res) => {
  const { id } = req.body; // receber o id no corpo da requisição

  if (!id) {
    return res.status(400).json({ error: "O id do usuário é obrigatório" });
  }

  try {
    const usuarios = database.prepare(
      "SELECT * FROM usuarios WHERE id = ?",
    ).all([id]);

    if (usuarios.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.status(200).json({ message: "Usuario encontrado com sucesso", usuario: usuarios[0] });
  } catch (error) {
    console.error("Erro ao procurar usuário:", error);
    res.status(500).json({ error: "Erro ao procurar usuário" });
  }
});

// Listar campanhas
app.get('/campanhas', async (req, res) => {
  try {
    const rows = database.prepare(
      `SELECT c.id, c.nome, c.descricao,
              GROUP_CONCAT(u.nome) AS mestres
       FROM campanhas c
       LEFT JOIN usuarios_campanhas uc 
         ON c.id = uc.campanha_id AND uc.papel = 'mestre'
       LEFT JOIN usuarios u ON uc.usuario_id = u.id
       GROUP BY c.id`
    ).all();

    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar campanhas:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Entrar em uma campanha
app.post("/campanhas/:id/entrar", async (req, res) => {
  try {
    const campanhaId = Number(req.params.id);
    const { usuarioId, mensagem } = req.body;

    if (!usuarioId) return res.status(400).json({ message: "usuarioId é obrigatório" });

    // Verificar se a campanha existe
    const campanhaRows = database.prepare("SELECT id FROM campanhas WHERE id = ?").all([campanhaId]);
    if (!campanhaRows.length) return res.status(404).json({ message: "Campanha não encontrada" });

    // Verificar se o usuário já está na campanha
    const existing = database.prepare("SELECT id FROM usuarios_campanhas WHERE usuario_id = ? AND campanha_id = ?").all([usuarioId, campanhaId]);
    if (existing.length > 0) return res.status(400).json({ message: "Usuário já está na campanha" });

    // Adicionar o usuário à campanha
    database.prepare("INSERT INTO usuarios_campanhas (usuario_id, campanha_id, papel) VALUES (?, ?, ?)").run([usuarioId, campanhaId, 'jogador']);

    // Criar notificação para os mestres
    const mestres = database.prepare(
      "SELECT usuario_id FROM usuarios_campanhas WHERE campanha_id = ? AND papel = 'mestre'",
    ).all([campanhaId]);

    for (const mestre of mestres) {
      database.prepare(
        "INSERT INTO notificacoes (usuario_id, tipo, mensagem, usuario_id_referencia, campanha_id) VALUES (?, ?, ?, ?, ?)",
      ).run([mestre.usuario_id, 'pedido_entrada', `Usuário ${usuarioId} quer entrar na campanha. Mensagem: ${mensagem || 'Nenhuma'}`, usuarioId, campanhaId]);
    }

    res.json({ message: "Pedido enviado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Aceitar pedido de usuário em campanha
app.post('/campanhas/:id/aceitar-pedido', async (req, res) => {
  try {
    const campanhaId = Number(req.params.id);
    const { usuarioId } = req.body;

    if (!usuarioId) return res.status(400).json({ error: "usuarioId é obrigatório" });

    // Atualizar pedido
    const updateResult = db.prepare(
      "UPDATE pedidos_campanha SET status = 'aceito' WHERE campanha_id = ? AND usuario_id = ?"
    ).run([campanhaId, usuarioId]);

    if (updateResult.changes === 0)
      return res.status(404).json({ error: "Pedido não encontrado" });

    // Adicionar usuário à campanha
    db.prepare(
      "INSERT INTO usuarios_campanhas (usuario_id, campanha_id, papel) VALUES (?, ?, 'jogador')"
    ).run([usuarioId, campanhaId]);

    // Buscar dados do usuário e campanha
    const usuarioRows = db.prepare(
      "SELECT nome, apelido FROM usuarios WHERE id = ?"
    ).all([usuarioId]);
    const campanhaRows = db.prepare(
      "SELECT nome FROM campanhas WHERE id = ?"
    ).all([campanhaId]);

    const usuario = usuarioRows[0];
    const campanha = campanhaRows[0];

    const mensagemNotificacao = `Seu pedido para entrar na campanha foi aceito.`;

    const notifResult = db.prepare(
      "INSERT INTO notificacoes (usuario_id, usuario_id_referencia, campanha_id, tipo, mensagem) VALUES (?, ?, ?, 'pedido_aceito', ?)"
    ).run([usuarioId, null, campanhaId, mensagemNotificacao]);

    const novaNotificacao = {
      id: notifResult.lastInsertRowid,
      usuarioId,
      usuarioReferenciaId: null,
      campanhaId,
      tipo: 'pedido_aceito',
      mensagem: mensagemNotificacao,
      usuarioNome: usuario.nome,
      usuarioApelido: usuario.apelido,
      campanhaNome: campanha.nome,
      lida: false,
      criadaEm: new Date().toISOString()
    };

    if (req.io) req.io.to(`user_${usuarioId}`).emit('novaNotificacao', novaNotificacao);

    res.json({ success: true, notificacao: novaNotificacao });

  } catch (err) {
    console.error("Erro /campanhas/:id/aceitar-pedido:", err);
    res.status(500).json({ error: err.sqlMessage || err.message });
  }
});

// Buscar campanha pelo ID
app.get("/campanha/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const campanhaRows = database.prepare("SELECT * FROM campanhas WHERE id = ?").all([id]);

    if (campanhaRows.length === 0)
      return res.status(404).json({ message: "Campanha não encontrada" });

    const campanha = campanhaRows[0];

    const participantesRows = database.prepare(
      `SELECT u.id, u.nome, u.apelido, u.imagem_url, uc.papel
       FROM usuarios u
       JOIN usuarios_campanhas uc ON u.id = uc.usuario_id
       WHERE uc.campanha_id = ?`,
    ).all([id]);
    
    campanha.participantes = participantesRows.map(u => ({
      id: u.id,
      nome: u.nome,
      apelido: u.apelido,
      papel: u.papel,
      imagem_url: u.imagem_url
    }));

    res.json({ campanha });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Atualizar metadados da campanha (notas, tags, sistema, status, imagem)
app.patch('/campanha/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
  const { notas, tags, sistema, status, imagem_url, nome, descricao, sistema_id } = req.body;

  // Basic check: campanha exists
    const rows = database.prepare('SELECT id FROM campanhas WHERE id = ?').all([id]);
    if (!rows.length) return res.status(404).json({ message: 'Campanha não encontrada' });

  // Authorization: only users with roles admin/mestre/dm-assistant can update metadata
  const allowed = await userHasRoleInCampaign(req.user.id, id);
  if (!allowed) return res.status(403).json({ message: 'Permissão negada' });

  const updates = [];
  const values = [];

  if (nome !== undefined) { updates.push('nome = ?'); values.push(nome); }
  if (descricao !== undefined) { updates.push('descricao = ?'); values.push(descricao); }
  if (notas !== undefined) { updates.push('notas = ?'); values.push(notas); }
  if (tags !== undefined) { updates.push('tags = ?'); values.push(tags); }
  if (sistema_id !== undefined) { updates.push('sistema_id = ?'); values.push(sistema_id); }
  else if (sistema !== undefined) { updates.push('sistema = ?'); values.push(sistema); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (imagem_url !== undefined) { updates.push('imagem_url = ?'); values.push(imagem_url); }

  if (updates.length === 0) return res.status(400).json({ message: 'Nada para atualizar' });

    const sql = `UPDATE campanhas SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id);

    database.prepare(sql).run(values);

    const updatedRows = database.prepare('SELECT * FROM campanhas WHERE id = ?').all([id]);
    res.json({ campanha: updatedRows[0] });
  } catch (err) {
    console.error('Erro ao atualizar campanha:', err);
    res.status(500).json({ message: 'Erro no servidor', error: err.message });
  }
});

// Criar campanha
app.post("/criar-campanha", authenticateToken, async (req, res) => {
  try {
    const { nome, descricao, mestres } = req.body;
    if (!nome || !descricao) {
      return res.status(400).json({ message: "Nome e descrição são obrigatórios" });
    }
    const requesterId = Number(req.user.id);
    const mestresIds = Array.isArray(mestres) ? mestres.map(Number).filter(Boolean) : [];
    const allMestres = [...new Set([requesterId, ...mestresIds])];

    // Get the name of the first mestre (creator)
    const mestreRow = database.prepare('SELECT nome FROM usuarios WHERE id = ?').all([requesterId]);
    const mestreNome = mestreRow[0].nome;

    // Insert campaign
    const result = database.prepare('INSERT INTO campanhas (nome, mestre, descricao) VALUES (?, ?, ?)').run([nome, mestreNome, descricao]);
    const campanhaId = result.lastInsertRowid;

    // Insert mestres
    for (const mestreId of allMestres) {
      database.prepare('INSERT INTO usuarios_campanhas (usuario_id, campanha_id, papel) VALUES (?, ?, ?)').run([mestreId, campanhaId, 'mestre']);
    }

    // Return the campaign
    const campanhaRows = database.prepare('SELECT * FROM campanhas WHERE id = ?').all([campanhaId]);
    res.status(201).json({ campanhaId, campanha: campanhaRows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Listar usuários de uma campanha
app.post("/usuarios-da-campanha", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "id não recebido" });

    const rows = database.prepare(
      `SELECT u.id, u.nome, u.apelido, u.email
       FROM usuarios u
       JOIN usuarios_campanhas uc ON u.id = uc.usuario_id
       WHERE uc.campanha_id = ?`,
    ).all([id]);

    res.status(200).json({ message: "sucesso na busca", rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Listar campanhas do usuário
app.post("/campanhas-do-usuario", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "id não recebido" });

    const rows = database.prepare(
      `SELECT c.* 
       FROM campanhas c
       JOIN usuarios_campanhas uc ON c.id = uc.campanha_id
       WHERE uc.usuario_id = ?`,
    ).all([id]);

    res.status(200).json({ message: "sucesso na busca", rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Campanhas do usuário com detalhes (participantes incluídos) – reduz chamadas N+1
app.post("/campanhas-do-usuario-detalhe", authenticateToken, async (req, res) => {
  try {
    const bodyId = Number(req.body?.id);
    const requesterId = Number(req.user.id);
    const userId = bodyId || requesterId;
    if (!userId) return res.status(400).json({ message: "id não recebido" });

    // Buscar campanhas do usuário
    const campanhasRows = database.prepare(
      `SELECT c.id, c.nome, c.descricao
       FROM campanhas c
       JOIN usuarios_campanhas uc ON c.id = uc.campanha_id
       WHERE uc.usuario_id = ?`,
    ).all([userId]);

    if (!campanhasRows.length) return res.json({ campanhas: [] });

    const campanhaIds = campanhasRows.map(c => c.id);
    const placeholders = campanhaIds.map(() => '?').join(',');

    // Buscar participantes de todas as campanhas em uma consulta
    const participantesRows = database.prepare(
      `SELECT uc.campanha_id, u.id, u.nome, u.apelido, u.email, u.imagem_url, uc.papel
       FROM usuarios u
       JOIN usuarios_campanhas uc ON u.id = uc.usuario_id
       WHERE uc.campanha_id IN (${placeholders})`,
    ).all(campanhaIds);

    const byCampanha = new Map();
    for (const c of campanhasRows) {
      byCampanha.set(c.id, { campanha: { ...c, mestres: '' }, usuarios: [] });
    }

    for (const row of participantesRows) {
      const entry = byCampanha.get(row.campanha_id);
      if (!entry) continue;
      entry.usuarios.push({ id: row.id, nome: row.nome, apelido: row.apelido, email: row.email, imagem_url: row.imagem_url, papel: row.papel });
    }

    // calcular string de mestres por campanha
    for (const entry of byCampanha.values()) {
      const mestres = entry.usuarios.filter((u) => u.papel === 'mestre').map((u) => u.nome);
      entry.campanha.mestres = mestres.join(', ');
    }

    res.json({ campanhas: Array.from(byCampanha.values()) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Promover participante a mestre
app.patch('/campanhas/:id/promover', authenticateToken, async (req, res) => {
  try {
    const campanhaId = Number(req.params.id);
    const { userId } = req.body;
    if (!campanhaId || !userId) return res.status(400).json({ message: 'Parâmetros inválidos' });

    const allowed = await userHasRoleInCampaign(req.user.id, campanhaId, ['admin','mestre']);
    if (!allowed) return res.status(403).json({ message: 'Permissão negada' });

    const exists = database.prepare('SELECT 1 FROM usuarios_campanhas WHERE usuario_id = ? AND campanha_id = ?').all([userId, campanhaId]);
    if (!exists.length) return res.status(404).json({ message: 'Usuário não participa da campanha' });

    database.prepare('UPDATE usuarios_campanhas SET papel = ? WHERE usuario_id = ? AND campanha_id = ?').run(['mestre', userId, campanhaId]);
    res.json({ message: 'Usuário promovido a mestre' });
  } catch (err) {
    console.error('Erro ao promover usuário:', err);
    res.status(500).json({ message: 'Erro no servidor', error: err.message });
  }
});

// =================== ROTAS DE AUTENTICAÇÃO ===================

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const rows = database.prepare("SELECT * FROM usuarios WHERE email = ?").all([email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Usuário não encontrado" });

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) return res.status(401).json({ message: "Senha incorreta" });

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, nome: user.nome, apelido: user.apelido },
      SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "7d" });

    database.prepare("UPDATE usuarios SET refresh_token = ? WHERE id = ?").run([refreshToken, user.id]);

    res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, nome: user.nome, apelido: user.apelido } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
});

// Logout
app.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Token não informado" });

    database.prepare("UPDATE usuarios SET refresh_token = NULL WHERE refresh_token = ?").run([refreshToken]);
    res.json({ message: "Logout realizado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
});

// Refresh token
app.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Refresh token não fornecido" });

    const rows = database.prepare("SELECT * FROM usuarios WHERE refresh_token = ?").all([refreshToken]);
    const user = rows[0];
    if (!user) return res.status(403).json({ message: "Refresh token inválido" });

    try { jwt.verify(refreshToken, REFRESH_SECRET); }
    catch { return res.status(403).json({ message: "Refresh token expirado" }); }

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, nome: user.nome, apelido: user.apelido },
      SECRET,
      { expiresIn: "1h" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro no servidor" });
  }
});

// Cadastro
app.post("/cadastro", async (req, res) => {
  try {
    const { nome, apelido, email, senha } = req.body;
    if (!nome || !apelido || !email || !senha) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }

    const existingRows = database.prepare("SELECT id FROM usuarios WHERE email = ? OR nome = ?").all([email, nome]);
    if (existingRows.length > 0) return res.status(400).json({ message: "Nome ou email já cadastrado" });

    const hashedPassword = await bcrypt.hash(senha, 10);
    const result = database.prepare("INSERT INTO usuarios (nome, apelido, email, senha) VALUES (?, ?, ?, ?)").run([nome, apelido, email, hashedPassword]);

    const userId = result.lastInsertRowid;

    const accessToken = jwt.sign({ id: userId, nome, apelido, email }, SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || "refresh_secret", { expiresIn: "7d" });

    database.prepare("UPDATE usuarios SET refresh_token = ? WHERE id = ?").run([refreshToken, userId]);

    res.status(201).json({ message: "Cadastro realizado com sucesso", accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Deletar conta
app.delete("/deletar-conta", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token não fornecido" });

    const decoded = jwt.verify(token, SECRET);
    const userId = Number(decoded?.id);
    if (!userId) return res.status(400).json({ message: "ID do usuário não encontrado no token" });

    const result = database.prepare("DELETE FROM usuarios WHERE id = ?").run([userId]);
    if (result.changes > 0) res.json({ message: "Conta deletada com sucesso" });
    else res.status(404).json({ message: "Usuário não encontrado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao deletar conta" });
  }
});


// ROTAS PRIVADAS EXEMPLO
app.get("/perfil", authenticateToken, async (req, res) => {
  res.json({ message: "Acesso permitido", user: req.user });
});

// =================== INICIALIZA SERVIDOR ===================
// 🔹 INICIALIZA O SERVIDOR
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} [${NODE_ENV}]`);
});

// =================== ROTAS DE CHAT ===================

// Criar sala de chat para uma campanha
app.post("/campanhas/:id/salas", async (req, res) => {
  try {
    const campanhaId = Number(req.params.id);
    const { nome, usuarioId } = req.body;

    if (!nome || !usuarioId) return res.status(400).json({ message: "Nome da sala e usuarioId são obrigatórios" });

    const result = database.prepare(
      "INSERT INTO salas_chat (campanha_id, nome, criado_por) VALUES (?, ?, ?)",
    ).run([campanhaId, nome, usuarioId]);

    res.status(201).json({ message: "Sala criada", salaId: result.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Listar salas de uma campanha
app.get("/campanhas/:id/salas", async (req, res) => {
  try {
    const campanhaId = Number(req.params.id);

    const rows = database.prepare(
      "SELECT id, nome, criado_por, criado_em FROM salas_chat WHERE campanha_id = ? ORDER BY criado_em",
    ).all([campanhaId]);

    res.json({ salas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Enviar mensagem
app.post("/salas/:id/mensagens", async (req, res) => {
  try {
    const salaId = Number(req.params.id);
    const { usuarioId, mensagem } = req.body;

    if (!mensagem || !usuarioId) return res.status(400).json({ message: "Mensagem e usuarioId são obrigatórios" });

    const [result] = await database.query(
      "INSERT INTO mensagens_chat (sala_id, usuario_id, mensagem) VALUES (?, ?, ?)",
      [salaId, usuarioId, mensagem]
    );

    // Buscar a mensagem com dados do usuário
    const [msgRows] = await database.query(
      `SELECT m.*, u.nome, u.apelido FROM mensagens_chat m
       JOIN usuarios u ON m.usuario_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    const novaMensagem = msgRows[0];

    // Emitir via socket
    if (req.io) {
      req.io.to(`sala_${salaId}`).emit('novaMensagem', novaMensagem);
    }

    res.status(201).json(novaMensagem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Listar mensagens de uma sala
app.get("/salas/:id/mensagens", async (req, res) => {
  try {
    const salaId = Number(req.params.id);

    const [rows] = await database.query(
      `SELECT m.*, u.nome, u.apelido FROM mensagens_chat m
       JOIN usuarios u ON m.usuario_id = u.id
       WHERE m.sala_id = ?
       ORDER BY m.enviada_em ASC`,
      [salaId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});
