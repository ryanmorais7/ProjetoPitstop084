# Pitstop 084

Landing page da assinatura de lavagem automotiva Pitstop 084.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS

Nesta etapa é só a camada visual e interativa da landing: sem banco de dados, sem API e sem
integração de pagamento real (o Pix no fluxo de assinatura é um QR fake, só ilustrativo).

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura

- `src/components` — cada seção da landing (Hero, Sobre, Planos, Assinatura, Avulsos,
  Agendamento, Diferencial, CTA final)
- `src/lib/data.ts` — planos, serviços avulsos, regras de fidelidade e horários
- `src/context/SelectionContext.tsx` — compartilha o plano/serviço escolhido entre as seções
