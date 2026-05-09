# CHANGES

- Adicionei limites de segurança na conversão de WebP para PNG no fluxo de stickers (tamanho máximo de entrada/saída, timeout curto no ffmpeg e limpeza robusta de arquivos temporários) para reduzir risco de DoS por mídia maliciosa.
