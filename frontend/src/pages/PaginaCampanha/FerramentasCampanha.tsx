import { useOutletContext } from 'react-router-dom';
import type { Campanha } from '../../types';

const FerramentasCampanha = () => {
  const { campanha } = useOutletContext<{ campanha: Campanha }>();
  return (
    <section id="ferramentas">
      <h3>Ferramentas de Mestre</h3>
      <p>Campanha: {campanha.nome}</p>
    </section>
  );
};

export default FerramentasCampanha;
