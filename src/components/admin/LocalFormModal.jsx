import { useEffect, useState } from 'react'
import { TIPOS_LOCAL, STATUS_LOCAL } from '../../services/locationService'

const ESTADO_INICIAL = {
  name: '',
  type: '',
  building: '',
  floor: '',
  capacity: '',
  description: '',
  status: '',
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

  if (!aberto) return null

  function handleChange(campo) {
    return (event) => {
      setForm((atual) => ({ ...atual, [campo]: event.target.value }))
    }
  }

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
    if (form.capacity === '' || Number.isNaN(capacidadeNumero) || capacidadeNumero <= 0) {
      novosErros.capacity = 'Informe uma capacidade válida (maior que zero).'
    }

    if (form.floor !== '' && Number.isNaN(Number(form.floor))) {
      novosErros.floor = 'O andar deve ser um número.'
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
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
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
