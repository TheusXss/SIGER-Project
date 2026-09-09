export default function ConfirmDialog({
  aberto,
  titulo = 'Confirmar ação',
  mensagem,
  erro,
  confirmando = false,
  onCancelar,
  onConfirmar,
}) {
  if (!aberto) return null

  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{titulo}</h5>
              <button type="button" className="btn-close" onClick={onCancelar} aria-label="Fechar" />
            </div>
            <div className="modal-body">
              {erro && (
                <div className="alert alert-danger py-2" role="alert">
                  {erro}
                </div>
              )}
              <p className="mb-0">{mensagem}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={confirmando}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={onConfirmar} disabled={confirmando}>
                {confirmando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  )
}
