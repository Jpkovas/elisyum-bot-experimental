# TODO

- Consider moving the blocked contacts cache into a dedicated helper to eliminate the dynamic import used for invalidation.
- Reavaliar a necessidade de instalar dependências peer opcionais do Baileys 7 (como sharp) para recursos de mídia aprimorados.
- Monitorar o novo fluxo baseado em chamadas diretas ao binário do FFmpeg e preparar fallback/documentação caso plataformas sem `@ffmpeg-installer/ffmpeg` apresentem erros.
- Mapear os novos eventos de newsletter do Baileys 7 para handlers (ou logs) específicos antes de habilitar fluxos de interação com canais.
