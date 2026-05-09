# CHANGES

- 2026-05-09: Corrigi a deduplicação da fila de `group-participants.update` para considerar também a ação (`add`, `remove`, `promote`, `demote`), preservando transições de estado necessárias e evitando retenção indevida de privilégios de admin no banco local.
