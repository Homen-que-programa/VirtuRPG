import React from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Campanha } from '../../types';

const FichasCampanha = () => {
	const { campanha } = useOutletContext<{ campanha: Campanha }>();
	return (
		<section id="fichas">
			<h3>Fichas de Personagens</h3>
			<p>Campanha: {campanha.nome}</p>
		</section>
	);
};

export default FichasCampanha;
