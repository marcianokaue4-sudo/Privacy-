# Privacy Sync - Sistema de Pagamentos

## 📁 Estrutura do Projeto

### Páginas Principais

- **`/` (raiz)** → Redireciona para `/links`
- **`/links`** → Página principal com botões de acesso
- **`/privacy`** → Página de checkout e pagamentos
- **`/oferta-premiada`** → Página de oferta premiada
- **`/redirect`** → Página de redirecionamento para Telegram

### Diretórios

```
├── links/                 # Página principal (Stella Beghini)
│   ├── index.html        # Landing page com botões
│   ├── images/           # Imagens da página
│   └── icons/            # Ícones dos botões
├── redirect/             # Página de redirecionamento
│   ├── index.html        # Loading para Telegram
│   └── images/           # Imagens da página
├── public/               # Páginas públicas (checkout e oferta)
│   ├── index.html        # Sistema de pagamentos
│   ├── oferta-premiada/  # Página de oferta após pagamento
│   ├── css/              # Estilos
│   ├── js/               # Scripts
│   └── images/           # Imagens
└── assets/               # Arquivos de proteção
    ├── protect.css       # Proteções CSS
    └── protect.js        # Proteções JavaScript
```

## 🚀 Como Executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Executar servidor:**
   ```bash
   npm start
   ```

3. **Acessar páginas:**
   - Página Principal: http://localhost:3000/links
   - Checkout: http://localhost:3000/privacy
   - Oferta Premiada: http://localhost:3000/oferta-premiada
   - Redirecionamento: http://localhost:3000/redirect

## 🔧 Configuração

### Gateway de Pagamentos
- **SyncPay** (padrão)
- **PushinPay** (alternativo)

### Configurações
- Arquivo: `app-config.json`
- Controle: `configManager.js`

## 📱 Funcionalidades

### Página de Links (`/links`)
- Botão para Privacy (checkout)
- Botão para Telegram (redirecionamento)
- Detecção automática de cidade
- Proteções contra inspeção

### Página de Checkout (`/privacy`)
- Sistema de pagamentos integrado
- Múltiplos gateways
- Suporte a PIX, cartão e boleto
- Webhooks automáticos

### Página de Oferta Premiada (`/oferta-premiada`)
- Oferta exclusiva após o pagamento
- Geração de PIX integrada
- Contagem regressiva de urgência

### Página de Redirecionamento (`/redirect`)
- Loading automático
- Redirecionamento para bot do Telegram
- Barra de progresso

## 🛡️ Proteções

- Desabilita menu de contexto
- Bloqueia teclas de atalho (F12, Ctrl+Shift+I, etc.)
- Proteção contra inspeção de elementos
- Bloqueia seleção de texto
- Desabilita arrastar imagens

## 🔗 Integrações

- **UTMify** - Tracking de campanhas
- **Meta Pixel** - Analytics do Facebook
- **SyncPayments** - Gateway de pagamentos
- **PushinPay** - Gateway alternativo

## 📝 Notas

- Todas as páginas são responsivas
- Sistema de roteamento automático
- Logs detalhados no console
- Tratamento de erros robusto
- Compatibilidade com múltiplos navegadores
