<<<<<<< HEAD
import { useEffect, useState } from 'react'
import { TIPOS_LOCAL, STATUS_LOCAL } from '../../services/locationService'
=======
import { useState } from 'react'
import {
  ACESSIBILIDADES_LOCAL,
  RECURSOS_LOCAL,
  TIPOS_LOCAL,
  STATUS_LOCAL,
  obterImagensLocal,
} from '../../services/locationService'
>>>>>>> 4fcfbac (atualização geral)

const ESTADO_INICIAL = {
  name: '',
  type: '',
  building: '',
  floor: '',
  capacity: '',
  description: '',
  status: '',
<<<<<<< HEAD
}

export default function LocalFormModal({ aberto, local, salvando, erro, onCancelar, onSalvar }) {
  const [form, setForm] = useState(ESTADO_INICIAL)
  const [errosCampos, setErrosCampos] = useState({})

  useEffect(() => {
    if (aberto) {
      setForm(
        local
          ? {
              name: local.name || '',
              type: local.type || '',
              building: local.building || '',
              floor: local.floor ?? '',
              capacity: local.capacity ?? '',
              description: local.description || '',
              status: local.status || '',
            }
          : ESTADO_INICIAL
      )
      setErrosCampos({})
    }
  }, [aberto, local])
=======
  accessibility: [],
  resources: [],
  images: [],
}

function criarEstadoInicial(local) {
  if (!local) return ESTADO_INICIAL

  return {
    name: local.name || '',
    type: local.type || '',
    building: local.building || '',
    floor: local.floor ?? '',
    capacity: local.capacity ?? '',
    description: local.description || '',
    status: local.status || '',
    accessibility: Array.isArray(local.accessibility) ? local.accessibility : [],
    resources: Array.isArray(local.resources) ? local.resources : [],
    images: obterImagensLocal(local).map((imagem) => ({ ...imagem, file: null, preview: imagem.url })),
  }
}

function lerImagemComoDataUrl(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(leitor.result)
    leitor.onerror = () => reject(new Error('Não foi possível carregar a prévia da imagem.'))
    leitor.readAsDataURL(arquivo)
  })
}

export default function LocalFormModal({ aberto, local, salvando, erro, onCancelar, onSalvar }) {
  const [form, setForm] = useState(() => criarEstadoInicial(local))
  const [errosCampos, setErrosCampos] = useState({})
  const [imagemUrlInput, setImagemUrlInput] = useState('')
>>>>>>> 4fcfbac (atualização geral)

  if (!aberto) return null

  function handleChange(campo) {
    return (event) => {
      setForm((atual) => ({ ...atual, [campo]: event.target.value }))
<<<<<<< HEAD
    }
  }

=======
      setErrosCampos((atuais) => ({ ...atuais, [campo]: '' }))
    }
  }

  function handleCheckboxChange(campo, valor) {
    setForm((atual) => {
      const selecionados = atual[campo]
      return {
        ...atual,
        [campo]: selecionados.includes(valor)
          ? selecionados.filter((item) => item !== valor)
          : [...selecionados, valor],
      }
    })
  }

  async function handleImagemChange(event) {
    const arquivos = Array.from(event.target.files || [])
    event.target.value = ''

    const arquivosValidos = arquivos.filter((arquivo) => arquivo.type.startsWith('image/') && arquivo.size <= 5 * 1024 * 1024)
    const invalidos = arquivos.length - arquivosValidos.length
    setErrosCampos((atuais) => ({
      ...atuais,
      image: invalidos ? 'Cada arquivo deve ser uma imagem de até 5 MB.' : '',
    }))

    try {
      const novasImagens = await Promise.all(arquivosValidos.map(async (arquivo) => ({
        url: '',
        publicId: '',
        file: arquivo,
        preview: await lerImagemComoDataUrl(arquivo),
      })))
      setForm((atual) => ({ ...atual, images: [...atual.images, ...novasImagens] }))
    } catch (error) {
      setErrosCampos((atuais) => ({ ...atuais, image: error.message }))
    }
  }

  function adicionarImagemUrl() {
    const url = imagemUrlInput.trim()
    try {
      const urlValidada = new URL(url)
      if (!['http:', 'https:'].includes(urlValidada.protocol)) throw new Error()
      setForm((atual) => ({
        ...atual,
        images: [...atual.images, { url, publicId: '', file: null, preview: url }],
      }))
      setImagemUrlInput('')
      setErrosCampos((atuais) => ({ ...atuais, image: '' }))
    } catch {
      setErrosCampos((atuais) => ({ ...atuais, image: 'Informe uma URL válida iniciada por http:// ou https://.' }))
    }
  }

  function removerImagem(indice) {
    setForm((atual) => ({ ...atual, images: atual.images.filter((_, index) => index !== indice) }))
  }

