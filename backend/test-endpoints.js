async function testCadastro() {
  try {
    const response = await fetch('http://localhost:3000/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Test User',
        apelido: 'testuser',
        email: 'test@example.com',
        senha: 'password123'
      })
    });
    const data = await response.json();
    console.log('POST /cadastro:', response.status, data);
  } catch (err) {
    console.error('Error testing /cadastro:', err.message);
  }
}

async function testGetCampanha() {
  try {
    const response = await fetch('http://localhost:3000/campanha/1');
    const data = await response.json();
    console.log('GET /campanha/1:', response.status, data);
  } catch (err) {
    console.error('Error testing /campanha/1:', err.message);
  }
}

testCadastro();
testGetCampanha();

if (!mensagem || !usuarioId) return res.status(400).json({ message: "Mensagem e usuarioId são obrigatórios" });

    const result = db.prepare(
      "INSERT INTO mensagens_chat (sala_id, usuario_id, mensagem) VALUES (?, ?, ?)"
    ).run([salaId, usuarioId, mensagem]);

    // Buscar a mensagem com dados do usuário
    const msgRows = db.prepare(
      `SELECT m.*, u.nome, u.apelido FROM mensagens_chat m
       JOIN usuarios u ON m.usuario_id = u.id
       WHERE m.id = ?`
    ).all([result.lastInsertRowid]);

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

    const rows = db.prepare(
      `SELECT m.*, u.nome, u.apelido FROM mensagens_chat m
       JOIN usuarios u ON m.usuario_id = u.id
       WHERE m.sala_id = ?
       ORDER BY m.enviada_em ASC`
    ).all([salaId]);