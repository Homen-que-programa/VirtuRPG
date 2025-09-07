import { useEffect, useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import './Campanhas.css';

interface Campanha {
    id: number;
    nome: string;
    descricao: string;
    mestre: string;
}

const Campanhas = () => {
    const { accessToken } = useAuth(); // ✅ pega token do contexto
    const [campanhas, setCampanhas] = useState<Campanha[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sendingId, setSendingId] = useState<number | null>(null);
    const [mensagens, setMensagens] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        const fetchCampanhas = async () => {
            setLoading(true);
            try {
                const res = await fetch('http://localhost:3000/campanhas', {
                    headers: {
                        Authorization: accessToken ? `Bearer ${accessToken}` : "",
                    },
                });

                if (!res.ok) throw new Error(`Erro ao buscar campanhas: ${res.statusText}`);
                const data = await res.json();
                setCampanhas(data);
            } catch (err: any) {
                setError(err.message || 'Erro desconhecido');
            } finally {
                setLoading(false);
            }
        };

        fetchCampanhas();
    }, [accessToken]); // ✅ refetch se accessToken mudar

    const entrarNaCampanha = async (campanhaId: number) => {
        if (!accessToken) {
            alert("Você precisa estar logado para entrar na campanha.");
            return;
        }

        const decoded: any = JSON.parse(atob(accessToken.split('.')[1])); // decodifica JWT
        const usuarioId = decoded.id;
        const mensagem = mensagens[campanhaId] || "";

        try {
            setSendingId(campanhaId);

            const res = await fetch(`http://localhost:3000/campanhas/${campanhaId}/entrar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ usuarioId, mensagem }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("Pedido enviado com sucesso!");
                setMensagens(prev => ({ ...prev, [campanhaId]: "" }));
            } else {
                alert(`Erro: ${data.error || data.message}`);
            }
        } catch (err: any) {
            console.error(err);
            alert(`Erro desconhecido: ${err.message}`);
        } finally {
            setSendingId(null);
        }
    };

    if (loading) return <p>Carregando campanhas...</p>;
    if (error) return <p>Erro: {error}</p>;

    return (
        <div className="campanhas-container">
            <h2>Todas as Campanhas</h2>
            {campanhas.length === 0 ? (
                <p className="empty-msg">Nenhuma campanha disponível.</p>
            ) : (
                <ul className="campanhas-list">
                    {campanhas.map(c => (
                        <li key={c.id} className="campanha-card">
                            <h3>{c.nome}</h3>
                            <p>{c.descricao}</p>
                            <p>Mestre: {c.mestre}</p>

                            <textarea
                                placeholder="Escreva uma mensagem ao mestre..."
                                value={mensagens[c.id] || ""}
                                onChange={e =>
                                    setMensagens(prev => ({ ...prev, [c.id]: e.target.value }))
                                }
                            />

                            <button
                                onClick={() => entrarNaCampanha(c.id)}
                                disabled={sendingId === c.id}
                            >
                                {sendingId === c.id ? 'Enviando...' : 'Pedir para entrar'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Campanhas;