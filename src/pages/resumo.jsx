function Resumo({ nomeExibido, usuarioAtual, perfilLabel, tipoUsuario, reservasPendentes, reservasAprovadas, reservasCanceladas, solicitacoesArquivadas }) {
    return (
        <div className="space-y-4">
            <div className="card shell-card profile-card"><div className="card-body profile-body"><div><span className="eyebrow">Acesso</span><h2 className="h3 mb-2">Olá, {nomeExibido}!</h2></div><div className="profile-meta"><div className="profile-item"><span className="label">E-mail</span><strong>{usuarioAtual?.email}</strong></div><div className="profile-item"><span className="label">Perfil</span><span className="user-badge">{perfilLabel}</span></div></div>{tipoUsuario === 'professor' && <div className="alert alert-info py-2 small mb-0" role="alert">Você está acessando como professor. Seu perfil é de usuário comum, sem privilégios de administrador.</div>}{tipoUsuario === 'aluno' && <div className="alert alert-light border py-2 small mb-0" role="alert">Você está acessando como aluno.</div>}</div></div>
            <div className="stat-grid mb-0"><div className="stat-card"><span className="stat-label">Pendentes</span><strong className="stat-value warning">{reservasPendentes}</strong></div><div className="stat-card"><span className="stat-label">Aprovadas</span><strong className="stat-value success">{reservasAprovadas}</strong></div><div className="stat-card"><span className="stat-label">Canceladas</span><strong className="stat-value muted">{reservasCanceladas}</strong></div><div className="stat-card"><span className="stat-label">Arquivadas</span><strong className="stat-value">{solicitacoesArquivadas.length}</strong></div></div>
        </div>
    )
}

export default Resumo
