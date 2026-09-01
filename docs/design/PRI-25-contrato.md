# PRI-25: Lista e detalhe de demandas — contrato visual

## Resumo

Implementação dos requisitos de densidade, empty states e rail contextual conforme especificado em PRI-25.

## Mudanças implementadas

### Lista de demandas (`/demandas`)

#### Densidade visual
- Filtros mantêm altura compacta (46px) com labels superiores pequenos
- Tabela preserva densidade com linhas de 72-80px
- Primeira coluna dominante com título e metadados secundários
- Separadores de 1px mantidos
- Paginação acessível com contador detalhado

#### Empty state
- Estado vazio rico implementado quando não há resultados
- Três variantes contextuais:
  - **Sem filtros ativos**: "Comece criando uma nova demanda acima"
  - **Com filtros ativos**: "Ajuste ou limpe os filtros para ver outros resultados"
  - **Histórico vazio**: "Ainda não há demandas finalizadas no histórico"
- Layout centralizado com ícone, título e descrição
- Mínimo de 420px de altura para presença visual adequada

#### Código
```tsx
{pagedData.length === 0 && !isLoading ? (
  <div className={styles.emptyState}>
    <Icon name="search" />
    <div className={styles.emptyContent}>
      <h3>Nenhuma demanda encontrada</h3>
      <p>{hasActiveFilters ? '...' : lifecycle === 'history' ? '...' : '...'}</p>
    </div>
  </div>
) : (
  <DataTable ... />
)}
```

### Detalhe da demanda (`/demandas/:demandId`)

#### Rail contextual elevado

O rail lateral agora apresenta **separação explícita** entre três conceitos distintos:

1. **Estado atual**: onde a demanda está agora
   - Card dedicado "Estado atual"
   - Exibe status e prazo
   - Não conflita com última decisão

2. **Última decisão registrada**: decisão atribuída (aprovação, ajustes, rejeição)
   - Card próprio separado
   - Mostra decisão e justificativa
   - Data e responsável vêm da timeline

3. **Último resultado de interação** (condicional)
   - Card exibido somente quando há interação registrada
   - Mostra resultado da última interação externa

4. **Próximo passo registrado** (condicional)
   - Card exibido somente quando há próximo passo
   - Origem pode ser enriquecimento ou interação

5. **Posicionamento final**: artefato enviado
   - Card dedicado "Posicionamento final"
   - **Ausência explícita** quando não registrado:
     - Ícone e mensagem "Sem posicionamento final registrado"
     - "Artefato final ainda não registrado nesta demanda"
   - Quando presente: canal, destinatário, corpo e data

#### Eventos fora da plataforma

- Campo `attribution` no viewmodel inclui "Fora da plataforma"
- Participantes aparecem quando disponíveis
- Origem é explícita em cada evento externo da timeline
- Exemplo: `"Fora da plataforma · Participantes: Maria Clara; Redação"`

#### Código
```tsx
<Card variant="surface" padding="lg">
  <Heading level={2} variant="sm">Última decisão registrada</Heading>
  <div className={styles.railSection}>
    <Text tone="muted">{demand.currentState.latestDecisionSummary}</Text>
  </div>
</Card>
{demand.currentState.latestInteractionResult ? (
  <Card ...>Último resultado de interação</Card>
) : null}
{demand.currentState.latestRecordedNextStep ? (
  <Card ...>Próximo passo registrado</Card>
) : null}
<Card ...>
  <Heading level={2} variant="sm">Posicionamento final</Heading>
  <Positioning demand={demand} />
</Card>
```

## Testes

### Navegação lista ↔ detalhe
- Novo teste específico adicionado
- Valida navegação de lista para detalhe e retorno
- Confirma preservação de filtros ao retornar
- Integração com testes existentes de fluxo completo

### Cobertura de empty state
- Estado vazio é renderizado quando `pagedData.length === 0`
- Mensagens contextuais testadas indiretamente pelos testes de filtro
- Teste de "clear filters" valida transição de vazio para populado

### Rail contextual
- Testes existentes validam separação entre decisão e estado atual
- Posicionamento ausente já testado: "Sem posicionamento final registrado"
- Eventos externos com "Fora da plataforma" validados em múltiplos pontos

## Arquivos modificados

- `src/ui/pages/DemandsPage.tsx` — empty state condicional
- `src/ui/pages/DemandDetailPage.tsx` — rail contextual elevado, remoção de `LatestRecords`
- `src/ui/styles/design.module.scss` — estilos de empty state
- `src/ui/pages/demand-detail.module.scss` — simplificação, `railSection`
- `src/ui/pages/DemandsPage.test.tsx` — teste de navegação lista↔detalhe
- `docs/design/PRI-25-contrato.md` — este documento

## Sem mudanças

- ViewModels já implementavam separação correta
- Densidade visual já estava adequada
- Origem "Fora da plataforma" já estava no viewmodel
- Testes de fluxo existentes já cobriam navegação básica

## Próximos passos (fora de escopo)

- Screenshots reais requerem ambiente configurado com `@print/ui` autenticado
- Build e deploy visual aguardam configuração de secrets
- Validação manual em navegador requer dev server funcional
