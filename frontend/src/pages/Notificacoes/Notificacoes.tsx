import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import { useApi } from "../../services/api";

interface Notificacao {
    id: number;
    tipo: 'pedido' | 'resposta' | 'convite' | 'geral' | 'pedido_aceito';
    mensagem: string;
    lida: boolean;
    criadaEm: string;
    campanhaId?: number;
    campanhaNome?: string;
    usuarioId?: number;
    usuarioNome?: string;
    usuarioIdDestino?: number;
    usuarioIdReferencia?: number;
}

const Notificacoes = () => {
    const { user, accessToken } = useAuth();
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [loading, setLoading] = useState(true);
    const { apiFetch } = useApi();
    const socket = useSocket(
        'http://localhost:3000',
        { token: accessToken },
        { enabled: Boolean(accessToken) }
    );

    // Buscar notificações do backend
    const fetchNotificacoes = async () => {
        setLoading(true);
        try {
            const res = await apiFetch("/notificacoes");
            if (!res.ok) throw new Error("Erro ao buscar notificações");
            const data = await res.json();

            const normalizadas = data.map((n: any) => ({
                id: n.id,
                tipo: n.tipo,
                mensagem: n.mensagem,
                lida: Boolean(n.lida),
                criadaEm: n.criada_em,
                usuarioId: n.usuario_id,
                usuarioNome: n.usuario_nome,
                usuarioApelido: n.usuario_apelido,
                campanhaId: n.campanha_id,
                campanhaNome: n.campanha_nome,
                usuarioIdReferencia: n.usuario_id_referencia,
            }));

            setNotificacoes(normalizadas);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Marcar notificação como lida
    const marcarComoLida = async (id: number) => {
        try {
            const res = await apiFetch(`/notificacoes/${id}/lida`, { method: "PATCH" });
            if (!res.ok) throw new Error("Erro ao marcar notificação");
            setNotificacoes(prev =>
                prev.map(n => (n.id === id ? { ...n, lida: true } : n))
            );
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchNotificacoes();

        if (!user?.id || !socket) return;

        // Entrar na sala específica do usuário
        socket.emit("entrarSalaUsuario", user.id);

        // Escutar notificações em tempo real
        socket.on("novaNotificacao", (notificacao: any) => {
            console.log("Nova notificação recebida:", notificacao);

            // Normalizar para o mesmo formato da API
            const normalizada: Notificacao = {
                id: notificacao.id,
                tipo: notificacao.tipo,
                mensagem: notificacao.mensagem,
                lida: Boolean(notificacao.lida),
                criadaEm: notificacao.criadaEm || notificacao.criada_em,
                usuarioId: notificacao.usuarioId || notificacao.usuario_id,
                usuarioNome: notificacao.usuarioNome || notificacao.usuario_nome,
                usuarioIdDestino: notificacao.usuarioIdDestino || notificacao.usuario_id_destino,
                campanhaId: notificacao.campanhaId || notificacao.campanha_id,
                campanhaNome: notificacao.campanhaNome || notificacao.campanha_nome,
                usuarioIdReferencia: notificacao.usuarioIdReferencia || notificacao.usuario_id_referencia,
            };

            setNotificacoes(prev => [normalizada, ...prev]);
        });

        return () => {
            socket.off("novaNotificacao");
        };
    }, [user?.id, socket]);

    const aceitarPedido = async (notificacao: Notificacao) => {
        const campanhaIdNum = Number(notificacao.campanhaId);
        const usuarioIdNum = Number(notificacao.usuarioIdReferencia);

        console.log('Enviando:', campanhaIdNum, usuarioIdNum);

        if (!campanhaIdNum || !usuarioIdNum) {
            console.error('Campos obrigatórios faltando');
            return;
        }

        try {
            const res = await apiFetch(`/campanhas/${campanhaIdNum}/aceitar-pedido`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuarioId: usuarioIdNum })
            });

            if (!res.ok) throw new Error("Erro ao aceitar pedido");

            console.log("Pedido aceito:", await res.json());

            setNotificacoes(prev =>
                prev.map(n => (n.id === notificacao.id ? { ...n, lida: true } : n))
            );

        } catch (err) {
            console.error(err);
        }
    };

    const recusarPedido = async (notificacao: Notificacao) => {
        try {
            // Marcar notificação como lida, sem inserir na campanha
            await marcarComoLida(notificacao.id);

            // Opcional: remover notificação da lista
            setNotificacoes(prev => prev.filter(n => n.id !== notificacao.id));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <p>Carregando notificações...</p>;
    if (!notificacoes.length) return <p>Nenhuma notificação.</p>;

    return (
        <div className="notificacoes-container">
            <h2>Notificações</h2>
            <ul className="notificacoes-list">
                {notificacoes.map(n => (
                    <li key={n.id} className={`notificacao-card ${n.lida ? "lida" : ""}`}>
                        <p>
                            <strong>{n.tipo.toUpperCase()}</strong>:
                            {n.tipo === "pedido"
                                ? `O usuário ${n.usuarioNome} solicitou entrar na campanha "${n.campanhaNome}". Mensagem: "${n.mensagem}"`
                                : n.mensagem
                            }
                        </p>
                        {!n.lida && n.tipo === "pedido" && (
                            <div className="acoes-pedido">
                                <button onClick={() => aceitarPedido(n)}>Aceitar</button>
                                <button onClick={() => recusarPedido(n)}>Recusar</button>
                            </div>
                        )}
                        {!n.lida && n.tipo !== "pedido" && (
                            <button onClick={() => marcarComoLida(n.id)}>Marcar como lida</button>
                        )}
                        <p className="small-muted">{new Date(n.criadaEm).toLocaleString()}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Notificacoes;
