# Sala de Assessores — contrato visual desktop

## Direção única

A UI principal parte de uma única família desktop larga. As explorações rejeitadas e a camada legacy foram removidas. Domínio, aplicação, infraestrutura, mocks e testes permanecem preservados.

O sistema principal é formado por:

| Tela | Modelo contratual | Elementos preservados |
| --- | --- | --- |
| Lista de demandas | `modelos/image copy 3.png` | header horizontal, título e ações na mesma faixa, filtros compactos, tabs sublinhadas e tabela densa |
| Detalhe da demanda | `modelos/image copy 4.png` | cabeçalho compacto, histórico cronológico dominante e rail contextual com estado, responsável, prazo, contexto e lacunas |
| Perfil do jornalista | `modelos/image copy.png` | hero de identidade, ações, KPIs compactos, contato, foco de cobertura, perfil atribuído e histórico largo |

Os modelos verticais `image.png` e `image copy 2.png` pertencem à mesma linguagem de cor e acabamento, mas mudam navegação, grid e fluxo. Eles informam apenas pequenos detalhes de contato e timeline. `image copy 5.png` está vazio e não estabelece decisões.

## Contrato mensurável

- Viewports-alvo: `1440 × 1000` e `1600 × 1000`; não há escopo mobile nesta rodada.
- Largura útil: `AppShell contentWidth="fluid"`, com conteúdo amplo e margens locais de 40 px.
- Navegação: sidebar real do `AppShell`, expandida em 256 px e recolhida em 72 px.
- Tipografia: uma única família sans geométrica; corpo 14–16 px, labels 11–12 px em caixa alta, títulos de página 36–40 px e título de detalhe até 48 px.
- Controles: 46–50 px de altura; filtros alinhados numa única faixa e com rótulo superior compacto.
- Tabela: cabeçalho de 48–52 px, linhas de 72–80 px, primeira coluna dominante e separadores de 1 px.
- Grid: detalhe em aproximadamente 30/70, com rail contextual à esquerda e timeline dominante à direita; perfil com hero integral, linha de KPIs/contato e duas colunas equilibradas antes do histórico integral.
- Superfícies: fundo marfim, branco quente, verde profundo e tintas sálvia/dourado/vermelho apenas para semântica.
- Bordas e raios: bordas cinza-esverdeadas muito leves; raios de 12–18 px em superfícies e 8–12 px em controles.
- Sombras: apenas elevação curta e difusa em ações ou superfícies principais; nunca “cards flutuantes” genéricos.
- Movimento: feedback de pressão em 140 ms e transições de cor/fundo curtas; nenhuma animação ornamental recorrente.

## Desvios conscientes

1. O conteúdo é traduzido para o domínio real de assessoria de imprensa e mantém os contratos/mocks existentes, em vez dos textos genéricos em inglês dos modelos.
2. O detalhe não replica ações “Accept/Decline”; apresenta ações coerentes com a jornada documentada e sem simular aprovações executadas pela plataforma.
3. A foto do jornalista será um asset local consistente e discreto; não haverá avatar de iniciais dominante.
4. `@print/ui` continua carregado para tokens/primitives compatíveis, mas a composição visual será local quando a abstração impedir fidelidade.

## Arquitetura permanente do detalhe

O detalhe canônico em `/demandas/:demandId` usa **histórico como espinha dorsal**. O cabeçalho responde o que é a demanda; o rail concentra responsável, prioridade, prazo e contexto; a timeline reconstrói o que aconteceu em ordem cronológica.

Os eventos preservam diferenças contratuais que não podem ser reduzidas a um único “status”:

- `Em andamento` é o estado do caso aberto; qualquer interação cabe.
- Recusa, aprovação, encaminhamento e ajustes são **resultados de interação** e não mudam o status.
- telefonema, e-mail, consulta e parecer são fatos ocorridos fora da plataforma e aparecem como tal;
- `Resposta enviada` e `Encerrado sem resposta` fecham o caso (`sent` / `closed_without_send`);
- próximos passos são registros das interações, não automações nem ordens executadas pela plataforma.

