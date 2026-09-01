# Implementação de Autenticação Mock - Sala de Assessores

## Visão Geral

Este PR implementa o fluxo completo de autenticação visual com OTP (One-Time Password) mock para o sala-assessores, seguindo o mesmo padrão visual do print-forms.

## Estrutura Implementada

### 1. Layout de Autenticação (`src/ui/auth/AuthLayout.tsx`)
- Layout split: hero panel à esquerda + card de formulário à direita
- Branding específico para Sala de Assessores
- Responsivo (hero oculto em mobile)

### 2. Página de Login (`src/ui/auth/LoginPage.tsx`)
- Rota: `/login`
- Validação de e-mail
- Mock de envio (delay de 800ms)
- Navegação para `/login/verificar?email=...`

### 3. Página de Verificação (`src/ui/auth/VerifyPage.tsx`)
- Rota: `/login/verificar`
- OtpInput de 6 dígitos (componente do `@print/ui`)
- Código aceito: qualquer sequência de 6 dígitos OU `123456`
- Links para reenviar código e alterar e-mail (apenas UI)

### 4. Serviço Mock de Autenticação (`src/application/services/mock-auth-service.ts`)
- Armazena sessão em `localStorage` na chave `sala-assessores:mock-session`
- Métodos:
  - `verifyCode(code)`: valida código (aceita qualquer 6 dígitos)
  - `setAuthenticated(authenticated, email)`: salva sessão
  - `isAuthenticated()`: verifica se está autenticado
  - `getSession()`: retorna dados da sessão
  - `logout()`: limpa sessão

### 5. Guards de Rota
- `ProtectedRoute`: redireciona para `/login` se não autenticado
- `GuestRoute`: redireciona para `/` se já autenticado

### 6. Atualização do AppLayout
- Exibe e-mail do usuário autenticado no footer
- Botão de logout que limpa a sessão e redireciona para `/login`

## Rotas

```
/login              → LoginPage (guest only)
/login/verificar    → VerifyPage (guest only)
/                   → HomePage (protected)
/demandas           → DemandsPage (protected)
/jornalistas        → JournalistsPage (protected)
/relatorios         → ReportsPage (protected)
```

## Como Testar

### Autenticação
1. Acesse `/login`
2. Digite qualquer e-mail válido (ex: `teste@printrio.com.br`)
3. Clique em "Enviar Código"
4. Na tela de verificação, digite qualquer código de 6 dígitos (ex: `123456`)
5. Clique em "Entrar na Plataforma"
6. Você será redirecionado para a Home autenticado

### Logout
1. No AppLayout (sidebar), role até o footer
2. Clique no botão de logout (ícone de sair)
3. Você será redirecionado para `/login`

### Guards
- Tente acessar `/` sem estar autenticado → redireciona para `/login`
- Tente acessar `/login` já autenticado → redireciona para `/`

## Testes

Testes implementados:
- `LoginPage.test.tsx`: renderização, validação de e-mail, navegação
- `VerifyPage.test.tsx`: renderização, verificação de código, autenticação
- `mock-auth-service.test.ts`: todos os métodos do serviço

Para rodar os testes:
```bash
npm test
```

## Dependências

O projeto utiliza `@print/ui` (versão 0.5.11) do GitHub Packages:
- `TextInput`: campo de e-mail
- `Button`: botões de ação
- `OtpInput`: input de código de 6 dígitos
- `Heading`, `Text`: tipografia
- `AppShell`, `Avatar`, `Icon`: layout da aplicação

## Configuração Necessária

Para instalar as dependências, é necessário configurar o token do GitHub Packages:

```bash
# Definir token de acesso
export NPM_TOKEN=seu_token_github_packages

# Instalar dependências
npm install

# OU com bun (recomendado)
bun install
```

O arquivo `.npmrc` já está configurado para usar `${NPM_TOKEN}`.

## O Que NÃO Foi Implementado (Conforme Escopo)

❌ Integração com GraphQL/BFF
❌ Envio real de e-mail
❌ Validação de OTP no backend
❌ JWT ou tokens reais
❌ Integração com print-imprensa-back
❌ Módulos de atividade/release/clipping do forms

## Próximos Passos (Fora do Escopo)

1. Integrar com print-imprensa-back para OTP real
2. Implementar JWT e refresh tokens
3. Adicionar rate limiting
4. Implementar envio de e-mail via serviço
5. Adicionar expiração de códigos OTP
6. Melhorar segurança da sessão (httpOnly cookies)

## Observações

- Este é um **mock visual** para demonstração do fluxo
- A sessão é armazenada apenas no `localStorage`
- Qualquer código de 6 dígitos é aceito
- Não há validação de backend real
- O e-mail não é validado contra uma base de dados
