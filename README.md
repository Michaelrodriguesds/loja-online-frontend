# Loja Online SaaS — Frontend

React + Vite. Três áreas no mesmo site:

| Endereço | Quem usa |
|---|---|
| `/criar-loja` | Link que você manda para novos lojistas |
| `/painel` | Lojista: pedidos, produtos, entrega e Pix, aparência, plano |
| `/admin` | Você: lojas, renovar/bloquear/excluir, moderação, avisos |
| `/loja/<nome-da-loja>` | Loja pública que o lojista divulga |

## Rodar no PC

```bash
npm install
copy .env.example .env    # VITE_API_URL=http://localhost:3000
npm run dev               # abre em http://localhost:5173
```

## Publicar no Netlify

1. Novo site a partir deste repositório (o `netlify.toml` já configura o build).
2. Em **Site configuration > Environment variables**: `VITE_API_URL` = endereço do Render.
3. Faça um novo deploy depois de mudar a variável.

## Temas da loja

`urbano`, `clean`, `delicado` e `vibrante` ficam em `src/styles.css` (procure por `data-tema`).
A cor principal vem do lojista (`--marca`).
