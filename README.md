# Sala de Assessores

Frontend React + Vite + TypeScript para gestão de demandas de imprensa.

## Stack

- React 19, Vite e TypeScript
- Clean Architecture: `ui → application → domain ← infrastructure`
- `@print/ui` para shell, tokens e primitives compartilhados
- TanStack Query, Zustand, Zod e Vitest
- repositórios mockados e substituíveis por portas

## Rotas

- `/` redireciona para `/demandas`
- `/demandas`
- `/demandas/:demandId`
- `/jornalistas/:journalistId`

## Scripts

```bash
bun run dev
bun run test
bun run typecheck
bun run lint
bun run build
```

## Regra para efeitos React

Callbacks de `useEffect`, `useLayoutEffect` e `useInsertionEffect` devem sempre usar corpo de bloco explícito e retornar somente `undefined` ou uma função de cleanup. Prefira remover o efeito quando houver uma API declarativa equivalente.

## Documentação

- [Contrato visual](./docs/design/README.md)
- [Adoção e gaps do print-ui](./docs/print-ui-gaps.md)
- [Decisão de backend](./docs/backend-decision.md)

`modelos/` permanece preservada como referência visual. Não há backend, autenticação, mutações ou integração real nesta entrega.
