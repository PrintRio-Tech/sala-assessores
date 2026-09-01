# Auditoria de tokens — Sala de Assessores

Escopo: arquivos-fonte em `src/**/*.css` e `src/**/*.scss`; `dist/` foi excluído.

- Antes: 168 ocorrências candidatas de cores, tamanhos, espaçamentos, sombras ou tipografia hardcoded.
- Componentes de tabela/paginação locais removidos em favor de `DataTable` e `Pagination` do `@print/ui`; suas regras de borda, radius, espaçamento, célula de pessoa e controles não são mais mantidas pela Sala.
- Tokens adotados na superfície alterada: `@print/ui/tokens` (`$on-surface`, `$on-surface-variant`, `$outline-variant`, `$surface`, `$surface-bright`, `$primary`, `$surface-container-high`, `$accent-gold`, `$space-1`, `$space-2`, `$space-3`).

Allowlist estrutural temporária: `1px` (espessura de borda), percentuais/frações de grid, `clamp()`, `calc()`, offsets de posicionamento e breakpoints. Valores de cores/status e pesos intermediários restantes exigem o aditivo solicitado ao print-ui; não foram convertidos em tokens locais.
