# DocePedido

Plataforma de cardápio online para confeiteiras: pedidos organizados via WhatsApp, com loja rápida e encomenda personalizada.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Node** (API Routes)
- **PostgreSQL** + Prisma
- **NextAuth** (login da confeiteira)

## Como rodar

### 1. Postgres

**Opção A — Docker**

```bash
docker compose up -d
```

**Opção B — Postgres local (Windows)**

Crie o banco/usuário (ajuste o usuário admin se necessário):

```bash
psql -U postgres -f scripts/init-db.sql
```

No `.env`, use:

```env
DATABASE_URL="postgresql://confeitaria:confeitaria@localhost:5432/confeitaria?schema=public"
```

Se preferir outro usuário/senha, atualize o `DATABASE_URL` conforme o seu Postgres.

### 2. Variáveis de ambiente

Copie `.env.example` para `.env` (já existe um `.env` de desenvolvimento) e confirme `AUTH_SECRET`.

### 3. Banco + seed

```bash
npm run db:setup
```

### 4. App

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Demo

| O quê | Valor |
|------|--------|
| Cardápio | [/doce-arte](http://localhost:3000/doce-arte) |
| Login | `demo@docearte.com` |
| Senha | `demo1234` |
| Painel | [/painel](http://localhost:3000/painel) |

## O que já está no MVP (Fase 1+)

- Cadastro/login da confeiteira
- Personalização da loja (nome, capa, WhatsApp, prazos, pagamentos)
- Categorias e produtos com tipos de venda:
  - Pronta entrega
  - Bolo personalizado
  - Kit festa
  - Sob encomenda
  - Corporativo
- Preços fixos, “a partir de” e orçamento
- Opções, adicionais e formulários por tipo
- Carrinho + checkout
- Pedido estruturado no WhatsApp
- Link personalizado `/{slug}`
- QR Code do cardápio
- Painel: dashboard, produtos, pedidos (status), loja

## Fluxos

1. **Loja rápida:** produto → adicionais → carrinho → WhatsApp  
2. **Encomenda:** personalizar → data/referência → orçamento no WhatsApp  

## Próximas fases (roadmap)

- Agenda completa (dias bloqueados, limite/dia)
- Upload de imagem de referência
- Relatórios e clientes
- Integração WhatsApp Business API
