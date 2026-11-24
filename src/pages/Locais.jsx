import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { obterImagensLocal } from '../services/locationService'

const STATUS_CLASSES = {
	Disponível: 'bg-success',
	Indisponível: 'bg-secondary',
	'Em manutenção': 'bg-warning text-dark',
}

function Locais({ locais, carregando, erro, onTentarNovamente }) {
	const [busca, setBusca] = useState('')
	const locaisFiltrados = useMemo(() => {
		const termo = busca.trim().toLocaleLowerCase('pt-BR')
		if (!termo) return locais
		return locais.filter((local) => local.name?.toLocaleLowerCase('pt-BR').includes(termo))
	}, [busca, locais])

	return (
		<section>
			<header className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
				<div>
					<span className="eyebrow">Espaços</span>
					<h1 className="h3 mb-1">Locais</h1>
					<p className="text-muted mb-0">Consulte os espaços cadastrados e suas informações.</p>
				</div>
				<div className="text-muted small">{locais.length} {locais.length === 1 ? 'local cadastrado' : 'locais cadastrados'}</div>
			</header>

			<div className="mb-4">
				<label className="form-label" htmlFor="busca-locais">Pesquisar local</label>
				<input
					id="busca-locais"
					type="search"
					className="form-control"
					placeholder="Nome do espaço"
					value={busca}
					onChange={(event) => setBusca(event.target.value)}
				/>
			</div>

			{erro && (
				<div className="alert alert-danger d-flex justify-content-between align-items-center gap-3" role="alert">
					<span>{erro}</span>
					<button type="button" className="btn btn-sm btn-outline-danger" onClick={onTentarNovamente}>
						Tentar novamente
					</button>
				</div>
			)}

			{carregando ? (
				<div className="d-flex justify-content-center py-5" role="status" aria-label="Carregando locais">
					<span className="spinner-border text-primary" />
				</div>
			) : erro ? null : locaisFiltrados.length === 0 ? (
				<div className="border rounded-3 bg-white p-4 text-center text-muted">
					{locais.length === 0 ? 'Nenhum local cadastrado.' : 'Nenhum local corresponde à pesquisa.'}
				</div>
			) : (
				<div className="row g-3">
					{locaisFiltrados.map((local) => (
						<div className="col-12 col-md-6 col-xl-4" key={local.id}>
							<article className="card h-100 overflow-hidden">
								{obterImagensLocal(local)[0]?.url ? (
									<img
										src={obterImagensLocal(local)[0].url}
										alt={`Imagem de ${local.name}`}
										className="w-100"
										style={{ height: 190, objectFit: 'cover' }}
									/>
								) : (
									<div className="d-flex align-items-center justify-content-center bg-light text-muted" style={{ height: 190 }}>
										Sem imagem cadastrada
									</div>
								)}
								<div className="card-body d-flex flex-column">
									<div className="d-flex justify-content-between align-items-start gap-2 mb-2">
										<div>
											<span className="eyebrow">{local.type || 'Espaço'}</span>
											<h2 className="h5 mb-0">{local.name}</h2>
										</div>
										<span className={`badge ${STATUS_CLASSES[local.status] || 'bg-secondary'}`}>
											{local.status || 'Status não informado'}
										</span>
									</div>
									<p className="text-muted small mb-3">
										{[local.building, local.floor !== null && local.floor !== undefined ? `${local.floor}º andar` : '']
											.filter(Boolean)
											.join(' · ') || 'Localização não informada'}
										{local.capacity ? ` · Capacidade para ${local.capacity} pessoas` : ''}
									</p>
									<p className="mb-4">
										{local.description?.trim() || 'Sem descrição cadastrada.'}
									</p>
									<Link to={`/dashboard/locais/${local.id}`} className="btn btn-outline-primary mt-auto align-self-start">
										Ver detalhes
									</Link>
								</div>
							</article>
						</div>
					))}
				</div>
			)}
		</section>
	)
}

export default Locais
