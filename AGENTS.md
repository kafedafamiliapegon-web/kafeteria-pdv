<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Kafeteria PDV — Regras para Codex

Este projeto é um sistema PDV para cafeteria, feito com Next.js, React, Tailwind CSS, Supabase e Vercel.

## Objetivo do sistema

O sistema deve ser simples, visual e seguro para uso familiar na cafeteria.

Funcionalidades principais já existentes:

- Login com Supabase Auth.
- Dashboard principal.
- Produtos com foto, categoria, preço, estoque e estoque mínimo.
- Mesas e comandas.
- Venda rápida sem mesa.
- Caixa com abertura, fechamento e histórico.
- Vendas vinculadas ao caixa por `cash_register_id`.
- Bloqueio de venda quando o caixa está fechado.
- Histórico de vendas com itens.
- Cupom/comprovante.
- Apagar venda individual devolvendo estoque.
- Deploy pela Vercel.

## Regras importantes

- Não remover funcionalidades existentes sem motivo claro.
- Não alterar o visual principal sem pedido explícito.
- Manter o estilo verde escuro da Kafeteria.
- Não expor chaves, senhas ou segredos.
- Nunca usar `service_role` no front-end.
- Não editar `.env.local`.
- Não criar lógica que dependa de senha no código.
- Usar somente variáveis públicas do Supabase no front:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Preservar autenticação protegendo páginas internas.
- Preservar o botão de sair no Dashboard.
- Preservar `Header` reutilizável.
- Sempre preferir mudanças pequenas e seguras.

## Banco de dados Supabase

Tabelas usadas pelo sistema:

- `products`
- `categories`
- `tables_open`
- `orders`
- `order_items`
- `sales`
- `cash_registers`
- `company_settings`

Regras importantes:

- Venda por mesa/comanda usa `orders.table_id`.
- Venda rápida usa `orders.table_id = null`.
- Toda venda nova deve salvar `sales.cash_register_id` com o ID do caixa aberto.
- Venda não pode ser finalizada se não existir caixa aberto.
- Ao finalizar venda, reduzir estoque dos produtos.
- Ao apagar venda, devolver estoque antes de apagar:
  1. devolver estoque dos itens
  2. apagar `order_items`
  3. apagar `sales`
  4. apagar `orders`
- Não apagar produtos ao apagar vendas.
- Não apagar histórico em massa sem pedido explícito.

## Arquivos importantes

- `app/page.tsx` — Dashboard.
- `app/login/page.tsx` — Login.
- `app/produtos/page.tsx` — Produtos.
- `app/mesas/page.tsx` — Mesas.
- `app/comanda/[id]/page.tsx` — Comanda.
- `app/venda-rapida/page.tsx` — Venda rápida.
- `app/caixa/page.tsx` — Caixa.
- `app/historico/page.tsx` — Histórico.
- `app/cupom/[id]/page.tsx` — Cupom.
- `components/Header.tsx` — Cabeçalho reutilizável.
- `components/AuthGuard.tsx` — Proteção de login.
- `lib/supabase.ts` — Cliente Supabase.

## Antes de finalizar qualquer tarefa

Sempre que possível:

1. Rodar:
   ```bash
   npm run build