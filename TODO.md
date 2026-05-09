# TODO

- Acompanhar o issue upstream do Baileys sobre o fallback para `jimp` (tipo de export diferente) para eventualmente eliminar a exigência do `sharp` em ambientes limitados.
- Avaliar as vulnerabilidades apontadas pelo `npm audit` e planejar atualizações das dependências obsoletas.
- Definir fluxos ativos para newsletters (seguir, reagir, enviar mensagens) reutilizando os logs atuais como base para requisitos.
- Implementar expiração automática para membros silenciados após um período configurável, revertendo o mute sem intervenção manual.
- Monitorar o impacto das chamadas extras do `ensureParticipantRecord` nos fluxos de atividade/antiflood e avaliar se vale consolidar a criação com os updates para reduzir round-trips em grupos grandes.
- Converter os roteiros de `scripts/manual-tests` em testes automatizados sempre que possível para cobrir regressões de mídia no CI.
- Adicionar testes automatizados para timeouts/limpeza de temporários em conversões ffmpeg e rejeições por tamanho nos fluxos de mídia.
- Avaliar assinatura criptográfica das releases para complementar a validação por checksum SHA-256 do updater.
- Evoluir a instalação Termux com verificação de integridade do script baixado antes da execução.
