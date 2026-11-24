import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { useAuth } from '../contexts/useAuth'
import { listarPresencasAluno, registrarPresenca } from '../services/presencaService'

function formatarData(valor) {
  if (!valor) return 'Não informada'
  if (typeof valor?.toDate === 'function') return valor.toDate().toLocaleDateString('pt-BR')
  const data = new Date(`${valor}T12:00:00`)
  return Number.isNaN(data.getTime()) ? 'Não informada' : data.toLocaleDateString('pt-BR')
}

function formatarHorario(valor) {
  if (!valor?.toDate) return '—'
  return valor.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function extrairId(valor) {
  return valor.trim().replace(/^SIGER-PRESENCA:/i, '')
}

export default function RegistrarPresenca() {
  const { usuarioAtual } = useAuth()
  const [lendo, setLendo] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [historicoCarregando, setHistoricoCarregando] = useState(true)
  const [historico, setHistorico] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [erroCamera, setErroCamera] = useState('')
  const scannerRef = useRef(null)
  const detectadoRef = useRef(false)

  const carregarHistorico = useCallback(async () => {
    if (!usuarioAtual?.uid) return
    return listarPresencasAluno(usuarioAtual.uid)
  }, [usuarioAtual])

  useEffect(() => {
    let ativo = true
    carregarHistorico()
      .then((dados) => { if (ativo) setHistorico(dados || []) })
      .catch((error) => {
        console.error('Erro ao carregar histórico de presenças:', error)
        if (ativo) setErro('Não foi possível carregar seu histórico de presenças.')
      })
      .finally(() => { if (ativo) setHistoricoCarregando(false) })
    return () => { ativo = false }
  }, [carregarHistorico])

  useEffect(() => {
    if (!lendo) return undefined
    let cancelado = false
    const scanner = new Html5Qrcode('presenca-camera', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })
    scannerRef.current = scanner
    detectadoRef.current = false
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
      (texto) => {
        if (detectadoRef.current) return
        detectadoRef.current = true
        setCodigo(extrairId(texto))
        setErroCamera('')
        setLendo(false)
      },
      () => {},
    ).catch((error) => {
      if (!cancelado) {
        console.error('Não foi possível iniciar a câmera:', error)
        setErroCamera('Não foi possível acessar a câmera. Permita o uso nas configurações do navegador e acesse o sistema por HTTPS; alternativamente, digite o código do QR abaixo.')
        setLendo(false)
      }
    })
    return () => {
      cancelado = true
      if (scanner.isScanning) scanner.stop().catch(() => {})
      scannerRef.current = null
    }
  }, [lendo])

  async function confirmarPresenca(event) {
    event.preventDefault()
    const qrId = extrairId(codigo)
    if (!/^[\da-f-]{36}$/i.test(qrId)) {
      setErro('Código QR inválido. Leia novamente ou informe o código completo.')
      return
    }
    setCarregando(true)
    setErro('')
    setMensagem('')
    try {
      const resultado = await registrarPresenca({ qrId, uid: usuarioAtual.uid })
      setMensagem(`Presença registrada com sucesso! ${resultado.nome ? `Atividade: ${resultado.nome}.` : ''}`)
      setCodigo('')
      await carregarHistorico()
    } catch (error) {
      console.error('Erro ao registrar presença:', error)
      setErro(error.message || 'Não foi possível registrar sua presença. Verifique a inscrição, reserva e período permitido.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="attendance-page">
      <header className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <span className="eyebrow">Participação</span>
          <h1 className="h3 mb-1">Registrar presença</h1>
          <p className="text-muted mb-0">Leia o QR Code no espaço ou atividade em que você está inscrito.</p>
        </div>
        <span className="badge bg-success-subtle">Conta autenticada</span>
      </header>

      <section className="attendance-scanner-section" aria-label="Leitor de QR Code">
        <div className="attendance-scanner-copy">
          <h2 className="h5">Leitura pelo celular</h2>
          <p className="small text-muted">A câmera será usada somente durante a leitura. O navegador pedirá sua autorização.</p>
          <button type="button" className="btn btn-primary" onClick={() => { setErroCamera(''); setLendo((atual) => !atual) }}>
            {lendo ? 'Parar câmera' : 'Abrir câmera'}
          </button>
        </div>
        <div className={`attendance-camera-frame ${lendo ? 'is-active' : ''}`}>
          <div id="presenca-camera" aria-label="Visualização da câmera" />
          {!lendo && <span className="text-muted">A câmera está desligada</span>}
        </div>
      </section>

      {erroCamera && <div className="alert alert-warning mt-3" role="alert">{erroCamera}</div>}
      {mensagem && <div className="alert alert-success mt-3" role="status">{mensagem}</div>}
      {erro && <div className="alert alert-danger mt-3" role="alert">{erro}</div>}

      <form className="attendance-manual-form mt-4" onSubmit={confirmarPresenca}>
        <label className="form-label" htmlFor="codigo-qr">Código lido ou código QR manual</label>
        <div className="d-flex flex-wrap gap-2">
          <input id="codigo-qr" className="form-control" value={codigo} onChange={(event) => setCodigo(event.target.value)} placeholder="SIGER-PRESENCA:..." autoComplete="off" />
          <button type="submit" className="btn btn-primary" disabled={carregando || !codigo.trim()}>
            {carregando ? 'Confirmando...' : 'Registrar presença'}
          </button>
        </div>
      </form>

      <section className="attendance-history mt-5">
        <div className="section-header mb-3">
          <div>
            <span className="eyebrow">Meu histórico</span>
            <h2 className="h5 mb-0">Presenças registradas</h2>
          </div>
        </div>
        {historicoCarregando ? (
          <div className="py-4 text-muted">Carregando histórico...</div>
        ) : historico.length === 0 ? (
          <div className="attendance-empty">Suas presenças confirmadas aparecerão aqui.</div>
        ) : (
          <div className="table-responsive attendance-table-wrap">
            <table className="table align-middle mb-0">
              <thead><tr><th>Atividade / local</th><th>Data</th><th>Presença</th><th>Status</th></tr></thead>
              <tbody>{historico.map((item) => (
                <tr key={`${item.tipo}-${item.alvoId}-${item.reservaId || item.uid}`}>
                  <td><strong>{item.alvoNome || item.localNome}</strong><small className="d-block text-muted">{item.tipo === 'aulaExtra' ? `Aula extra · ${item.localNome || 'Local não informado'}` : `Reserva · ${item.localNome || 'Local não informado'}`}</small></td>
                  <td>{formatarData(item.data || item.dataReserva)}</td>
                  <td>{formatarHorario(item.registradaEm)}</td>
                  <td><span className="badge bg-success-subtle">Confirmada</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}