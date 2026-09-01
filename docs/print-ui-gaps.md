# Inventário de adoção do `@print/ui`

Sala de Assessores consome o pacote por `@print/ui` sem alterações no repositório da biblioteca. A densidade e as composições de domínio permanecem locais.

## Componentes usados de fato

| Componente | Uso |
| --- | --- |
| `AppShell` + `AppNavItem` | shell lateral controlado, navegação Demandas/Jornalistas e conteúdo fluido |
| `Avatar`, `Text`, `Icon`, `ICONS` | marca, usuário da coordenação e ícones compartilhados |
| `Button` | ações primárias, secundárias, outline, ghost e limpeza de filtros |
| `TextInput`, `SelectField`, `DatePicker` | busca, status, responsável e prazo |
| `Tabs`, `TabsList`, `TabsTrigger` | alternância entre demandas ativas e histórico |
| `Badge` | contadores, status e metadados; tones são mapeados no produto |
| `Heading`, `Text` | hierarquia tipográfica básica |
| `Card`, `Stat` | resumo/stream e KPIs simples |
| `EmptyState` | resultados filtrados e entidades ausentes |
| CSS/tokens | `@print/ui/css`, `@print/ui/style` e variáveis `--pf-*` |

## Composições locais legítimas

- tabela densa de demandas e suas colunas de domínio;
- FilterBar que apenas organiza primitives do DS;
- resumo contextual e activity stream da demanda;
- hero e contato do jornalista;
- sparkline, progresso e KPIs compostos;
- foco de cobertura, espectro de tom e traits;
- histórico recente do jornalista;
- mapas locais `status → Badge tone` e prioridade → label;
- grid, densidade e ritmo vertical das páginas.

## Backlog de gaps no print-ui

1. **`AppNavItem.disabled`**: opcional, muted, `aria-disabled`, sem navegação e tooltip “Em breve” quando recolhido. Aditivo e opt-in; útil para Sala, Forms e Adm.
2. **Timeline / ActivityStream genérico**: slots `icon`, `title`, `meta`, `time`, `children`; componente novo e sem estados de demanda.
3. **FilterToolbar / FiltersBar layout-only**: apenas slots e responsividade, sem filtros de domínio.
4. **Extensões de `Stat`**: `description?`, `trend?`, `footer?`; aditivas.
5. **Indicador opcional em `Badge`**: dot visual sem criar `StatusBadge` de domínio.
6. **ToneSlider / Spectrum**: labels mínimo/máximo e valor; sem nome ou semântica editorial específica da Sala.

Nenhum gap foi implementado no `print-ui` nesta consolidação.
