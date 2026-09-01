# Migração da dependência @print/ui

## O que mudou?

A dependência `@print/ui` foi migrada de um caminho local (`file:../print-ui`) para o pacote publicado no GitHub Packages (`@printrio-tech/print-ui`).

## Por que essa mudança?

- O caminho local `file:../print-ui` só funcionava na máquina do desenvolvedor que tinha ambos os repositórios clonados lado a lado
- Agora usamos o pacote oficial publicado no GitHub Packages, disponível para toda a equipe
- Facilita CI/CD e onboarding de novos desenvolvedores

## Como configurar?

### Opção 1: Variável de ambiente (Recomendado)

1. Crie um Personal Access Token no GitHub:
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token (classic)"
   - Dê permissão `read:packages`
   - Copie o token gerado

2. Defina a variável de ambiente:
   ```bash
   export NPM_TOKEN=seu_token_aqui
   ```

3. Instale as dependências:
   ```bash
   bun install
   ```

### Opção 2: Arquivo .npmrc local

1. Copie o arquivo de exemplo:
   ```bash
   cp .npmrc.example .npmrc
   ```

2. Edite `.npmrc` e substitua `YOUR_GITHUB_TOKEN_HERE` pelo seu token

3. Instale as dependências:
   ```bash
   bun install
   ```

**⚠️ IMPORTANTE**: Se usar essa opção, nunca commite seu `.npmrc` com o token real!

## Para CI/CD

Configure a variável de ambiente `NPM_TOKEN` nos secrets do GitHub Actions ou na plataforma de deploy.

## Código não foi alterado

Os imports no código permanecem iguais:

```typescript
import { Button, Card } from '@print/ui'
```

```scss
@use '@print/ui/tokens' as *;
@use '@print/ui/mixins' as *;
```

A sintaxe de alias npm (`"@print/ui": "npm:@printrio-tech/print-ui@0.5.11"`) faz o mapeamento automaticamente.

## Versão atual

Estamos usando a versão `0.5.11` do `@printrio-tech/print-ui`, que corresponde à tag `v0.5.11` no repositório PrintRio-Tech/print-ui.