O acompanhamento ativo tem **posicionamento** (texto da resposta, sempre visível no detalhe, com versões) e **Registrar interação** (fatos fora da Sala). Encerrar sem resposta e registrar envio acontecem como resultados do drawer de interação. Não há motor interno de review nem Solicitar revisão.

## Auditoria inicial da família

| Antes | Depois | Por quê |
| --- | --- | --- |
| Três explorações com tipografia, densidade e navegação diferentes | Um único AppShell lateral e uma escala tipográfica | Coesão precede variedade; a interface deve parecer um produto, não uma montagem |
| Cards genéricos como unidade dominante | Tabela, resumo contextual, stream e histórico como estruturas específicas | Cada tela recebe uma estrutura adequada ao trabalho representado |
| Estados de interação herdados e inconsistentes | Pressão sutil, foco visível e transições explícitas abaixo de 200 ms | Feedback rápido, acessível e coerente com uma ferramenta profissional |

## Comparação e crítica incorporada

As capturas finais de `1440 × 1000` foram comparadas lado a lado com os modelos correspondentes após uma primeira rodada de implementação. A verificação em `1600 × 1000` confirmou largura sem overflow horizontal.

| Tela | O que coincidiu com o modelo | Correções após comparação |
| --- | --- | --- |
| Lista | página larga; ações no topo; filtro em faixa única; tabs; tabela com primeira coluna dominante e linhas densas | prazo foi reinserido como filtro compacto; primitives do DS substituíram inputs locais sem perder a densidade |
| Detalhe | rail contextual à esquerda; timeline dominante à direita; proporção próxima de 30/70 | cabeçalho foi compactado; estado atual e interações (incluindo envio e encerramento) ocupam registros distintos na timeline; eventos externos ganharam origem explícita |
| Jornalista | hero integral; ações à direita; três KPIs e contato; duas colunas de contexto; histórico largo | foto e nome foram reduzidos; glyph provisório virou sparkline SVG; escala comportamental recuperou os polos semânticos |

### Desvios finais conscientes

- O shell lateral Print substitui o header horizontal da referência. A identidade e navegação passam a ser compartilhadas; grid, densidade, timeline e riqueza do produto permanecem locais.
- O detalhe usa eventos comuns sem superfície fechada e reserva caixas para atenção/estado atual. É uma adaptação do modelo para evitar que a timeline vire uma pilha de cards genéricos.
- A lista exibe cinco demandas ativas porque os mocks preservados possuem cinco itens ativos; a referência contém quatro.
- Não há ações sociais no contato do jornalista porque os contratos atuais não fornecem URLs verificáveis. O espaço é ocupado apenas por dados objetivos disponíveis.

### Crítica visual severa incorporada

O subagente `gpt-5.6-sol` concluiu que a direção é sistemicamente coerente e não parece Frankenstein. Timeline genérica, resíduos jurídicos, filtro de prazo, peso do hero, polos do espectro e sparkline foram corrigidos antes da promoção. Itens futuros foram omitidos da navegação até possuírem rotas.

## Rotas e artefatos

- Lista: `/demandas`
- Detalhe: `/demandas/d-regulacao`
- Jornalista: `/jornalistas/j-carolina`
- Capturas: `demandas-1440x1000.png`, `demanda-1440x1000.png`, `jornalista-1440x1000.png`, `demandas-sidebar-recolhida-1440x1000.png` e `jornalista-sidebar-recolhida-1600x1000.png` nesta pasta.
- Asset gerado: `public/images/carolina-montenegro.png`, criado com ImageGen em modo built-in a partir de um prompt de retrato editorial natural, sem logos ou texto.

## Validação da consolidação

- AppShell expandido e recolhido inspecionado em `1440 × 1000` e `1600 × 1000`.
- Demandas e Jornalistas navegam pelo `AppNav`; `/` redireciona para `/demandas`.
- Busca textual e filtro de status foram exercitados no portal; contadores e tabela reagiram corretamente.
- Lista, detalhe e perfil não apresentam overflow horizontal nas duas larguras.
- Console sem erros; testes, typecheck, lint e build aprovados.
- O build registra apenas aviso de chunk único acima de 500 kB, sem impedir execução.
