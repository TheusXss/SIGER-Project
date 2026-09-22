function NovaReserva({
    locais,
    hojeIso,
    localSelecionado,
    setLocalSelecionado,
    dataReserva,
    setDataReserva,
    horarioInicio,
    setHorarioInicio,
    horarioFim,
    setHorarioFim,
    proposito,
    setProposito,
    enviando,
    erroEnvio,
    sucessoEnvio,
    handleEnviarSolicitacao,
}) {
    return (
        <div className="card shell-card">
            <div className="tab-content">
                <div className="section-header">
                    <div>
                        <span className="eyebrow">Reservas</span>
                        <h3 className="h5 mb-0">Solicitar espaço</h3>
                    </div>
                </div>

                {sucessoEnvio && <div className="alert alert-success py-2" role="alert">{sucessoEnvio}</div>}
                {erroEnvio && <div className="alert alert-danger py-2" role="alert" style={{ whiteSpace: 'pre-line' }}>{erroEnvio}</div>}

                <div className="info-banner mb-3">
                    <strong>Agenda rápida:</strong> escolha o local, a data e o horário para reservar em poucos segundos.
                </div>

                <form onSubmit={handleEnviarSolicitacao}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label htmlFor="local" className="form-label">Local</label>
                            <select id="local" className="form-select" value={localSelecionado} onChange={(event) => setLocalSelecionado(event.target.value)}>
                                <option value="">Selecione um local</option>
                                {locais.map((local) => <option key={local.id} value={local.id}>{local.name} - {local.type}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="data" className="form-label">Data da Reserva</label>
                            <input id="data" type="date" className="form-control" min={hojeIso} value={dataReserva} onChange={(event) => setDataReserva(event.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="horario-inicio" className="form-label">Horário de Início</label>
                            <input id="horario-inicio" type="time" className="form-control" value={horarioInicio} onChange={(event) => setHorarioInicio(event.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="horario-fim" className="form-label">Horário de Término</label>
                            <input id="horario-fim" type="time" className="form-control" value={horarioFim} onChange={(event) => setHorarioFim(event.target.value)} />
                        </div>
                        <div className="col-12">
                            <label htmlFor="proposito" className="form-label">Propósito / Observação</label>
                            <textarea id="proposito" className="form-control" rows="3" value={proposito} onChange={(event) => setProposito(event.target.value)} placeholder="Descreva o motivo da reserva (ex: aula prática, reunião de projeto, etc.)" />
                        </div>
                        <div className="col-12 d-flex justify-content-end">
                            <button type="submit" className="btn btn-primary" disabled={enviando}>
                                {enviando ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Enviando...</> : 'Enviar Solicitação'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default NovaReserva
