function Solicitacoes({
    abaSolicitacoes,
    setAbaSolicitacoes,
    solicitacoesAtivas,
    solicitacoesArquivadas,
    solicitacoesExibidas,
    carregandoSolicitacoes,
    abrirCancelar,
    abrirReativar,
    abrirExcluirSolicitacao,
    abrirArquivar,
    abrirDesarquivar,
    STATUS_SOLICITACAO,
    STATUS_SOLICITACAO_LABELS,
    STATUS_SOLICITACAO_CORES,
}) {
    const ordemStatus = [
        { status: STATUS_SOLICITACAO.PENDENTE, titulo: 'Pendentes' },
        { status: STATUS_SOLICITACAO.EM_PROCESSO, titulo: 'Em processo' },
        { status: STATUS_SOLICITACAO.APROVADA, titulo: 'Aprovadas' },
        { status: STATUS_SOLICITACAO.REJEITADA, titulo: 'Rejeitadas' },
        { status: STATUS_SOLICITACAO.CANCELADA, titulo: 'Canceladas' },
    ]

    const gruposSolicitacoes = ordemStatus
        .map(({ status, titulo }) => ({
            status,
            titulo,
            itens: solicitacoesExibidas.filter((solicitacao) => solicitacao.status === status),
        }))
        .filter((grupo) => grupo.itens.length > 0)

    const renderBotaoAcao = (solicitacao) => {
        if (solicitacao.status === STATUS_SOLICITACAO.PENDENTE) {
            return (
                <button type="button" className="btn btn-sm btn-action btn-action-danger" onClick={() => abrirCancelar(solicitacao)}>
                    Cancelar
                </button>
            )
        }

        if (solicitacao.status === STATUS_SOLICITACAO.CANCELADA || solicitacao.status === STATUS_SOLICITACAO.REJEITADA) {
            return (
                <>
                    <button type="button" className="btn btn-sm btn-action btn-action-warning" onClick={() => abrirReativar(solicitacao)}>
                        Tentar novamente
                    </button>
                    <button type="button" className="btn btn-sm btn-action btn-action-danger" onClick={() => abrirExcluirSolicitacao(solicitacao)}>
                        Excluir
                    </button>
                </>
            )
        }

        if (solicitacao.status === STATUS_SOLICITACAO.ARQUIVADA) {
            return (
                <button type="button" className="btn btn-sm btn-action btn-action-success" onClick={() => abrirDesarquivar(solicitacao)}>
                    Desarquivar
                </button>
            )
        }

        return (
            <button type="button" className="btn btn-sm btn-action btn-action-secondary" onClick={() => abrirArquivar(solicitacao)}>
                Arquivar
            </button>
        )
    }

    return (
        <div className="card shell-card">
            <div className="tab-content">
                <div className="section-header">
                    <div>
                        <span className="eyebrow">Solicitações</span>
                        <h3 className="h5 mb-0">Minhas reservas</h3>
                    </div>
                </div>

                <div className="tabs-inline user-tabs">
                    <button
                        type="button"
                        className={`tab-button ${abaSolicitacoes === 'ativas' ? 'active' : ''}`}
                        onClick={() => setAbaSolicitacoes('ativas')}
                    >
                        Ativas
                        <span className="tab-count">{solicitacoesAtivas.length}</span>
                    </button>
                    <button
                        type="button"
                        className={`tab-button ${abaSolicitacoes === 'arquivadas' ? 'active' : ''}`}
                        onClick={() => setAbaSolicitacoes('arquivadas')}
                    >
                        Arquivadas
                        <span className="tab-count">{solicitacoesArquivadas.length}</span>
                    </button>
                </div>

                {carregandoSolicitacoes ? (
                    <div className="d-flex justify-content-center py-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Carregando...</span>
                        </div>
                    </div>
                ) : solicitacoesExibidas.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        {abaSolicitacoes === 'ativas'
                            ? 'Você ainda não possui solicitações ativas.'
                            : 'Nenhuma solicitação arquivada.'}
                    </div>
                ) : (
                    <div className="request-groups">
                        {gruposSolicitacoes.map((grupo) => (
                            <div key={grupo.status} className="request-group">
                                <div className="request-group-header">
                                    <span className="request-group-title">{grupo.titulo}</span>
                                    <span className="request-group-count">{grupo.itens.length}</span>
                                </div>

                                <div className="request-group-list">
                                    {grupo.itens.map((solicitacao) => (
                                        <div key={solicitacao.id} className="reservation-item">
                                            <div className="request-header">
                                                <div className="request-main">
                                                    <div className="request-title-row">
                                                        <strong>{solicitacao.localNome}</strong>
                                                        <span className={`badge ${STATUS_SOLICITACAO_CORES[solicitacao.status] || 'bg-secondary'}`}>
                                                            {STATUS_SOLICITACAO_LABELS[solicitacao.status] || solicitacao.status}
                                                        </span>
                                                    </div>
                                                    <div className="small text-muted mt-1">
                                                        Data: {new Date(solicitacao.dataReserva + 'T12:00:00').toLocaleDateString('pt-BR')} | Horário: {solicitacao.horarioInicio} - {solicitacao.horarioFim}
                                                    </div>
                                                    <div className="small text-muted mt-1">
                                                        Propósito: {solicitacao.proposito}
                                                    </div>
                                                    {solicitacao.observacaoAdmin && (
                                                        <div className="small mt-2 p-2 alert-light rounded">
                                                            <strong>Observação do Admin:</strong> {solicitacao.observacaoAdmin}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="request-actions">
                                                    {renderBotaoAcao(solicitacao)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Solicitacoes
