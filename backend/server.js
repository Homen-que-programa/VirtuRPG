import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const SECRET = process.env.JWT_SECRET || "segredo_super_secreto";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

// 🔹 __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const db = pool;

// =================== MIDDLEWARE ===================
app.use(cors({
  origin: NODE_ENV === "development" ? "http://localhost:5173" : "*",
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
    origin: NODE_ENV === "development" ? "http://localhost:5173" : "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", socket => {
  console.log("Novo cliente conectado:", socket.id);

  socket.on("entrarSalaUsuario", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Usuário ${userId} entrou na sala user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

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

    const [rows] = await db.query(
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
      [usuarioId]
    );

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
    await db.query("UPDATE notificacoes SET lida = TRUE WHERE id = ?", [id]);
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

    await db.query(
      "INSERT INTO notificacoes (usuario_id, tipo, mensagem) VALUES (?, ?, ?)",
      [usuarioId, tipo || 'geral', mensagem]
    );

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
    const [usuarios] = await pool.query(
      "SELECT * FROM usuarios WHERE id = ?",
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.status(201).json({ message: "Usuario encontrado com sucesso", usuario: usuarios[0] });
  } catch (error) {
    console.error("Erro ao procurar usuário:", error);
    res.status(500).json({ error: "Erro ao procurar usuário" });
  }
});

// Listar campanhas
app.get('/campanhas', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.nome, c.descricao,
              GROUP_CONCAT(u.nome SEPARATOR ', ') AS mestres
       FROM campanhas c
       LEFT JOIN usuarios_campanhas uc 
         ON c.id = uc.campanha_id AND uc.papel = 'mestre'
       LEFT JOIN usuarios u ON uc.usuario_id = u.id
       GROUP BY c.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor', error: err.message });
  }
});

// Entrar em uma campanha
app.post('/campanhas/:id/entrar', async (req, res) => {
  try {
    const campanhaId = Number(req.params.id);
    const { usuarioId, mensagem } = req.body;

    if (!usuarioId) return res.status(400).json({ error: "usuarioId é obrigatório" });
    if (!mensagem || mensagem.trim() === "") return res.status(400).json({ error: "Mensagem obrigatória" });

    // Inserir pedido na tabela de pedidos
    await db.query(
      "INSERT INTO pedidos_campanha (campanha_id, usuario_id) VALUES (?, ?)",
      [campanhaId, usuarioId]
    );

    // Buscar dados do usuário que fez o pedido
    const [usuarioRows] = await db.query(
      "SELECT nome, apelido FROM usuarios WHERE id = ?",
      [usuarioId]
    );

    if (!usuarioRows.length)
      return res.status(404).json({ error: "Usuário não encontrado" });

    const usuario = usuarioRows[0];

    // Buscar todos os mestres da campanha
    const [mestresRows] = await db.query(
      `SELECT usuario_id FROM usuarios_campanhas 
       WHERE campanha_id = ? AND papel = 'mestre'`,
      [campanhaId]
    );

    if (!mestresRows.length)
      return res.status(404).json({ error: "Nenhum mestre encontrado para esta campanha" });

    // Buscar dados da campanha
    const [campanhaRows] = await db.query(
      "SELECT nome FROM campanhas WHERE id = ?",
      [campanhaId]
    );

    if (!campanhaRows.length)
      return res.status(404).json({ error: "Campanha não encontrada" });

    // Criar notificação para cada mestre
    for (const mestre of mestresRows) {
      const [notifResult] = await db.query(
        "INSERT INTO notificacoes (usuario_id, usuario_id_referencia, campanha_id, tipo, mensagem) VALUES (?, ?, ?, 'pedido', ?)",
        [mestre.usuario_id, usuarioId, campanhaId, mensagem]
      );

      const notifId = notifResult.insertId;

      // Buscar a notificação recém-criada já com os dados necessários
      const [notificacaoRows] = await db.query(
        `SELECT n.id, n.tipo, n.mensagem, n.lida, n.criada_em,
            u.id AS usuarioId, u.nome AS usuarioNome, u.apelido AS usuarioApelido,
            c.id AS campanhaId, c.nome AS campanhaNome,
            n.usuario_id AS usuarioIdDestino,
            n.usuario_id_referencia AS usuarioIdReferencia
        FROM notificacoes n
        LEFT JOIN usuarios u ON u.id = n.usuario_id_referencia
        LEFT JOIN campanhas c ON c.id = n.campanha_id
        WHERE n.id = ?`,
        [notifId]
      );

      const novaNotificacao = notificacaoRows[0];

      if (req.io) {
        req.io.to(`user_${mestre.usuario_id}`).emit('novaNotificacao', novaNotificacao);
      }
    }

    res.json({ success: true, message: "Pedido enviado aos mestres com sucesso" });

  } catch (err) {
    console.error("Erro /campanhas/:id/entrar:", err);
    res.status(500).json({ error: err.sqlMessage || err.message });
  }
});

// Aceitar pedido de usuário em campanha
app.post('/campanhas/:id/aceitar-pedido', async (req, res) => {
  try {
    const campanhaId = Number(req.params.id);
    const { usuarioId } = req.body;

    if (!usuarioId) return res.status(400).json({ error: "usuarioId é obrigatório" });

    // Atualizar pedido
    const [result] = await db.query(
      "UPDATE pedidos_campanha SET status = 'aceito' WHERE campanha_id = ? AND usuario_id = ?",
      [campanhaId, usuarioId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Pedido não encontrado" });

    // Adicionar usuário à campanha
    await db.query(
      "INSERT INTO usuarios_campanhas (usuario_id, campanha_id, papel) VALUES (?, ?, 'jogador')",
      [usuarioId, campanhaId]
    );

    // Buscar dados do usuário e campanha
    const [usuarioRows] = await db.query(
      "SELECT nome, apelido FROM usuarios WHERE id = ?",
      [usuarioId]
    );
    const [campanhaRows] = await db.query(
      "SELECT nome FROM campanhas WHERE id = ?",
      [campanhaId]
    );

    const usuario = usuarioRows[0];
    const campanha = campanhaRows[0];

    const mensagemNotificacao = `Seu pedido para entrar na campanha foi aceito.`;

    const [notifResult] = await db.query(
      "INSERT INTO notificacoes (usuario_id, usuario_id_referencia, campanha_id, tipo, mensagem) VALUES (?, ?, ?, 'pedido_aceito', ?)",
      [usuarioId, null, campanhaId, mensagemNotificacao]
    );

    const novaNotificacao = {
      id: notifResult.insertId,
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

    const [campanhaRows] = await db.query(
      "SELECT * FROM campanhas WHERE id = ?",
      [id]
    );

    if (campanhaRows.length === 0)
      return res.status(404).json({ message: "Campanha não encontrada" });

    const campanha = campanhaRows[0];

    const [jogadoresRows] = await db.query(
      `SELECT u.nome
       FROM usuarios u
       JOIN usuarios_campanhas uc ON u.id = uc.usuario_id
       WHERE uc.campanha_id = ?`,
      [id]
    );

    campanha.jogadores = jogadoresRows.map(u => u.nome);

    res.status(200).json({ campanha });
  } catch (err) {
    console.error("Erro ao buscar campanha:", err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Criar campanha
app.post("/criar-campanha", async (req, res) => {
  try {
    const { nome, descricao, mestre, usuario_id } = req.body;
    if (!nome || !descricao || !mestre || !usuario_id) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }

    const [result] = await db.query(
      "INSERT INTO campanhas (nome, mestre, descricao) VALUES (?, ?, ?)",
      [nome, mestre, descricao]
    );

    if (!result.insertId) return res.status(500).json({ message: "Erro ao criar campanha" });

    await db.query(
      "INSERT INTO usuarios_campanhas (usuario_id, campanha_id, papel) VALUES (?, ?, 'mestre')",
      [usuario_id, result.insertId]
    );

    res.status(201).json({
      message: "Campanha criada com sucesso",
      campanhaId: result.insertId
    });
  } catch (err) {
    console.error("Erro ao criar campanha:", err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Listar campanhas de um usuário
app.post("/campanhas-do-usuario", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "id não recebido" });

    const [rows] = await db.query(
      `SELECT c.* 
       FROM campanhas c
       JOIN usuarios_campanhas uc ON c.id = uc.campanha_id
       WHERE uc.usuario_id = ?`,
      [id]
    );

    res.status(200).json({ message: "sucesso na busca", rows });
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

    const [rows] = await db.query(
      `SELECT u.id, u.nome, u.apelido, u.email
       FROM usuarios u
       JOIN usuarios_campanhas uc ON u.id = uc.usuario_id
       WHERE uc.campanha_id = ?`,
      [id]
    );

    res.status(200).json({ message: "sucesso na busca", rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// =================== ROTAS DE AUTENTICAÇÃO ===================

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
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

    await db.query("UPDATE usuarios SET refresh_token = ? WHERE id = ?", [refreshToken, user.id]);

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

    await db.query("UPDATE usuarios SET refresh_token = NULL WHERE refresh_token = ?", [refreshToken]);
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

    const [rows] = await db.query("SELECT * FROM usuarios WHERE refresh_token = ?", [refreshToken]);
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

    const [existingRows] = await db.query("SELECT id FROM usuarios WHERE email = ? OR nome = ?", [email, nome]);
    if (existingRows.length > 0) return res.status(400).json({ message: "Nome ou email já cadastrado" });

    const hashedPassword = await bcrypt.hash(senha, 10);
    const [result] = await db.query("INSERT INTO usuarios (nome, apelido, email, senha) VALUES (?, ?, ?, ?)", [nome, apelido, email, hashedPassword]);

    const userId = result.insertId;

    const accessToken = jwt.sign({ id: userId, nome, apelido, email }, SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || "refresh_secret", { expiresIn: "7d" });

    await db.query("UPDATE usuarios SET refresh_token = ? WHERE id = ?", [refreshToken, userId]);

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

    const [result] = await db.query("DELETE FROM usuarios WHERE id = ?", [userId]);
    if (result.affectedRows > 0) res.json({ message: "Conta deletada com sucesso" });
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
