# CHANGES

- Endureci o fluxo de atualização: agora o bot só aplica update automático quando `LBOT_AUTO_UPDATE=true`, evitando atualização remota silenciosa no startup.
- O updater passou a exigir asset ZIP com nome esperado e arquivo de checksum SHA-256 correspondente antes de extrair qualquer conteúdo.
