function Perfil({ nomeExibido, email, perfilLabel, proximasReservas }) {
    return (
        <div className="card shell-card"><div className="tab-content">
            <div className="section-header"><div><span className="eyebrow">Resumo</span><h3 className="h5 mb-0">Perfil e atividades</h3></div></div>
            <div className="row g-3">
                <div className="col-lg-6"><div className="card info-card h-100"><div className="card-body"><h4 className="h6 mb-3">Dados do usuário</h4><div className="profile-list"><div><span>Nome</span><strong>{nomeExibido}</strong></div><div><span>E-mail</span><strong>{email}</strong></div><div><span>Tipo</span><strong>{perfilLabel}</strong></div><div><span>Status</span><strong>Ativo</strong></div></div></div></div></div>
                <div className="col-lg-6"><div className="card info-card h-100"><div className="card-body"><h4 className="h6 mb-3">Próximas reservas</h4>{proximasReservas.length === 0 ? <p className="text-muted mb-0">Nenhuma reserva cadastrada no momento.</p> : <div className="timeline-list">{proximasReservas.map((solicitacao) => <div key={solicitacao.id} className="timeline-item"><span className="dot dot-success" /><div><strong>{solicitacao.localNome}</strong><div className="small text-muted">{new Date(solicitacao.dataReserva + 'T12:00:00').toLocaleDateString('pt-BR')} • {solicitacao.horarioInicio} - {solicitacao.horarioFim}</div></div></div>)}</div>}</div></div></div>
            </div>
            <div className="card info-card mt-3"><div className="card-body"><h4 className="h6 mb-3">Dicas do sistema</h4><div className="tips-grid"><div className="tip-item"><span className="tip-number">01</span><p>Confira sempre o calendário antes de enviar a reserva para evitar conflitos.</p></div><div className="tip-item"><span className="tip-number">02</span><p>Use observações claras no propósito para agilizar a análise do administrador.</p></div><div className="tip-item"><span className="tip-number">03</span><p>Se uma reserva for cancelada, você pode reativá-la facilmente na aba de solicitações.</p></div></div></div></div>
        </div></div>
    )
}

export default Perfil
