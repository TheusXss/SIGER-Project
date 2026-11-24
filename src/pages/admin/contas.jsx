import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/AdminNavbar'
import {
  calcularStatusClass,
  contarContasVerificadas,
  criarModeloCsv,
  formatarStatusConta,
  garantirTurma,
  importarContasVerificadas,
  listarContasVerificadas,
  listarTurmas,
  previsualizarImportacaoCsv,
  removerContaVerificada,
  atualizarContaVerificada,
} from '../../services/verifiedAccountService'

const PERFIS = [
  { id: 'aluno', label: 'Alunos' },
  { id: 'professor', label: 'Professores' },
]

const STATUS_OPCOES = [
  { value: '', label: 'Todos os status' },
  { value: 'nao_cadastrada', label: 'Não cadastrada' },
  { value: 'cadastrada', label: 'Cadastrada' },
]

const Contas = memo(function Contas() {
  const [perfil, setPerfil] = useState('aluno')
  const [contas, setContas] = useState([])
  const [turmas, setTurmas] = useState([])
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    alunos: 0,
    professores: 0,
    cadastradas: 0,
    naoCadastradas: 0,
  })
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [turmaFiltro, setTurmaFiltro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [tipoImportacao, setTipoImportacao] = useState('aluno')
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null)
  const [previewImportacao, setPreviewImportacao] = useState(null)
  const [processandoImportacao, setProcessandoImportacao] = useState(false)
  const [erroImportacao, setErroImportacao] = useState('')
  const [sucessoImportacao, setSucessoImportacao] = useState('')

  const [contaEmEdicao, setContaEmEdicao] = useState(null)
  const [formEdicao, setFormEdicao] = useState({
    nome: '',
    email: '',
    matricula: '',
    turma: '',
  })
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState('')

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro('')

    try {
      const [listaContas, totalEstatisticas, turmasDisponiveis] = await Promise.all([
        listarContasVerificadas(),
        contarContasVerificadas(),
        listarTurmas(),
      ])

      const contasTipo = listaContas.filter((conta) => conta.tipo === perfil)
      contasTipo.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'))

      setContas(contasTipo)
      setEstatisticas(totalEstatisticas)
      setTurmas(turmasDisponiveis)
    } catch (error) {
      console.error('Erro ao carregar contas verificadas:', error)
      setErro('Não foi possível carregar as contas verificadas. Tente novamente.')
      setContas([])
      setTurmas([])
    } finally {
      setCarregando(false)
    }
  }, [perfil])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  const contasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')

    return contas.filter((conta) => {
      const textoBusca = !termo || [conta.nome, conta.email, conta.matricula].some((valor) => String(valor || '').toLocaleLowerCase('pt-BR').includes(termo))
      const filtroStatus = !statusFiltro || conta.status === statusFiltro
      const filtroTurma = !turmaFiltro || conta.turmaId === turmaFiltro

      return textoBusca && filtroStatus && filtroTurma
    })
  }, [contas, busca, statusFiltro, turmaFiltro])

  const handleTipoPerfil = (proximoPerfil) => {
    setPerfil(proximoPerfil)
    setBusca('')
    setStatusFiltro('')
    setTurmaFiltro('')
    setPreviewImportacao(null)
    setArquivoSelecionado(null)
    setErroImportacao('')
    setSucessoImportacao('')
  }

  const handleDownloadModelo = (tipo) => {
    const csv = criarModeloCsv(tipo)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = tipo === 'aluno' ? 'modelo-alunos.csv' : 'modelo-professores.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleArquivoSelecionado = async (event) => {
    const arquivo = event.target.files?.[0]
    if (!arquivo) {
      return
    }

    setArquivoSelecionado(arquivo)
    setErroImportacao('')
    setSucessoImportacao('')

    const texto = await arquivo.text()
    const dadosPreview = await previsualizarImportacaoCsv({
      tipo: tipoImportacao,
      texto,
    })

    setPreviewImportacao(dadosPreview)
  }

  const confirmarImportacao = async () => {
    if (!previewImportacao || !previewImportacao.registros.length) {
      setErroImportacao('Selecione um arquivo CSV válido antes de confirmar.')
      return
    }

    const validos = previewImportacao.registros.filter((registro) => registro.valid)
    if (!validos.length) {
      setErroImportacao('Não há registros válidos para importar.')
      return
    }

    setProcessandoImportacao(true)
    setErroImportacao('')
    setSucessoImportacao('')

    try {
      const resultado = await importarContasVerificadas({ tipo: tipoImportacao, registros: validos })
      const totalImportados = resultado.importados.length
      const totalIgnorados = resultado.ignorados.length

      setSucessoImportacao(
        `Importação concluída: ${totalImportados} registros importados e ${totalIgnorados} ignorados.`,
      )
      setPreviewImportacao(null)
      setArquivoSelecionado(null)

      const inputArquivo = document.getElementById('arquivo-csv')
      if (inputArquivo) {
        inputArquivo.value = ''
      }

      await carregarDados()
    } catch (error) {
      console.error('Erro ao importar contas verificadas:', error)
      setErroImportacao('Não foi possível confirmar a importação. Tente novamente.')
    } finally {
      setProcessandoImportacao(false)
    }
  }

  const cancelarImportacao = () => {
    setPreviewImportacao(null)
    setArquivoSelecionado(null)
    setErroImportacao('')
    setSucessoImportacao('')
  }

  const abrirEdicaoConta = (conta) => {
    setContaEmEdicao(conta)
    setErroEdicao('')
    setFormEdicao({
      nome: conta.nome || '',
      email: conta.email || '',
      matricula: conta.matricula || '',
      turma: conta.tipo === 'aluno' ? (conta.turma || '') : '',
    })
  }

  const confirmarExclusaoConta = async (conta) => {
    const nomeConta = conta.nome || 'esta conta'
    const confirmar = window.confirm(`Deseja realmente excluir ${nomeConta}?`)
    if (!confirmar) {
      return
    }

    try {
      await removerContaVerificada(conta.id)
      setSucessoImportacao(`Conta de ${nomeConta} removida com sucesso.`)
      setErroImportacao('')
      await carregarDados()
    } catch (error) {
      console.error('Erro ao remover conta verificada:', error)
      setErroImportacao('Não foi possível remover a conta selecionada.')
    }
  }

  const salvarEdicaoConta = async () => {
    if (!contaEmEdicao) {
      return
    }

    const nome = String(formEdicao.nome || '').trim()
    const email = String(formEdicao.email || '').trim().toLowerCase()
    const matricula = String(formEdicao.matricula || '').trim()
    const turma = String(formEdicao.turma || '').trim()

    if (!nome || !email || !matricula || (contaEmEdicao.tipo === 'aluno' && !turma)) {
      setErroEdicao('Preencha nome, e-mail, matrícula e turma para continuar.')
      return
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!emailValido) {
      setErroEdicao('Informe um e-mail válido.')
      return
    }

    const conflito = contas.find((conta) => (
      conta.id !== contaEmEdicao.id &&
      conta.tipo === contaEmEdicao.tipo &&
      (
        (conta.email || '').toLowerCase() === email ||
        (conta.matricula || '').trim() === matricula
      )
    ))

    if (conflito) {
      setErroEdicao('Já existe outra conta com esse e-mail ou matrícula para o mesmo tipo.')
      return
    }

    setSalvandoEdicao(true)
    setErroEdicao('')

    try {
      const payload = {
        nome,
        email,
        matricula,
      }

      if (contaEmEdicao.tipo === 'aluno') {
        const turmaAssociada = await garantirTurma(turma)
        payload.turma = turmaAssociada.nome
        payload.turmaId = turmaAssociada.id
      } else {
        payload.turma = null
        payload.turmaId = null
      }

      await atualizarContaVerificada(contaEmEdicao.id, payload)
      setContaEmEdicao(null)
      setSucessoImportacao(`Conta de ${nome} atualizada com sucesso.`)
      setErroImportacao('')
      await carregarDados()
    } catch (error) {
      console.error('Erro ao atualizar conta verificada:', error)
      setErroEdicao('Não foi possível atualizar a conta selecionada.')
    } finally {
      setSalvandoEdicao(false)
    }
  }

  return (
    <>
      <AdminNavbar />

      <main className="container app-shell">

        <section aria-labelledby="titulo-contas">
          <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
            <div>
              <span className="eyebrow">Administração</span>
              <h1 id="titulo-contas" className="h3 mb-1">Gerenciamento de contas verificadas</h1>
              <p className="text-muted mb-0">Importe, valide e acompanhe alunos e professores previamente autorizados.</p>
            </div>
            <div className="text-muted" aria-live="polite">
              {carregando ? 'Carregando dados...' : `${contasFiltradas.length} registros exibidos`}
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6 col-xl-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="text-muted small text-uppercase">Total</div>
                  <div className="display-6 fw-bold mt-2">{estatisticas.total}</div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="text-muted small text-uppercase">Alunos</div>
                  <div className="display-6 fw-bold mt-2">{estatisticas.alunos}</div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="text-muted small text-uppercase">Professores</div>
                  <div className="display-6 fw-bold mt-2">{estatisticas.professores}</div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="text-muted small text-uppercase">Status</div>
                  <div className="small mt-2 text-success">Cadastradas: {estatisticas.cadastradas}</div>
                  <div className="small text-warning">Não cadastradas: {estatisticas.naoCadastradas}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                <div>
                  <h2 className="h5 mb-1">Importar CSV</h2>
                  <p className="text-muted mb-0">Selecione o tipo de usuário e valide os registros antes da confirmação.</p>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => handleDownloadModelo(tipoImportacao)}>
                    Baixar modelo CSV
                  </button>
                </div>
              </div>

              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label htmlFor="tipo-importacao" className="form-label">Tipo de usuário</label>
                  <select
                    id="tipo-importacao"
                    className="form-select"
                    value={tipoImportacao}
                    onChange={(event) => {
                      setTipoImportacao(event.target.value)
                      setPreviewImportacao(null)
                      setArquivoSelecionado(null)
                      setErroImportacao('')
                      setSucessoImportacao('')
                    }}
                  >
                    <option value="aluno">Aluno</option>
                    <option value="professor">Professor</option>
                  </select>
                </div>

                <div className="col-md-8">
                  <label htmlFor="arquivo-csv" className="form-label">Arquivo CSV</label>
                  <input
                    id="arquivo-csv"
                    type="file"
                    className="form-control"
                    accept=".csv,text/csv"
                    onChange={handleArquivoSelecionado}
                  />
                </div>
              </div>

              {arquivoSelecionado && (
                <div className="mt-3 small text-muted">
                  Arquivo selecionado: <strong>{arquivoSelecionado.name}</strong>
                </div>
              )}

              {erroImportacao && (
                <div className="alert alert-danger mt-3 mb-0" role="alert">{erroImportacao}</div>
              )}

              {sucessoImportacao && (
                <div className="alert alert-success mt-3 mb-0" role="alert">{sucessoImportacao}</div>
              )}

              {previewImportacao && (
                <div className="mt-4 border rounded-4 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                    <h3 className="h6 mb-0">Pré-visualização</h3>
                    <div className="small text-muted">
                      Total: {previewImportacao.total} | Válidos: {previewImportacao.validos} | Inválidos: {previewImportacao.invalidos}
                    </div>
                  </div>

                  <div className="row g-2 mb-3 text-muted small">
                    <div className="col-md-3">Duplicados: {previewImportacao.duplicados}</div>
                    <div className="col-md-3">Já existentes: {previewImportacao.jaExistentes}</div>
                    <div className="col-md-6">Arquivo: {tipoImportacao === 'aluno' ? 'Alunos' : 'Professores'}</div>
                  </div>

                  <div className="table-responsive" style={{ maxHeight: 320 }}>
                    <table className="table table-sm table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Linha</th>
                          <th>Nome</th>
                          <th>E-mail</th>
                          <th>Matrícula</th>
                          {tipoImportacao === 'aluno' && <th>Turma</th>}
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewImportacao.registros.map((registro) => (
                          <tr key={`${registro.linha}-${registro.email || registro.matricula || 'linha'}`}>
                            <td>{registro.linha}</td>
                            <td>{registro.nome || '—'}</td>
                            <td>{registro.email || '—'}</td>
                            <td>{registro.matricula || '—'}</td>
                            {tipoImportacao === 'aluno' && <td>{registro.turma || '—'}</td>}
                            <td>
                              {registro.valid ? (
                                <span className="badge bg-success">Válido</span>
                              ) : (
                                <span className="badge bg-danger-subtle text-danger">Inválido</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {previewImportacao.registros.some((registro) => registro.erros.length > 0) && (
                    <div className="mt-3">
                      <strong>Motivos:</strong>
                      <ul className="mb-0 mt-2 ps-3">
                        {previewImportacao.registros
                          .filter((registro) => registro.erros.length > 0)
                          .map((registro) => (
                            <li key={`${registro.linha}-erro`}>
                              Linha {registro.linha}: {registro.erros.join(' ')}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={cancelarImportacao}>
                      Cancelar
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" disabled={processandoImportacao} onClick={confirmarImportacao}>
                      {processandoImportacao ? 'Importando...' : 'Confirmar importação'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                <div>
                  <h2 className="h5 mb-1">Contas verificadas</h2>
                  <p className="text-muted mb-0">Consulte todos os registros importados e filtrar por tipo, turma e status.</p>
                </div>
              </div>

              <div className="tabs-inline user-tabs mb-3" role="tablist" aria-label="Categoria de contas">
                {PERFIS.map((opcao) => (
                  <button
                    key={opcao.id}
                    type="button"
                    role="tab"
                    aria-selected={perfil === opcao.id}
                    className={`tab-button ${perfil === opcao.id ? 'active' : ''}`}
                    onClick={() => handleTipoPerfil(opcao.id)}
                  >
                    {opcao.label}
                  </button>
                ))}
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label htmlFor="buscar-contas" className="form-label">Pesquisar</label>
                  <input
                    id="buscar-contas"
                    type="search"
                    className="form-control"
                    placeholder="Nome, e-mail ou matrícula"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="filtro-status" className="form-label">Status</label>
                  <select id="filtro-status" className="form-select" value={statusFiltro} onChange={(event) => setStatusFiltro(event.target.value)}>
                    {STATUS_OPCOES.map((opcao) => (
                      <option key={opcao.value || 'todos'} value={opcao.value}>{opcao.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label htmlFor="filtro-turma" className="form-label">Turma</label>
                  <select id="filtro-turma" className="form-select" value={turmaFiltro} onChange={(event) => setTurmaFiltro(event.target.value)}>
                    <option value="">Todas as turmas</option>
                    {turmas.map((turma) => (
                      <option key={turma.id} value={turma.id}>{turma.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {erro && (
                <div className="alert alert-danger" role="alert">
                  {erro}
                </div>
              )}

              {erroEdicao && (
                <div className="alert alert-danger mt-3 mb-3" role="alert">
                  {erroEdicao}
                </div>
              )}

              {carregando ? (
                <div className="py-5 text-center" role="status">
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Carregando contas...
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th scope="col">Nome</th>
                        <th scope="col">E-mail</th>
                        <th scope="col">Matrícula</th>
                        <th scope="col">Tipo</th>
                        <th scope="col">Turma</th>
                        <th scope="col">Status</th>
                        <th scope="col" className="text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contasFiltradas.map((conta) => (
                        <tr key={conta.id}>
                          <td className="fw-semibold">{conta.nome || 'Nome não informado'}</td>
                          <td>{conta.email || 'E-mail não informado'}</td>
                          <td>{conta.matricula || '—'}</td>
                          <td>{conta.tipo === 'aluno' ? 'Aluno' : 'Professor'}</td>
                          <td>{conta.tipo === 'aluno' ? (conta.turma || '—') : '—'}</td>
                          <td>
                            <span className={`badge ${calcularStatusClass(conta.status)}`}>
                              {formatarStatusConta(conta.status)}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => abrirEdicaoConta(conta)}>
                                Editar
                              </button>
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => confirmarExclusaoConta(conta)}>
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {contasFiltradas.length === 0 && (
                        <tr>
                          <td colSpan="7" className="py-5 text-center text-muted">
                            {contas.length === 0
                              ? `Nenhuma conta de ${perfil === 'aluno' ? 'aluno' : 'professor'} importada.`
                              : 'Nenhuma conta corresponde aos filtros informados.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        {contaEmEdicao && (
          <div className="modal fade show d-block" style={{ background: 'rgba(0, 0, 0, 0.45)' }} tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title h5 mb-0">Editar conta importada</h2>
                  <button type="button" className="btn-close" aria-label="Fechar" onClick={() => setContaEmEdicao(null)} />
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nome completo</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formEdicao.nome}
                        onChange={(event) => setFormEdicao((prev) => ({ ...prev, nome: event.target.value }))}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">E-mail institucional</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formEdicao.email}
                        onChange={(event) => setFormEdicao((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Matrícula</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formEdicao.matricula}
                        onChange={(event) => setFormEdicao((prev) => ({ ...prev, matricula: event.target.value }))}
                      />
                    </div>

                    {contaEmEdicao.tipo === 'aluno' && (
                      <div className="col-md-4">
                        <label className="form-label">Turma</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formEdicao.turma}
                          onChange={(event) => setFormEdicao((prev) => ({ ...prev, turma: event.target.value }))}
                        />
                      </div>
                    )}

                    <div className={contaEmEdicao.tipo === 'aluno' ? 'col-md-4' : 'col-md-12'}>
                      <label className="form-label">Status atual</label>
                      <div className="form-control bg-light" aria-live="polite">
                        {formatarStatusConta(contaEmEdicao.status)}
                      </div>
                      <div className="form-text">O status muda automaticamente quando a conta é cadastrada.</div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setContaEmEdicao(null)}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-primary" disabled={salvandoEdicao} onClick={salvarEdicaoConta}>
                    {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
})

export default Contas
