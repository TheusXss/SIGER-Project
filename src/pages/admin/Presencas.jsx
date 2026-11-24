import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { collection, getDocs } from 'firebase/firestore'
import { useAuth } from '../../contexts/useAuth'
import AdminNavbar from '../../components/admin/AdminNavbar'
import { db } from '../../services/firebase'
import { listarLocais } from '../../services/locationService'
import {
  ativarJanelasReservasLegadas,
  gerarQrCode,
  invalidarQrCode,
  listarDadosPresencaAdmin,
  listarQrCodes,
} from '../../services/presencaService'

function htmlSeguro(valor) {
  return String(valor || '').replace(/[&<>"']/g, (caractere) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[caractere])
}

function dataHoraLocal(data, horario, duracaoMinutos = 120) {
  if (!data) return { inicio: '', fim: '' }
  const hora = String(horario || '08:00').match(/\d{1,2}:\d{2}/)?.[0] || '08:00'
  const inicio = new Date(`${data}T${hora}`)
  if (Number.isNaN(inicio.getTime())) return { inicio: '', fim: '' }
  const fim = new Date(inicio.getTime() + duracaoMinutos * 60000)
  const paraInput = (valor) => `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}-${String(valor.getDate()).padStart(2, '0')}T${String(valor.getHours()).padStart(2, '0')}:${String(valor.getMinutes()).padStart(2, '0')}`
  return { inicio: paraInput(inicio), fim: paraInput(fim) }
}

function paraData(valor) {
  if (!valor) return ''
  if (typeof valor?.toDate === 'function') return valor.toDate().toLocaleString('pt-BR')
  return valor
}

function paraDataHoraLocal(valor) {
  if (!valor?.toDate) return ''
  const data = valor.toDate()
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}T${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`
}

function chaveEsperado(item) {
  return `${item.tipo}:${item.tipo === 'local' ? item.reservaId : item.alvoId}:${item.uid}`
}

export default function PresencasAdmin() {
  const { usuarioAtual } = useAuth()
  const [aulas, setAulas] = useState([])
  const [locais, setLocais] = useState([])
  const [qrCodes, setQrCodes] = useState([])
  const [presencas, setPresencas] = useState([])
  const [esperados, setEsperados] = useState([])
  const [tipo, setTipo] = useState('local')
  const [alvoId, setAlvoId] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [recarga, setRecarga] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [migrando, setMigrando] = useState(false)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [qrAberto, setQrAberto] = useState(null)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    let ativo = true
    Promise.allSettled([
        getDocs(collection(db, 'aulasExtras')),
        listarLocais(),
        listarQrCodes(),
        listarDadosPresencaAdmin(),
    ])
      .then((resultados) => {
        if (!ativo) return
        const [aulasResult, locaisResult, codigosResult, presencasResult] = resultados
        const falhas = []
        if (aulasResult.status === 'fulfilled') {
          setAulas(aulasResult.value.docs.map((item) => ({ id: item.id, ...item.data() })))
        } else {
          console.error('Erro ao consultar aulas extras:', aulasResult.reason)
          falhas.push(`aulas extras (${aulasResult.reason?.code || 'permissão negada'})`)
        }
        if (locaisResult.status === 'fulfilled') setLocais(locaisResult.value)
        else {
          console.error('Erro ao consultar locais:', locaisResult.reason)
          falhas.push(`locais (${locaisResult.reason?.code || 'permissão negada'})`)
        }
        if (codigosResult.status === 'fulfilled') setQrCodes(codigosResult.value)
        else {
          console.error('Erro ao consultar QR Codes:', codigosResult.reason)
          falhas.push(`QR Codes (${codigosResult.reason?.code || 'permissão negada'})`)
        }
        if (presencasResult.status === 'fulfilled') {
          setPresencas(presencasResult.value.presencas)
          setEsperados(presencasResult.value.esperados)
        } else {
          console.error('Erro ao consultar presenças:', presencasResult.reason)
          falhas.push(`presenças (${presencasResult.reason?.code || 'permissão negada'})`)
        }
        setErro(falhas.length ? `Falha ao carregar: ${falhas.join('; ')}. Confira as regras publicadas e o papel admin do seu perfil em users/{uid}.` : '')
      })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [recarga])

  function solicitarRecarga() {
    setCarregando(true)
    setRecarga((atual) => atual + 1)
  }

  const alvos = tipo === 'local' ? locais : aulas.filter((aula) => aula.statusAula !== 'cancelada')
  const alvoSelecionado = alvos.find((alvo) => alvo.id === alvoId)

  function mudarTipo(novoTipo) {
    setTipo(novoTipo)
    setAlvoId('')
    setInicio('')
    setFim('')
  }

  function mudarAlvo(id) {
    setAlvoId(id)
    if (tipo === 'aulaExtra') {
      const aula = aulas.find((item) => item.id === id)
      const periodo = dataHoraLocal(aula?.data, aula?.horario)
      setInicio(periodo.inicio)
      setFim(periodo.fim)
    }
  }

  async function exibirQr(id, nome) {
    try {
      const imagem = await QRCode.toDataURL(`SIGER-PRESENCA:${id}`, { width: 520, margin: 2, errorCorrectionLevel: 'H' })
      setQrAberto({ id, nome, imagem })
    } catch (error) {
      console.error('Erro ao gerar imagem do QR Code:', error)
      setErro('Não foi possível montar a imagem do QR Code.')
    }
  }

  async function criarCodigo(event) {
    event.preventDefault()
    if (!alvoSelecionado) {
      setErro('Selecione um local ou uma aula extra.')
      return
    }
    if (tipo === 'aulaExtra' && (!inicio || !fim || new Date(inicio) >= new Date(fim))) {
      setErro('Informe uma janela válida para registro da presença.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      const id = await gerarQrCode({
        tipo,
        alvoId: alvoSelecionado.id,
        nome: tipo === 'local' ? alvoSelecionado.name : alvoSelecionado.titulo,
        localId: tipo === 'local' ? alvoSelecionado.id : alvoSelecionado.localId || '',
        localNome: tipo === 'local' ? alvoSelecionado.name : alvoSelecionado.localNome || '',
        inicio: tipo === 'aulaExtra' ? inicio : null,
        fim: tipo === 'aulaExtra' ? fim : null,
        adminUid: usuarioAtual.uid,
      })
      solicitarRecarga()
      await exibirQr(id, tipo === 'local' ? alvoSelecionado.name : alvoSelecionado.titulo)
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
      setErro('Não foi possível gerar o QR Code. Confirme se as regras do Firestore foram publicadas.')
    } finally {
      setSalvando(false)
    }
  }

  async function regenerar(codigo) {
    setTipo(codigo.tipo)
    setAlvoId(codigo.alvoId)
    const inicioNovo = paraDataHoraLocal(codigo.inicio)
    const fimNovo = paraDataHoraLocal(codigo.fim)
    setInicio(inicioNovo)
    setFim(fimNovo)
    setSalvando(true)
    setErro('')
    try {
      const novoId = await gerarQrCode({
        tipo: codigo.tipo,
        alvoId: codigo.alvoId,
        nome: codigo.nome,
        localId: codigo.localId || '',
        localNome: codigo.localNome || '',
        inicio: inicioNovo,
        fim: fimNovo,
        adminUid: usuarioAtual.uid,
      })
      solicitarRecarga()
      await exibirQr(novoId, codigo.nome)
    } catch (error) {
      console.error('Erro ao regenerar QR Code:', error)
      setErro('Não foi possível regenerar este QR Code.')
    } finally {
      setSalvando(false)
    }
  }

  async function desativar(codigo) {
    try {
      await invalidarQrCode(codigo.id, usuarioAtual.uid)
      solicitarRecarga()
      if (qrAberto?.id === codigo.id) setQrAberto(null)
    } catch (error) {
      console.error('Erro ao invalidar QR Code:', error)
      setErro('Não foi possível invalidar este QR Code.')
    }
  }

  async function migrarReservasLegadas() {
    setMigrando(true)
    setErro('')
    try {
      const resultado = await ativarJanelasReservasLegadas()
      setMensagem(`${resultado.atualizadas} reservas atualizadas.${resultado.ignoradas ? ` ${resultado.ignoradas} com data ou horário inválido não foram alteradas.` : ''}`)
      solicitarRecarga()
    } catch (error) {
      console.error('Erro ao preparar reservas antigas para presença:', error)
      setErro('Não foi possível atualizar as janelas das reservas aprovadas antigas.')
    } finally {
      setMigrando(false)
    }
  }

  function imprimir() {
    if (!qrAberto) return
    const janela = window.open('', '_blank', 'width=800,height=900')
    if (!janela) {
      setErro('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.')
      return
    }
    janela.opener = null
    janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>QR Code - ${htmlSeguro(qrAberto.nome)}</title><style>body{font-family:Arial,sans-serif;color:#142c2a;text-align:center;margin:0;padding:40px 24px}h1{font-size:30px;margin:12px 0}p{font-size:18px;margin:8px}img{width:min(78vw,520px);height:auto;margin:18px auto}.brand{font-weight:700;color:#0f766e;font-size:16px}@media print{body{padding:10mm}img{width:140mm;max-height:140mm}}</style></head><body><p class="brand">SIGER</p><h1>${htmlSeguro(qrAberto.nome)}</h1><p>${htmlSeguro(qrCodes.find((item) => item.id === qrAberto.id)?.localNome || '')}</p><img src="${qrAberto.imagem}" alt="QR Code de ${htmlSeguro(qrAberto.nome)}"><p>Escaneie este QR Code para registrar sua presença</p><script>window.onload=()=>window.print()</script></body></html>`)
    janela.document.close()
  }

  const presentesSet = useMemo(() => new Set(presencas.map((item) => chaveEsperado(item))), [presencas])
  const filtroNorm = filtro.trim().toLocaleLowerCase('pt-BR')
  const registrosFiltrados = presencas.filter((item) => {
    const combinaTexto = !filtroNorm || `${item.alunoNome} ${item.alvoNome} ${item.localNome}`.toLocaleLowerCase('pt-BR').includes(filtroNorm)
    const combinaTipo = !filtroTipo || item.tipo === filtroTipo
    const data = item.data || item.dataReserva || ''
    const combinaData = (!filtroDataInicio || data >= filtroDataInicio) && (!filtroDataFim || data <= filtroDataFim)
    return combinaTexto && combinaTipo && combinaData
  })
  const pendentes = esperados.filter((item) => !presentesSet.has(chaveEsperado(item))).filter((item) => {
    const combinaTexto = !filtroNorm || `${item.alunoNome} ${item.alvoNome} ${item.localNome}`.toLocaleLowerCase('pt-BR').includes(filtroNorm)
    const combinaTipo = !filtroTipo || item.tipo === filtroTipo
    const combinaData = (!filtroDataInicio || item.data >= filtroDataInicio) && (!filtroDataFim || item.data <= filtroDataFim)
    return combinaTexto && combinaTipo && combinaData
  })

  return (
    <>
      <AdminNavbar />
      <div className="container app-shell">
        <header className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4"><div><span className="eyebrow">Controle de presença</span><h1 className="h3 mb-1">Gerenciar QR Codes</h1><p className="text-muted mb-0">Cada código identifica um espaço ou aula; a autorização é validada pelo Firestore.</p></div><div className="d-flex gap-2 flex-wrap"><button type="button" className="btn btn-outline-secondary" onClick={migrarReservasLegadas} disabled={migrando}>{migrando ? 'Atualizando reservas...' : 'Preparar reservas antigas'}</button><button type="button" className="btn btn-outline-primary" onClick={solicitarRecarga} disabled={carregando}>Atualizar dados</button></div></header>
        {erro && <div className="alert alert-danger" role="alert">{erro}</div>}
        {mensagem && <div className="alert alert-success" role="status">{mensagem}</div>}

        <section className="attendance-admin-section mb-4">
          <div className="attendance-admin-heading"><div><span className="eyebrow">Novo código</span><h2 className="h5 mb-0">Gerar QR Code</h2></div></div>
          <form onSubmit={criarCodigo} className="row g-3 align-items-end mt-1">
            <div className="col-md-3"><label className="form-label" htmlFor="tipo-qr">Tipo</label><select id="tipo-qr" className="form-select" value={tipo} onChange={(event) => mudarTipo(event.target.value)}><option value="local">Local ou espaço</option><option value="aulaExtra">Aula extra</option></select></div>
            <div className="col-md-5"><label className="form-label" htmlFor="alvo-qr">{tipo === 'local' ? 'Local' : 'Aula extra'}</label><select id="alvo-qr" className="form-select" value={alvoId} onChange={(event) => mudarAlvo(event.target.value)} required><option value="">Selecione</option>{alvos.map((alvo) => <option key={alvo.id} value={alvo.id}>{tipo === 'local' ? `${alvo.name} · ${alvo.type}` : `${alvo.titulo} · ${alvo.data || 'Sem data'}`}</option>)}</select></div>
            {tipo === 'aulaExtra' && <><div className="col-md-2"><label className="form-label" htmlFor="inicio-qr">Início</label><input id="inicio-qr" type="datetime-local" className="form-control" value={inicio} onChange={(event) => setInicio(event.target.value)} required /></div><div className="col-md-2"><label className="form-label" htmlFor="fim-qr">Fim</label><input id="fim-qr" type="datetime-local" className="form-control" value={fim} onChange={(event) => setFim(event.target.value)} required /></div></>}
            <div className="col-12"><button type="submit" className="btn btn-primary" disabled={salvando || carregando || !alvoSelecionado}>{salvando ? 'Gerando...' : 'Gerar QR Code'}</button>{tipo === 'aulaExtra' && <small className="d-block text-muted mt-2">O horário sugerido é de duas horas a partir do início cadastrado; ajuste a janela conforme a atividade.</small>}</div>
          </form>
        </section>

        <section className="attendance-admin-section mb-5">
          <div className="attendance-admin-heading"><div><span className="eyebrow">Códigos cadastrados</span><h2 className="h5 mb-0">QR Codes disponíveis</h2></div><span className="badge bg-secondary">{qrCodes.length} códigos</span></div>
          {carregando ? <p className="text-muted mt-3">Carregando...</p> : qrCodes.length === 0 ? <p className="text-muted mt-3 mb-0">Nenhum QR Code gerado ainda.</p> : <div className="qr-code-list mt-3">{qrCodes.map((item) => <article className="qr-code-row" key={item.id}><div className="qr-code-row-info"><strong>{item.nome}</strong><span>{item.tipo === 'local' ? 'Local' : 'Aula extra'} · {item.localNome || item.nome}</span><small>{item.ativo ? 'Ativo' : 'Invalidado'} · criado {paraData(item.criadoEm)}</small></div><div className="d-flex gap-2 flex-wrap"><button type="button" className="btn btn-outline-primary btn-sm" onClick={() => exibirQr(item.id, item.nome)}>Visualizar</button><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => regenerar(item)} disabled={salvando}>Regenerar</button>{item.ativo && <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => desativar(item)}>Invalidar</button>}</div></article>)}</div>}
        </section>

        <section className="attendance-admin-section">
          <div className="attendance-admin-heading"><div><span className="eyebrow">Relatório</span><h2 className="h5 mb-0">Presenças e ausências</h2></div><span className="badge bg-success-subtle">{registrosFiltrados.length} registradas</span></div>
          <div className="row g-3 mt-1 mb-3"><div className="col-md-4"><label className="form-label" htmlFor="filtro-presenca">Aluno, atividade ou local</label><input id="filtro-presenca" className="form-control" value={filtro} onChange={(event) => setFiltro(event.target.value)} placeholder="Pesquisar" /></div><div className="col-md-2"><label className="form-label" htmlFor="filtro-tipo-presenca">Tipo</label><select id="filtro-tipo-presenca" className="form-select" value={filtroTipo} onChange={(event) => setFiltroTipo(event.target.value)}><option value="">Todos</option><option value="aulaExtra">Aula extra</option><option value="local">Local</option></select></div><div className="col-md-3"><label className="form-label" htmlFor="filtro-data-inicio">Data inicial</label><input id="filtro-data-inicio" type="date" className="form-control" value={filtroDataInicio} onChange={(event) => setFiltroDataInicio(event.target.value)} /></div><div className="col-md-3"><label className="form-label" htmlFor="filtro-data-fim">Data final</label><input id="filtro-data-fim" type="date" className="form-control" value={filtroDataFim} onChange={(event) => setFiltroDataFim(event.target.value)} /></div></div>
          <div className="table-responsive attendance-table-wrap"><table className="table align-middle"><thead><tr><th>Aluno</th><th>Atividade / local</th><th>Data</th><th>Horário do registro</th><th>Status</th></tr></thead><tbody>{registrosFiltrados.map((item) => <tr key={`${item.tipo}-${item.alvoId}-${item.uid}`}><td>{item.alunoNome}</td><td>{item.alvoNome}<small className="d-block text-muted">{item.localNome}</small></td><td>{item.data || item.dataReserva || '—'}</td><td>{paraData(item.registradaEm)}</td><td><span className="badge bg-success-subtle">Presente</span></td></tr>)}{registrosFiltrados.length === 0 && <tr><td colSpan="5" className="text-center text-muted py-4">Nenhuma presença encontrada.</td></tr>}</tbody></table></div>
          <div className="mt-4"><h3 className="h6">Inscritos ou reservas aprovadas sem presença <span className="text-muted">({pendentes.length})</span></h3><div className="table-responsive attendance-table-wrap"><table className="table align-middle mb-0"><thead><tr><th>Aluno</th><th>Atividade / local</th><th>Data</th></tr></thead><tbody>{pendentes.slice(0, 100).map((item) => <tr key={chaveEsperado(item)}><td>{item.alunoNome}</td><td>{item.alvoNome}<small className="d-block text-muted">{item.localNome}</small></td><td>{item.data || '—'}</td></tr>)}{pendentes.length === 0 && <tr><td colSpan="3" className="text-center text-muted py-3">Nenhuma ausência elegível encontrada.</td></tr>}</tbody></table>{pendentes.length > 100 && <p className="small text-muted mt-2">Exibindo os primeiros 100 registros; use os filtros para refinar.</p>}</div></div>
        </section>
      </div>

      {qrAberto && <div className="attendance-modal-backdrop" role="presentation" onClick={() => setQrAberto(null)}><section className="attendance-qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title" onClick={(event) => event.stopPropagation()}><button type="button" className="attendance-modal-close" aria-label="Fechar" onClick={() => setQrAberto(null)}>×</button><span className="eyebrow">QR Code de presença</span><h2 id="qr-modal-title" className="h4">{qrAberto.nome}</h2><p className="text-muted">Escaneie este QR Code para registrar sua presença</p><img className="attendance-qr-image" src={qrAberto.imagem} alt={`QR Code de ${qrAberto.nome}`} /><div className="d-flex justify-content-center gap-2 flex-wrap"><a className="btn btn-outline-primary" href={qrAberto.imagem} download={`qr-presenca-${qrAberto.id}.png`}>Baixar PNG</a><button type="button" className="btn btn-primary" onClick={imprimir}>Imprimir</button></div></section></div>}
    </>
  )
}