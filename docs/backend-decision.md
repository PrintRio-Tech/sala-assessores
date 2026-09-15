# Decisão arquitetural — backend da Sala de Assessores

Data: 2026-08-11  
Escopo: recomendação para a primeira entrega executável do frontend. **Sem scaffold de backend.**

## Contexto observado

- Sala de Assessores e Print podem atender **clientes distintos**.
- Hoje **não há conversa funcional** entre os produtos (sem Activity/Release/GraphQL compartilhados).
- Dados podem ficar **hospedados no cliente** (on-premise / múltiplos serviços na mesma máquina).
- O frontend já isola I/O atrás de **ports + adapters mock**, permitindo trocar a origem dos dados depois.

Hipótese inicial do produto: **backend e banco próprios**, compartilhando apenas padrões e eventualmente identidade.

## Alternativas comparadas

| Opção | Prós | Contras |
| --- | --- | --- |
| **A. Reutilizar print-backend** | Menos código novo; padrões GraphQL/tenant já existentes | Acopla domínio e release cycle; tenancy Print não mapeia 1:1; risco de misturar contratos Activity/Release com Demanda/Jornalista; clientes distintos complicam isolamento |
| **B. Serviço separado + banco próprio (recomendada)** | Fronteira de domínio clara; backups/migrações independentes; deploy on-prem por cliente sem carregar Print; evolução própria de contratos | Mais um artefato para operar; precisa padronizar auth/observabilidade |
| **C. Mesmo artefato, deployments/bancos isolados** | Um código, várias instâncias | Ainda compartilha schema/release; regressões cross-produto; isolamento operacional falso se o modelo for único |

## Recomendação

**Opção B — serviço e banco próprios para Sala de Assessores.**

Validação da hipótese: **confirmada** pelos fatores de clientes distintos, ausência de integração funcional e necessidade de hospedagem no cliente com vários serviços na mesma máquina. Reutilizar print-backend só faria sentido se houvesse integração forte de domínio/tenancy no curto prazo — o que a POC explicitamente evita.

Compartilhar com Print, neste momento:

- padrões (Clean Architecture, contratos versionados, observabilidade, Docker Compose patterns);
- eventualmente **identidade** (IdP/OIDC) se/quando houver SSO corporativo;
- **não** compartilhar schema GraphQL, banco nem filas.

## Fronteiras de domínio (contratos iniciais)

Agregados do frontend já modelados e substituíveis:

- `Demand` — ciclo `in_progress` → `sent` | `closed_without_send`. Tem `positioning` (texto atual + versões + aprovação opcional do texto).
- `ExternalInteraction` — `origin: off_platform`. `approved` marca o posicionamento atual. `response_sent` / `closed_without_send` fecham o caso. Sem resultado `resolved`.
- `Journalist` — cadastro + histórico objetivo
- `RelationshipEvaluation` — **exige autor + data**; nunca inferida

Ports atuais: `DemandRepository`, `JournalistRepository` (implementação mock em `infrastructure/`).

## Tenancy, migração, backups

- Tenancy: **um banco (ou schema) por instalação/cliente** na fase on-prem; multi-tenant lógico só se surgir SaaS compartilhado.
- Migrações: tool próprio do serviço (ex.: Drizzle/Flyway) **desacoplado** do print-backend.
- Backups: job por volume/banco do serviço; RPO/RTO definidos por cliente, não acoplados ao Print.

## Configuração, segredos, portas e Compose

Decisões ainda abertas (explícitas):

1. Porta HTTP padrão do API (sugestão local: `4010`) vs conflito com outros serviços Print na mesma máquina.
2. Estratégia de segredos (env file local vs vault do cliente).
3. Reverse proxy único (Caddy/Nginx/Traefik) para `app` + `api` + futuros serviços.
4. Auth: sessão própria vs OIDC compartilhado.
5. Persistência: Postgres dedicado vs SQLite embutido para POC on-prem leve.

Esboço Compose (não implementado):

```yaml
services:
  sala-assessores-web:
    # Vite/static build
  sala-assessores-api:
    # futuro serviço próprio
  sala-assessores-db:
    # volume nomeado por cliente/instalação
```

## Riscos

- Copiar vocabulário Print Forms sem copiar contratos pode confundir stakeholders — manter glossário local.
- Adiar demais o backend próprio pode cristalizar mocks demais; mitigações: ports estáveis + DTOs versionados.
- Identidade compartilhada prematura cria acoplamento operacional.

## Próximo passo (quando autorizado)

Definir OpenAPI/GraphQL mínimo para `list/get Demand` e `get Journalist`, escolhendo stack do serviço **sem** reutilizar o schema Print.
