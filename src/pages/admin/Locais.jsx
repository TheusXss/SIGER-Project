import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  criarLocal,
  listarLocais,
  atualizarLocal,
  excluirLocal,
  TIPOS_LOCAL,
  STATUS_LOCAL,
} from '../../services/locationService'
import LocalFormModal from '../../components/admin/LocalFormModal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

const BADGE_STATUS = {
  Disponível: 'bg-success',
  Indisponível: 'bg-secondary',
  'Em manutenção': 'bg-warning text-dark',
}

export default function Locais() {
  const [locais, setLocais] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState('')

  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [localEditando, setLocalEditando] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erroFormulario, setErroFormulario] = useState('')
  const [localDescricao, setLocalDescricao] = useState(null)

  const [localExcluindo, setLocalExcluindo] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const [erroExclusao, setErroExclusao] = useState('')

  async function carregarLocais() {
    setCarregando(true)
    setErroCarregamento('')
    try {
      const dados = await listarLocais()
      setLocais(dados)
    } catch (error) {
      console.error('Erro ao carregar locais:', error)
      setErroCarregamento('Não foi possível carregar os locais. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarLocais()
  }, [])

  const locaisFiltrados = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase()

    return locais.filter((local) => {
      const combinaBusca = !buscaNormalizada || local.name?.toLowerCase().includes(buscaNormalizada)
      const combinaTipo = !filtroTipo || local.type === filtroTipo
      const combinaStatus = !filtroStatus || local.status === filtroStatus
      return combinaBusca && combinaTipo && combinaStatus
    })
  }, [locais, busca, filtroTipo, filtroStatus])

  function abrirNovo() {
    setLocalEditando(null)
    setErroFormulario('')
    setModalAberto(true)
  }

  function abrirEdicao(local) {
    setLocalEditando(local)
    setErroFormulario('')
    setModalAberto(true)
  }

  function abrirDescricao(local) {
    setLocalDescricao(local)
  }

  async function handleSalvar(dadosFormulario) {
    setSalvando(true)
    setErroFormulario('')
    try {
      if (localEditando) {
        await atualizarLocal(localEditando.id, dadosFormulario)
      } else {
        await criarLocal(dadosFormulario)
      }
      setModalAberto(false)
      await carregarLocais()
    } catch (error) {
      console.error('Erro ao salvar local:', error)
      setErroFormulario('Não foi possível salvar o local. Verifique os dados e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  function pedirExclusao(local) {
    setLocalExcluindo(local)
    setErroExclusao('')
  }

  async function confirmarExclusao() {
    if (!localExcluindo) return
    setExcluindo(true)
    setErroExclusao('')
    try {
      await excluirLocal(localExcluindo.id)
      setLocalExcluindo(null)
      await carregarLocais()
    } catch (error) {
      console.error('Erro ao excluir local:', error)
      setErroExclusao('Não foi possível excluir o local. Tente novamente.')
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <>
      <nav className="navbar navbar-expand navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand mb-0 h1">Painel Administrativo</span>
          <Link to="/admin" className="btn btn-outline-light btn-sm">
            Voltar
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
          <h2 className="h4 mb-0">Locais cadastrados</h2>
          <button type="button" className="btn btn-primary" onClick={abrirNovo}>
            Adicionar Opção de Reserva
          </button>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-5">
                <label htmlFor="busca" className="form-label">
                  Pesquisar por nome
                </label>
                <input
                  id="busca"
                  type="text"
                  className="form-control"
                  placeholder="Ex: Laboratório de Informática"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label htmlFor="filtro-tipo" className="form-label">
                  Tipo
                </label>
                <select
                  id="filtro-tipo"
                  className="form-select"
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="">Todos</option>
                  {TIPOS_LOCAL.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label htmlFor="filtro-status" className="form-label">
                  Status
                </label>
                <select
                  id="filtro-status"
                  className="form-select"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <option value="">Todos</option>
                  {STATUS_LOCAL.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {erroCarregamento && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
            <span>{erroCarregamento}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={carregarLocais}>
              Tentar novamente
            </button>
          </div>
        )}

        {carregando ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        ) : !erroCarregamento && locaisFiltrados.length === 0 ? (
          <div className="card">
            <div className="card-body text-center text-muted py-5">
              {locais.length === 0
                ? 'Nenhum local cadastrado.'
                : 'Nenhum local encontrado para os filtros selecionados.'}
            </div>
          </div>
        ) : (
          !erroCarregamento && (
            <div className="card">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>Bloco</th>
                      <th>Andar</th>
                      <th>Capacidade</th>
                      <th>Status</th>
                      <th>Descrição</th>
                      <th className="text-end">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locaisFiltrados.map((local) => (
                      <tr key={local.id}>
                        <td className="fw-semibold">{local.name}</td>
                        <td>{local.type}</td>
                        <td>{local.building || '-'}</td>
                        <td>{local.floor ?? '-'}</td>
                        <td>{local.capacity}</td>
                        <td>
                          <span className={`badge ${BADGE_STATUS[local.status] || 'bg-secondary'}`}>
                            {local.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info"
                            onClick={() => abrirDescricao(local)}
                          >
                            Ver descrição
                          </button>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => abrirEdicao(local)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => pedirExclusao(local)}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      <LocalFormModal
        aberto={modalAberto}
        local={localEditando}
        salvando={salvando}
        erro={erroFormulario}
        onCancelar={() => setModalAberto(false)}
        onSalvar={handleSalvar}
      />

      {localDescricao && (
        <>
          <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Descrição do local</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setLocalDescricao(null)}
                    aria-label="Fechar"
                  />
                </div>
                <div className="modal-body">
                  <h6 className="mb-3">{localDescricao.name}</h6>
                  {localDescricao.description?.trim() ? (
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {localDescricao.description}
                    </p>
                  ) : (
                    <p className="text-muted mb-0">Nenhuma descrição cadastrada para este local.</p>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-primary" onClick={() => setLocalDescricao(null)}>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      <ConfirmDialog
        aberto={!!localExcluindo}
        titulo="Excluir local"
        mensagem={`Tem certeza de que deseja excluir "${localExcluindo?.name}"? Essa ação não poderá ser desfeita.`}
        erro={erroExclusao}
        confirmando={excluindo}
        onCancelar={() => setLocalExcluindo(null)}
        onConfirmar={confirmarExclusao}
      />
    </>
  )
}
