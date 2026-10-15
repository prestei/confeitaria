# DocePedido

Plataforma de cardápio online para confeiteiras: pedidos organizados via WhatsApp, com loja rápida e encomenda personalizada.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Node** (API Routes)
- **MongoDB** + Mongoose (multi-tenant por `storeId`)
- **NextAuth** (login da confeiteira)

## Como rodar

### 1. Variáveis de ambiente

Copie `.env.example` para `.env` e confirme `AUTH_SECRET` e `MONGODB_URI`:

```env
MONGODB_URI="mongodb://127.0.0.1:27017/confeitaria"
```

### 2. App (Mongo + seed automáticos)

```bash
npm run dev
```

Antes do Next.js, o script `db:ensure` tenta subir o Mongo (Docker Compose ou
`mongod` local na porta `27017`, dados em `.data/mongo`) e roda o seed demo se o
banco estiver vazio.

Comandos manuais, se precisar: `npm run db:up`, `npm run db:seed`, `npm run db:ensure`.

Abra [http://localhost:3000](http://localhost:3000).

## Multi-tenant

Cada confeitaria é um **tenant** (`Store`). Dados de cardápio, pedidos, clientes etc. carregam `storeId` e as queries do painel/API sempre filtram por ele. A vitrine pública resolve o tenant pelo `slug` (`/{slug}`).

## Demo

| O quê | Valor |
|------|--------|
| Cardápio | [/doce-encanto](http://localhost:3000/doce-encanto) |
| Login | `demo@doceencanto.com` |
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
