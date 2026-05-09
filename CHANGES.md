# CHANGES

- Corrigi o fluxo do comando público `yt` para rejeitar vídeos acima de 16MB em vez de acionar compressão automática pesada, reduzindo risco de exaustão de CPU/disco/memória.
- Mantive o envio do vídeo apenas para buffers que já respeitam o limite do WhatsApp, preservando o fluxo normal para casos válidos.
