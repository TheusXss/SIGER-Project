import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obterImagensLocal } from '../services/locationService'

const STATUS_CLASSES = {
	Disponível: 'bg-success',
	Indisponível: 'bg-secondary',
	'Em manutenção': 'bg-warning text-dark',
}

function ListaDetalhes({ titulo, itens, vazio }) {
	return (
		<section className="location-info-section">
			<h2 className="h6 location-section-title">{titulo}</h2>
			{itens.length > 0 ? (
				<ul className="location-feature-list">
					{itens.map((item) => <li key={item}>{item}</li>)}
				</ul>
			) : (
				<p className="text-muted mb-0 location-empty-value">{vazio}</p>
			)}
		</section>
	)
}

function GaleriaLocal({ imagens, nome }) {
	const [indiceAtivo, setIndiceAtivo] = useState(0)

	if (imagens.length === 0) {
		return <div className="location-gallery-empty">Sem imagem cadastrada</div>
	}

	const variasImagens = imagens.length > 1
	const imagemAtual = imagens[indiceAtivo]

	function passarImagem(direcao) {
		setIndiceAtivo((indice) => (indice + direcao + imagens.length) % imagens.length)
	}

	return (
		<div className="location-carousel" aria-label={`Fotos de ${nome}`}>
			<div className="location-carousel-stage">
				<img src={imagemAtual.url} alt={`Imagem ${indiceAtivo + 1} de ${nome}`} />
				{variasImagens && (
					<>
						<button
							type="button"
							className="location-carousel-control location-carousel-previous"
							aria-label="Ver foto anterior"
							onClick={() => passarImagem(-1)}
						>
							<span aria-hidden="true">‹</span>
						</button>
						<button
							type="button"
							className="location-carousel-control location-carousel-next"
							aria-label="Ver próxima foto"
							onClick={() => passarImagem(1)}
						>
							<span aria-hidden="true">›</span>
						</button>
						<span className="location-carousel-count" aria-live="polite">
							{indiceAtivo + 1} / {imagens.length}
						</span>
					</>
				)}
			</div>
			{variasImagens && (
				<div className="location-carousel-pagination" role="group" aria-label="Selecionar foto">
					{imagens.map((imagem, index) => (
						<button
							key={`${imagem.publicId || imagem.url}-${index}`}
							type="button"
							className={`location-carousel-dot ${index === indiceAtivo ? 'active' : ''}`}
							aria-label={`Mostrar foto ${index + 1}`}
							aria-pressed={index === indiceAtivo}
							onClick={() => setIndiceAtivo(index)}
						/>
					))}
				</div>
			)}
		</div>
	)
}

function LocaisDetalhe({ locais, carregando, erro, onTentarNovamente, onReservar }) {
	const { localId } = useParams()
	const local = locais.find((item) => item.id === localId)

	if (carregando) {
		return (
			<div className="d-flex justify-content-center py-5" role="status" aria-label="Carregando detalhes do local">
				<span className="spinner-border text-primary" />
			</div>
		)
	}

	if (erro) {
		return (
			<div className="alert alert-danger" role="alert">
				<p className="mb-3">{erro}</p>
				<button type="button" className="btn btn-outline-danger" onClick={onTentarNovamente}>
					Tentar novamente
				</button>
			</div>
		)
	}

	if (!local) {
		return (
			<div className="py-3">
				<p className="text-muted">Este local não foi encontrado.</p>
				<Link to="/dashboard/locais" className="btn btn-outline-primary">Voltar para locais</Link>
			</div>
		)
	}

	const disponivel = local.status === 'Disponível'
	const imagens = obterImagensLocal(local)

	return (
		<article className="location-detail">
			<Link to="/dashboard/locais" className="location-detail-back">
				Voltar para locais
			</Link>

			<header className="location-detail-heading">
				<div className="location-detail-title">
					<span className="eyebrow">{local.type || 'Espaço'}</span>
					<h1>{local.name}</h1>
				</div>
				<span className={`badge ${STATUS_CLASSES[local.status] || 'bg-secondary'}`}>
					{local.status || 'Status não informado'}
				</span>
			</header>

			<div className="location-detail-layout">
				<div className="location-detail-media">
					<GaleriaLocal key={local.id} imagens={imagens} nome={local.name} />
				</div>

				<aside className="location-reservation-panel">
					<h2 className="h6 location-section-title">Resumo do local</h2>
					<dl className="location-facts">
						<div className="location-fact">
							<dt>Bloco</dt>
							<dd>{local.building || 'Não informado'}</dd>
						</div>
						<div className="location-fact">
							<dt>Andar</dt>
							<dd>{local.floor ?? 'Não informado'}</dd>
						</div>
						<div className="location-fact">
							<dt>Capacidade</dt>
							<dd>{local.capacity ? `${local.capacity} pessoas` : 'Não informada'}</dd>
						</div>
					</dl>
					<button
						type="button"
						className="btn btn-primary w-100"
						disabled={!disponivel}
						onClick={() => onReservar(local.id)}
					>
						{disponivel ? 'Reservar este local' : 'Local indisponível para reserva'}
					</button>
				</aside>
			</div>

			<div className="location-detail-info">
				<section className="location-description">
					<h2 className="h6 location-section-title">Descrição</h2>
					<p className="mb-0">
						{local.description?.trim() || 'Nenhuma descrição cadastrada.'}
					</p>
				</section>
				<ListaDetalhes
					titulo="Acessibilidade"
					itens={Array.isArray(local.accessibility) ? local.accessibility : []}
					vazio="Nenhum item de acessibilidade informado."
				/>
				<ListaDetalhes
					titulo="Equipamentos e recursos"
					itens={Array.isArray(local.resources) ? local.resources : []}
					vazio="Nenhum equipamento ou recurso informado."
				/>
			</div>
		</article>
	)
}

export default LocaisDetalhe
