import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { emailInstitucionalValido } from './authService'

export const COLECAO_VERIFICADAS = 'verifiedAccounts'
export const COLECAO_TURMAS = 'turmas'

export const STATUS_CONTA_VERIFICADA = {
  NAO_CADASTRADA: 'nao_cadastrada',
  CADASTRADA: 'cadastrada',
}

export function normalizarTexto(valor = '') {
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizarEmail(valor = '') {
  return String(valor).trim().toLowerCase()
}

export function normalizarMatricula(valor = '') {
  return String(valor).trim()
}

export function normalizarNome(valor = '') {
  return normalizarTexto(valor).toLocaleLowerCase('pt-BR')
}

export function normalizarTurmaIdentificador(valor = '') {
  const texto = normalizarTexto(valor)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return texto || 'turma-sem-nome'
}

export function detectarDelimitador(texto = '') {
  const amostra = texto.slice(0, 5000)
  const candidatos = ['\t', ';', ',']
  let melhor = ','
  let melhorContagem = -1

  candidatos.forEach((delimitador) => {
    const contagem = (amostra.match(new RegExp(`\\${delimitador}`, 'g')) || []).length
    if (contagem > melhorContagem) {
      melhor = delimitador
      melhorContagem = contagem
    }
  })

  return melhor
}

export function parseCsvConteudo(texto = '') {
  const conteudo = String(texto || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  if (!conteudo.trim()) {
    return []
  }

  const delimitador = detectarDelimitador(conteudo)
  const linhas = []
  let linhaAtual = []
  let valorAtual = ''
  let dentroDeAspas = false

  for (let indice = 0; indice < conteudo.length; indice += 1) {
    const caractere = conteudo[indice]

    if (caractere === '"') {
      if (dentroDeAspas && conteudo[indice + 1] === '"') {
        valorAtual += '"'
        indice += 1
      } else {
        dentroDeAspas = !dentroDeAspas
      }
      continue
    }

    if (caractere === delimitador && !dentroDeAspas) {
      linhaAtual.push(valorAtual)
      valorAtual = ''
      continue
    }

    if ((caractere === '\n' || caractere === '\r') && !dentroDeAspas) {
      if (caractere === '\r' && conteudo[indice + 1] === '\n') {
        indice += 1
      }

      linhaAtual.push(valorAtual)
      const linhaLimpa = linhaAtual.filter((campo) => campo !== undefined)
      if (linhaLimpa.some((campo) => campo.trim() !== '')) {
        linhas.push(linhaLimpa)
      }
      linhaAtual = []
      valorAtual = ''
      continue
    }

    valorAtual += caractere
  }

  if (valorAtual !== '' || linhaAtual.length > 0) {
    linhaAtual.push(valorAtual)
    const linhaFinal = linhaAtual.filter((campo) => campo !== undefined)
    if (linhaFinal.some((campo) => campo.trim() !== '')) {
      linhas.push(linhaFinal)
    }
  }

  return linhas
}

function mapearCabecalho(cabecalho = '') {
  const valor = normalizarTexto(cabecalho).toLowerCase()
  const aliases = {
    'nome completo': 'nome',
    nome: 'nome',
    'email institucional': 'email',
    'e-mail institucional': 'email',
    email: 'email',
    'e-mail': 'email',
    matricula: 'matricula',
    'matrícula': 'matricula',
    turma: 'turma',
  }

  return aliases[valor] || valor.replace(/[^a-z0-9]+/g, ' ').trim()
}

export function converterLinhasCsvParaRegistros(texto = '') {
  const linhas = parseCsvConteudo(texto)

  if (linhas.length < 2) {
    return []
  }

  const cabecalhos = linhas[0].map(mapearCabecalho)

  return linhas.slice(1).map((linha, indice) => {
    const registro = {}

    cabecalhos.forEach((cabecalho, posicao) => {
      const valor = linha[posicao] ?? ''
      registro[cabecalho] = valor.trim()
    })

    registro.linha = indice + 2
    return registro
  })
}

export async function listarTurmas() {
  const snapshot = await getDocs(collection(db, COLECAO_TURMAS))
  return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function listarContasVerificadas() {
  const snapshot = await getDocs(collection(db, COLECAO_VERIFICADAS))
  return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function buscarTurmaPorNome(nomeTurma) {
  const turmaNormalizada = normalizarTurmaIdentificador(nomeTurma)
  const turmas = await listarTurmas()
  return turmas.find((turma) => turma.identificador === turmaNormalizada) || null
}

export async function garantirTurma(nomeTurma) {
  const nome = normalizarTexto(nomeTurma)

  if (!nome) {
    throw new Error('Informe uma turma válida para o aluno.')
  }

  const turmaExistente = await buscarTurmaPorNome(nome)
  if (turmaExistente) {
    return turmaExistente
  }

  const identificador = normalizarTurmaIdentificador(nome)
  const refTurma = doc(collection(db, COLECAO_TURMAS))
  const turma = {
    id: refTurma.id,
    nome,
    identificador,
    criadaEm: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(refTurma, turma)
  return { ...turma, id: refTurma.id }
}

export async function buscarContaVerificadaPorEmailOuMatricula(email, matricula, tipoConta = null) {
  const contas = await listarContasVerificadas()
  const emailNormalizado = normalizarEmail(email)
  const matriculaNormalizada = normalizarMatricula(matricula)

  const contaExata = contas.find((conta) => {
    const mesmoEmail = emailNormalizado && normalizarEmail(conta.email) === emailNormalizado
    const mesmaMatricula = matriculaNormalizada && normalizarMatricula(conta.matricula) === matriculaNormalizada
    const mesmoTipo = !tipoConta || conta.tipo === tipoConta
    return mesmoTipo && mesmoEmail && mesmaMatricula
  })

  if (contaExata) {
    return contaExata
  }

  return contas.find((conta) => {
    const mesmoEmail = emailNormalizado && normalizarEmail(conta.email) === emailNormalizado
    const mesmaMatricula = matriculaNormalizada && normalizarMatricula(conta.matricula) === matriculaNormalizada
    const mesmoTipo = !tipoConta || conta.tipo === tipoConta
    return mesmoTipo && (mesmoEmail || mesmaMatricula)
  }) || null
}

export async function validarCadastroVerificado({ nome, email, matricula }) {
  const nomeNormalizado = normalizarNome(nome)
  const emailNormalizado = normalizarEmail(email)
  const matriculaNormalizada = normalizarMatricula(matricula)

  if (!nomeNormalizado || !emailNormalizado || !matriculaNormalizada) {
    return { ok: false, erro: 'Preencha nome, e-mail e matrícula para continuar.' }
  }

  if (!emailInstitucionalValido(emailNormalizado)) {
    return { ok: false, erro: 'O cadastro é permitido somente com e-mail institucional.' }
  }

  const conta = await buscarContaVerificadaPorEmailOuMatricula(emailNormalizado, matriculaNormalizada)

  if (!conta) {
    return {
      ok: false,
      erro: 'Não foi possível localizar sua autorização para cadastro. Verifique nome, e-mail e matrícula informados.',
    }
  }

  const nomeOk = normalizarNome(conta.nome) === nomeNormalizado
  const emailOk = normalizarEmail(conta.email) === emailNormalizado
  const matriculaOk = normalizarMatricula(conta.matricula) === matriculaNormalizada
  const tipoOk = ['aluno', 'professor'].includes(conta.tipo)

  if (!nomeOk || !emailOk || !matriculaOk || !tipoOk) {
    return {
      ok: false,
      erro: 'Os dados informados não correspondem à autorização cadastrada.',
    }
  }

  if (conta.status === STATUS_CONTA_VERIFICADA.CADASTRADA) {
    return {
      ok: false,
      erro: 'Esta conta já foi cadastrada e não pode ser utilizada novamente.',
    }
  }

  return { ok: true, conta }
}

export async function finalizarCadastroVerificado({ verifiedAccountId, authUid }) {
  if (!verifiedAccountId || !authUid) {
    throw new Error('Dados da conta verificada incompletos.')
  }

  const refConta = doc(db, COLECAO_VERIFICADAS, verifiedAccountId)
  const snapshot = await getDoc(refConta)

  if (!snapshot.exists()) {
    throw new Error('A conta autorizada não foi encontrada.')
  }

  const contaAtual = snapshot.data()
  if (contaAtual.status === STATUS_CONTA_VERIFICADA.CADASTRADA) {
    if (contaAtual.authUid === authUid) {
      return true
    }
    throw new Error('Esta autorização já está associada a outro usuário.')
  }

  if (contaAtual.status !== STATUS_CONTA_VERIFICADA.NAO_CADASTRADA) {
    throw new Error('O status atual da autorização não permite concluir o cadastro.')
  }

  try {
    await updateDoc(refConta, {
      authUid,
      status: STATUS_CONTA_VERIFICADA.CADASTRADA,
      atualizadoEm: serverTimestamp(),
      dataCadastro: serverTimestamp(),
    })
  } catch (error) {
    const snapshotAtualizado = await getDoc(refConta)
    const contaAtualizada = snapshotAtualizado.exists() ? snapshotAtualizado.data() : null

    if (
      contaAtualizada?.status === STATUS_CONTA_VERIFICADA.CADASTRADA &&
      contaAtualizada.authUid === authUid
    ) {
      return true
    }

    throw error
  }

  return true
}

export async function listarContasVerificadasFiltradas({ tipo, status, turmaId, busca }) {
  const contas = await listarContasVerificadas()
  const termo = normalizarTexto(busca || '').toLowerCase()

  return contas.filter((conta) => {
    const tipoOk = !tipo || conta.tipo === tipo
    const statusOk = !status || conta.status === status
    const turmaOk = !turmaId || conta.turmaId === turmaId
    const buscaOk = !termo || [conta.nome, conta.email, conta.matricula].some((valor) => String(valor || '').toLowerCase().includes(termo))

    return tipoOk && statusOk && turmaOk && buscaOk
  })
}

export async function atualizarContaVerificada(contaId, dados = {}) {
  if (!contaId) {
    throw new Error('Informe a conta que será atualizada.')
  }

  const camposEditaveis = ['nome', 'email', 'matricula', 'turma', 'turmaId']
  const payload = Object.fromEntries(
    camposEditaveis
      .filter((campo) => Object.prototype.hasOwnProperty.call(dados, campo))
      .map((campo) => [campo, dados[campo]]),
  )

  if (Object.prototype.hasOwnProperty.call(payload, 'nome')) {
    payload.nome = normalizarTexto(payload.nome)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'email')) {
    payload.email = normalizarEmail(payload.email)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'matricula')) {
    payload.matricula = normalizarMatricula(payload.matricula)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'turma')) {
    payload.turma = normalizarTexto(payload.turma)
  }

  payload.atualizadoEm = serverTimestamp()

  const refConta = doc(db, COLECAO_VERIFICADAS, contaId)
  await updateDoc(refConta, payload)
  return true
}

export async function removerContaVerificada(contaId) {
  if (!contaId) {
    throw new Error('Informe a conta que será removida.')
  }

  await deleteDoc(doc(db, COLECAO_VERIFICADAS, contaId))
  return true
}

export async function contarContasVerificadas() {
  const contas = await listarContasVerificadas()
  return {
    total: contas.length,
    alunos: contas.filter((conta) => conta.tipo === 'aluno').length,
    professores: contas.filter((conta) => conta.tipo === 'professor').length,
    cadastradas: contas.filter((conta) => conta.status === STATUS_CONTA_VERIFICADA.CADASTRADA).length,
    naoCadastradas: contas.filter((conta) => conta.status === STATUS_CONTA_VERIFICADA.NAO_CADASTRADA).length,
  }
}

export function criarModeloCsv(tipo) {
  if (tipo === 'aluno') {
    return [
      ['Nome completo', 'E-mail institucional', 'Matrícula', 'Turma'],
      ['João Silva', 'joao@email.com', '12345', '1º Ano A'],
      ['Maria Souza', 'maria@email.com', '12346', '1º Ano B'],
      ['Pedro Santos', 'pedro@email.com', '12347', '2º Ano A'],
    ]
      .map((linha) => linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(','))
      .join('\n')
  }

  return [
    ['Nome completo', 'E-mail institucional', 'Matrícula'],
    ['Carlos Lima', 'carlos@email.com', '54321'],
    ['Fernanda Costa', 'fernanda@email.com', '54322'],
    ['Ricardo Alves', 'ricardo@email.com', '54323'],
  ]
    .map((linha) => linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

export async function previsualizarImportacaoCsv({ tipo, texto }) {
  const registros = converterLinhasCsvParaRegistros(texto)

  if (!registros.length) {
    return {
      total: 0,
      validos: 0,
      invalidos: 0,
      duplicados: 0,
      jaExistentes: 0,
      registros: [],
    }
  }

  const camposObrigatorios = tipo === 'aluno'
    ? ['nome', 'email', 'matricula', 'turma']
    : ['nome', 'email', 'matricula']

  const cabecalhosFaltantes = camposObrigatorios.filter((campo) => !registros.some((registro) => Object.prototype.hasOwnProperty.call(registro, campo)))

  if (cabecalhosFaltantes.length > 0) {
    return {
      total: registros.length,
      validos: 0,
      invalidos: registros.length,
      duplicados: 0,
      jaExistentes: 0,
      registros: registros.map((registro) => ({
        ...registro,
        valid: false,
        erros: [`Cabeçalhos obrigatórios ausentes: ${cabecalhosFaltantes.join(', ')}`],
      })),
      erroCabecalho: `Faltam colunas obrigatórias: ${cabecalhosFaltantes.join(', ')}`,
    }
  }

  const existentes = await listarContasVerificadas()
  const detalhes = []
  let duplicados = 0
  let jaExistentes = 0
  let validos = 0
  const vistosNoArquivo = new Set()

  for (const registro of registros) {
    const erros = []
    const nome = normalizarTexto(registro.nome)
    const email = normalizarEmail(registro.email)
    const matricula = normalizarMatricula(registro.matricula)
    const turma = tipo === 'aluno' ? normalizarTexto(registro.turma) : ''

    if (!nome) erros.push('Nome completo obrigatório.')
    if (!email) erros.push('E-mail institucional obrigatório.')
    else if (!emailInstitucionalValido(email)) erros.push('E-mail inválido ou fora do domínio institucional.')
    if (!matricula) erros.push('Matrícula obrigatória.')
    if (tipo === 'aluno' && !turma) erros.push('Turma obrigatória para alunos.')

    const chaveArquivo = `${email}::${matricula}::${tipo}`
    if (vistosNoArquivo.has(chaveArquivo)) {
      erros.push('Registro duplicado dentro do próprio arquivo.')
      duplicados += 1
    }
    vistosNoArquivo.add(chaveArquivo)

    const existente = existentes.find((conta) => {
      const mesmoTipo = conta.tipo === tipo
      const mesmoEmail = email && normalizarEmail(conta.email) === email
      const mesmaMatricula = matricula && normalizarMatricula(conta.matricula) === matricula
      return mesmoTipo && (mesmoEmail || mesmaMatricula)
    })

    if (existente) {
      erros.push(`Registro já existe no sistema como ${existente.tipo}.`)
      jaExistentes += 1
    }

    const valido = erros.length === 0
    if (valido) validos += 1

    detalhes.push({
      ...registro,
      nome,
      email,
      matricula,
      turma,
      valid: valido,
      erros,
      existente,
    })
  }

  return {
    total: registros.length,
    validos,
    invalidos: registros.length - validos,
    duplicados,
    jaExistentes,
    registros: detalhes,
  }
}

export async function importarContasVerificadas({ tipo, registros }) {
  if (!tipo || !Array.isArray(registros) || registros.length === 0) {
    return { importados: [], ignorados: [], total: 0 }
  }

  const importados = []
  const ignorados = []
  const existentes = await listarContasVerificadas()
  const mapaExistentes = new Map()

  existentes.forEach((conta) => {
    mapaExistentes.set(`${normalizarEmail(conta.email)}::${normalizarMatricula(conta.matricula)}::${conta.tipo}`, conta)
  })

  const vistosNoArquivo = new Set()

  for (const registro of registros) {
    const nome = normalizarTexto(registro.nome)
    const email = normalizarEmail(registro.email)
    const matricula = normalizarMatricula(registro.matricula)
    const turma = tipo === 'aluno' ? normalizarTexto(registro.turma) : ''

    if (!nome || !email || !matricula || (tipo === 'aluno' && !turma)) {
      ignorados.push({ linha: registro.linha, motivo: 'Registro incompleto ou sem dados obrigatórios.' })
      continue
    }

    const chaveArquivo = `${email}::${matricula}::${tipo}`
    if (vistosNoArquivo.has(chaveArquivo)) {
      ignorados.push({ linha: registro.linha, motivo: 'Registro duplicado dentro do próprio arquivo.' })
      continue
    }
    vistosNoArquivo.add(chaveArquivo)

    if (mapaExistentes.has(chaveArquivo)) {
      ignorados.push({ linha: registro.linha, motivo: 'Registro já existe no sistema.' })
      continue
    }

    const turmaAssociada = tipo === 'aluno' ? await garantirTurma(turma) : null
    const refConta = doc(collection(db, COLECAO_VERIFICADAS))
    const payload = {
      id: refConta.id,
      nome,
      email,
      matricula,
      tipo,
      status: STATUS_CONTA_VERIFICADA.NAO_CADASTRADA,
      turmaId: turmaAssociada ? turmaAssociada.id : null,
      turma: turmaAssociada ? turmaAssociada.nome : null,
      authUid: null,
      importadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    }

    await setDoc(refConta, payload)
    importados.push({ ...payload, linha: registro.linha })
  }

  return { importados, ignorados, total: registros.length }
}

export async function buscarTurmaPorId(turmaId) {
  if (!turmaId) return null

  const turmas = await listarTurmas()
  return turmas.find((turma) => turma.id === turmaId) || null
}

export async function registrarContaVerificadaAssociada({ verifiedAccountId, authUid, turmaId, turmaNome }) {
  const refConta = doc(db, COLECAO_VERIFICADAS, verifiedAccountId)
  await updateDoc(refConta, {
    authUid,
    turmaId: turmaId || null,
    turma: turmaNome || null,
    status: STATUS_CONTA_VERIFICADA.CADASTRADA,
    atualizadoEm: serverTimestamp(),
    dataCadastro: serverTimestamp(),
  })

  return true
}

export function formatarStatusConta(status = '') {
  return status === STATUS_CONTA_VERIFICADA.CADASTRADA ? 'Cadastrada' : 'Não cadastrada'
}

export function calcularStatusClass(status = '') {
  return status === STATUS_CONTA_VERIFICADA.CADASTRADA ? 'bg-success' : 'bg-warning text-dark'
}

export function obterCsvModelo(tipo = 'aluno') {
  return criarModeloCsv(tipo)
}

export async function buscarContaVerificadaPorUid(uid) {
  const contas = await listarContasVerificadas()
  return contas.find((conta) => conta.authUid === uid) || null
}

export async function verificarTurmaExistente(nomeTurma) {
  return buscarTurmaPorNome(nomeTurma)
}