>>>>>>> 4fcfbac (atualização geral)
  function validar() {
    const novosErros = {}

    if (!form.name.trim()) {
      novosErros.name = 'Informe o nome do local.'
    }

    if (!form.type) {
      novosErros.type = 'Selecione o tipo do local.'
    }

    if (!form.status) {
      novosErros.status = 'Selecione o status do local.'
    }

    const capacidadeNumero = Number(form.capacity)
<<<<<<< HEAD
    if (form.capacity === '' || Number.isNaN(capacidadeNumero) || capacidadeNumero <= 0) {
      novosErros.capacity = 'Informe uma capacidade válida (maior que zero).'
    }

    if (form.floor !== '' && Number.isNaN(Number(form.floor))) {
      novosErros.floor = 'O andar deve ser um número.'
=======
    if (form.capacity === '' || !Number.isInteger(capacidadeNumero) || capacidadeNumero <= 0) {
      novosErros.capacity = 'Informe uma capacidade inteira maior que zero.'
    }

    if (form.floor !== '' && !Number.isInteger(Number(form.floor))) {
      novosErros.floor = 'O andar deve ser um número inteiro.'
>>>>>>> 4fcfbac (atualização geral)
    }

    setErrosCampos(novosErros)
    return Object.keys(novosErros).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!validar()) return
    onSalvar(form)
  }

  return (
    <>
<<<<<<< HEAD
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
=======
      <div className="modal d-block local-form-modal" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable local-form-dialog" role="document">
          <div className="modal-content local-form-modal-content">
>>>>>>> 4fcfbac (atualização geral)
            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-header">
                <h5 className="modal-title">{local ? 'Editar local' : 'Novo local'}</h5>
                <button type="button" className="btn-close" onClick={onCancelar} aria-label="Fechar" />
              </div>

              <div className="modal-body">
                {erro && (
                  <div className="alert alert-danger py-2" role="alert">
                    {erro}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="local-name" className="form-label">
                    Nome
                  </label>
                  <input
                    id="local-name"
                    type="text"
                    className={`form-control ${errosCampos.name ? 'is-invalid' : ''}`}
                    value={form.name}
                    onChange={handleChange('name')}
                    required
                  />
                  {errosCampos.name && <div className="invalid-feedback">{errosCampos.name}</div>}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="local-type" className="form-label">
                      Tipo
                    </label>
                    <select
                      id="local-type"
                      className={`form-select ${errosCampos.type ? 'is-invalid' : ''}`}
                      value={form.type}
                      onChange={handleChange('type')}
                      required
                    >
                      <option value="">Selecione...</option>
                      {TIPOS_LOCAL.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                    {errosCampos.type && <div className="invalid-feedback">{errosCampos.type}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="local-status" className="form-label">
                      Status
                    </label>
                    <select
                      id="local-status"
                      className={`form-select ${errosCampos.status ? 'is-invalid' : ''}`}
                      value={form.status}
                      onChange={handleChange('status')}
                      required
                    >
                      <option value="">Selecione...</option>
                      {STATUS_LOCAL.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {errosCampos.status && <div className="invalid-feedback">{errosCampos.status}</div>}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="local-building" className="form-label">
                      Bloco
                    </label>
                    <input
                      id="local-building"
                      type="text"
                      className="form-control"
                      value={form.building}
                      onChange={handleChange('building')}
                    />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label htmlFor="local-floor" className="form-label">
                      Andar
                    </label>
                    <input
                      id="local-floor"
                      type="number"
<<<<<<< HEAD
=======
                      step="1"
>>>>>>> 4fcfbac (atualização geral)
                      className={`form-control ${errosCampos.floor ? 'is-invalid' : ''}`}
                      value={form.floor}
                      onChange={handleChange('floor')}
                    />
                    {errosCampos.floor && <div className="invalid-feedback">{errosCampos.floor}</div>}
                  </div>

                  <div className="col-md-3 mb-3">
                    <label htmlFor="local-capacity" className="form-label">
                      Capacidade
                    </label>
                    <input
                      id="local-capacity"
                      type="number"
                      min="1"
<<<<<<< HEAD
=======
                      step="1"
>>>>>>> 4fcfbac (atualização geral)
                      className={`form-control ${errosCampos.capacity ? 'is-invalid' : ''}`}
                      value={form.capacity}
                      onChange={handleChange('capacity')}
                      required
                    />
                    {errosCampos.capacity && <div className="invalid-feedback">{errosCampos.capacity}</div>}
                  </div>
                </div>

                <div className="mb-1">
                  <label htmlFor="local-description" className="form-label">
                    Descrição
                  </label>
                  <textarea
                    id="local-description"
                    className="form-control"
                    rows="3"
                    value={form.description}
                    onChange={handleChange('description')}
                  />
                </div>
<<<<<<< HEAD
=======

                <fieldset className="mt-3">
                  <legend className="form-label">Fotos do local</legend>
                  <label htmlFor="local-images" className="btn btn-outline-primary mb-2">
                    + Adicionar fotos
                  </label>
                  <input
                    id="local-images"
                    type="file"
                    accept="image/*"
                    multiple
                    className="visually-hidden"
                    onChange={handleImagemChange}
                  />
                  <div className="form-text">Selecione uma ou mais imagens de até 5 MB cada. O envio acontece ao salvar.</div>

                  <label htmlFor="local-image-url" className="form-label mt-3">Adicionar por URL</label>
                  <div className="input-group">
                    <input
                      id="local-image-url"
                      type="url"
                      className={`form-control ${errosCampos.image ? 'is-invalid' : ''}`}
                      placeholder="https://exemplo.com/foto.jpg"
                      value={imagemUrlInput}
                      onChange={(event) => setImagemUrlInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          adicionarImagemUrl()
                        }
                      }}
                    />
                    <button type="button" className="btn btn-outline-primary" onClick={adicionarImagemUrl} aria-label="Adicionar foto por URL">
                      + Adicionar
                    </button>
                  </div>
                  {errosCampos.image && <div className="text-danger small mt-1" role="alert">{errosCampos.image}</div>}

                  {form.images.length > 0 && (
                    <div className="row g-2 mt-2">
                      {form.images.map((imagem, index) => (
                        <div className="col-6 col-md-4" key={`${imagem.publicId || imagem.url || 'nova'}-${index}`}>
                          <div className="border rounded-2 p-2 h-100">
                            <img
                              src={imagem.preview || imagem.url}
                              alt={`Prévia ${index + 1} do local`}
                              className="w-100 rounded-1"
                              style={{ aspectRatio: '4 / 3', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger w-100 mt-2"
                              onClick={() => removerImagem(index)}
                            >
                              Remover foto {index + 1}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </fieldset>

                <fieldset className="local-form-section mt-4">
                  <legend className="fs-6 fw-semibold">Acessibilidade</legend>
                  <div className="row g-2">
                    {ACESSIBILIDADES_LOCAL.map((opcao, index) => (
                      <div className="col-md-6" key={opcao}>
                        <div className="form-check">
                          <input
                            id={`acessibilidade-${index}`}
                            className="form-check-input"
                            type="checkbox"
                            checked={form.accessibility.includes(opcao)}
                            onChange={() => handleCheckboxChange('accessibility', opcao)}
                          />
                          <label className="form-check-label" htmlFor={`acessibilidade-${index}`}>
                            {opcao}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mt-4">
                  <legend className="fs-6 fw-semibold">Equipamentos e recursos</legend>
                  <div className="row g-2">
                    {RECURSOS_LOCAL.map((opcao, index) => (
                      <div className="col-md-6" key={opcao}>
                        <div className="form-check">
                          <input
                            id={`recurso-${index}`}
                            className="form-check-input"
                            type="checkbox"
                            checked={form.resources.includes(opcao)}
                            onChange={() => handleCheckboxChange('resources', opcao)}
                          />
                          <label className="form-check-label" htmlFor={`recurso-${index}`}>
                            {opcao}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </fieldset>
>>>>>>> 4fcfbac (atualização geral)
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={salvando}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={salvando}>
                  {salvando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  )
}
