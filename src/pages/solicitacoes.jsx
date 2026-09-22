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
    return (
        <div className="card shell-card">
            <div className="tab-content">
                <div className="section-header"><div><span className="eyebrow">Solicitações</span><h3 className="h5 mb-0">Minhas reservas</h3></div></div>
                <ul className="nav nav-pills mb-3 tabs-inline">
                    <li className="nav-item"><button type="button" className={`nav-link ${abaSolicitacoes === 'ativas' ? 'active' : ''}`} onClick={() => setAbaSolicitacoes('ativas')}>Ativas ({solicitacoesAtivas.length})</button></li>
                    <li className="nav-item"><button type="button" className={`nav-link ${abaSolicitacoes === 'arquivadas' ? 'active' : ''}`} onClick={() => setAbaSolicitacoes('arquivadas')}>Arquivadas ({solicitacoesArquivadas.length})</button></li>
                </ul>

                {carregandoSolicitacoes ? <div className="d-flex justify-content-center py-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Carregando...</span></div></div> : solicitacoesExibidas.length === 0 ? <div className="text-center text-muted py-4">{abaSolicitacoes === 'ativas' ? 'Você ainda não possui solicitações ativas.' : 'Nenhuma solicitação arquivada.'}</div> : (
                    <div className="d-flex flex-column gap-3">
                        {solicitacoesExibidas.map((solicitacao) => (
                            <div key={solicitacao.id} className="reservation-item"><div className="request-header"><div className="request-main"><div className="request-title-row"><strong>{solicitacao.localNome}</strong><span className={`badge ${STATUS_SOLICITACAO_CORES[solicitacao.status] || 'bg-secondary'}`}>{STATUS_SOLICITACAO_LABELS[solicitacao.status] || solicitacao.status}</span></div><div className="small text-muted mt-1">Data: {new Date(solicitacao.dataReserva + 'T12:00:00').toLocaleDateString('pt-BR')} | Horário: {solicitacao.horarioInicio} - {solicitacao.horarioFim}</div><div className="small text-muted mt-1">Propósito: {solicitacao.proposito}</div>{solicitacao.observacaoAdmin && <div className="small mt-2 p-2 alert-light rounded"><strong>Observação do Admin:</strong> {solicitacao.observacaoAdmin}</div>}</div>
                                <div className="request-actions">
                                    {solicitacao.status === STATUS_SOLICITACAO.PENDENTE && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => abrirCancelar(solicitacao)}>Cancelar</button>}
                                    {solicitacao.status === STATUS_SOLICITACAO.CANCELADA && <><button type="button" className="btn btn-sm btn-outline-warning" onClick={() => abrirReativar(solicitacao)}>Tentar novamente</button><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => abrirExcluirSolicitacao(solicitacao)}>Excluir</button></>}
                                    {solicitacao.status !== STATUS_SOLICITACAO.ARQUIVADA && <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => abrirArquivar(solicitacao)}>Arquivar</button>}
                                    {solicitacao.status === STATUS_SOLICITACAO.ARQUIVADA && <button type="button" className="btn btn-sm btn-outline-success" onClick={() => abrirDesarquivar(solicitacao)}>Desarquivar</button>}
                                </div>
                            </div></div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Solicitacoes
