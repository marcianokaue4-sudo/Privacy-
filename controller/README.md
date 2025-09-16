# 🎮 Controller de Pagamentos

Sistema centralizado para gerenciar APIs de pagamento (SyncPay e PushinPay) de forma simples e configurável.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Como Configurar](#-como-configurar)
- [Como Usar](#-como-usar)
- [APIs Disponíveis](#-apis-disponíveis)
- [Exemplos Práticos](#-exemplos-práticos)
- [Troubleshooting](#-troubleshooting)

## 🎯 Visão Geral

O Controller de Pagamentos permite:

- ✅ **Trocar entre APIs facilmente** - Altere apenas 1 linha no config
- ✅ **Configurar chaves em um local só** - Todas as credenciais centralizadas
- ✅ **Autenticação automática** - Sistema gerencia tokens automaticamente
- ✅ **Logs detalhados** - Acompanhe todas as operações
- ✅ **Tratamento de erros** - Respostas padronizadas
- ✅ **Cache de tokens** - Performance otimizada

## ⚙️ Como Configurar

### 1️⃣ Escolher a API

Abra o arquivo `/controller/config.js` e altere a linha:

```javascript
// Para usar SyncPay
const ACTIVE_GATEWAY = 'syncpay';

// Para usar PushinPay
const ACTIVE_GATEWAY = 'pushinpay';
```

### 2️⃣ Configurar Chaves

#### Para SyncPay:
```javascript
const SYNCPAY_CONFIG = {
    CLIENT_ID: 'sua-client-id-aqui',         // ← ALTERE AQUI
    CLIENT_SECRET: 'sua-client-secret-aqui', // ← ALTERE AQUI
    // ... outras configurações
};
```

#### Para PushinPay:
```javascript
const PUSHINPAY_CONFIG = {
    TOKEN: 'seu-token-aqui', // ← ALTERE AQUI
    // ... outras configurações
};
```

### 3️⃣ Configurar Webhook (Opcional)

```javascript
const WEBHOOK_CONFIG = {
    BASE_URL: 'https://seu-dominio.com', // ← ALTERE AQUI
    SECRET_KEY: 'sua-chave-secreta-aqui' // ← ALTERE AQUI
};
```

### 4️⃣ Salvar e Reiniciar

Após fazer as alterações:
1. Salve o arquivo `config.js`
2. Reinicie o servidor
3. Verifique os logs para confirmar a configuração

## 🚀 Como Usar

### Método 1: Via Rotas HTTP

#### Criar Pagamento PIX
```http
POST /api/controller/pix/payment
Content-Type: application/json

{
    "amount": 10.50,
    "description": "Pagamento teste",
    "external_id": "pedido_123",
    "customer": {
        "name": "João Silva",
        "email": "joao@email.com"
    }
}
```

#### Consultar Status
```http
GET /api/controller/payment/PAYMENT_ID/status
```

#### Informações do Gateway
```http
GET /api/controller/info
```

#### Testar Conectividade
```http
GET /api/controller/test
```

### Método 2: Via Código JavaScript

```javascript
const { getPaymentController } = require('./controller');

const controller = getPaymentController();

// Criar pagamento
const payment = await controller.createPixPayment({
    amount: 10.50,
    description: 'Pagamento teste'
});

// Consultar status
const status = await controller.getPaymentStatus(payment.id);

// Informações do gateway
const info = controller.getGatewayInfo();
```

## 📡 APIs Disponíveis

### Rotas do Controller

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/controller/info` | Informações do gateway ativo |
| `GET` | `/api/controller/test` | Testar conectividade |
| `POST` | `/api/controller/pix/payment` | Criar pagamento PIX |
| `GET` | `/api/controller/payment/:id/status` | Consultar status |
| `POST` | `/api/controller/refresh-token` | Renovar token |

### Métodos da Classe

```javascript
// Requisições HTTP
await controller.get(endpoint, config)
await controller.post(endpoint, data, config)

// Pagamentos
await controller.createPixPayment(paymentData)
await controller.getPaymentStatus(paymentId)

// Utilitários
controller.getGatewayInfo()
await controller.testConnection()
await controller.refreshToken()
```

## 💡 Exemplos Práticos

### Exemplo 1: Pagamento Simples

```javascript
// Criar pagamento de R$ 25,00
const payment = await controller.createPixPayment({
    amount: 25.00,
    description: 'Compra online'
});

console.log('QR Code:', payment.qr_code);
console.log('Código PIX:', payment.pix_code);
```

### Exemplo 2: Trocar de API

```javascript
// 1. Alterar config.js
const ACTIVE_GATEWAY = 'pushinpay'; // era 'syncpay'

// 2. Reiniciar servidor
// 3. Usar normalmente - o controller se adapta automaticamente!

const payment = await controller.createPixPayment({
    amount: 15.00
});
// Agora usando PushinPay automaticamente!
```

### Exemplo 3: Monitorar Pagamento

```javascript
async function monitorarPagamento(paymentId) {
    const interval = setInterval(async () => {
        try {
            const status = await controller.getPaymentStatus(paymentId);
            console.log(`Status: ${status.status}`);
            
            if (status.status === 'paid') {
                console.log('✅ Pagamento aprovado!');
                clearInterval(interval);
            }
        } catch (error) {
            console.error('Erro ao consultar:', error.message);
        }
    }, 5000); // Verificar a cada 5 segundos
}
```

## 🔧 Troubleshooting

### Problemas Comuns

#### ❌ "Credenciais não configuradas"
**Solução:** Verifique se preencheu as chaves corretas no `config.js`

```javascript
// SyncPay
CLIENT_ID: 'sua-client-id-real',     // ✅ Não pode estar vazio
CLIENT_SECRET: 'sua-secret-real',    // ✅ Não pode estar vazio

// PushinPay  
TOKEN: 'seu-token-real',             // ✅ Não pode estar vazio
```

#### ❌ "Gateway deve ser syncpay ou pushinpay"
**Solução:** Verifique a configuração do gateway ativo

```javascript
const ACTIVE_GATEWAY = 'syncpay';  // ✅ Valores válidos: 'syncpay' ou 'pushinpay'
```

#### ❌ "Falha na autenticação"
**Soluções:**
1. Verifique se as credenciais estão corretas
2. Teste a conectividade: `GET /api/controller/test`
3. Force renovação do token: `POST /api/controller/refresh-token`

#### ❌ "Valor mínimo não atendido"
**Para PushinPay:** Valor mínimo é R$ 0,50
```javascript
// ❌ Erro
amount: 0.30

// ✅ Correto  
amount: 0.50
```

### Logs Detalhados

Para ativar logs detalhados:

```javascript
// config.js
const GENERAL_CONFIG = {
    ENABLE_DETAILED_LOGS: true,  // ← Ativar logs
    LOG_LEVEL: 'debug'           // ← Nível máximo de detalhes
};
```

### Verificar Configuração

Use a rota de informações para verificar:

```http
GET /api/controller/info
```

Resposta esperada:
```json
{
    "success": true,
    "data": {
        "gateway": "syncpay",
        "environment": "production",
        "webhook_url": "https://seu-dominio.com/webhook/syncpay",
        "api_base_url": "https://api.syncpayments.com.br/api/partner/v1"
    }
}
```

## 📞 Suporte

1. **Verificar logs** - Sempre consulte os logs do servidor
2. **Testar conectividade** - Use `/api/controller/test`
3. **Validar configuração** - Use `/api/controller/info`
4. **Documentação das APIs**:
   - [SyncPay](https://docs.syncpayments.com.br)
   - [PushinPay](https://docs.pushinpay.com.br)

---

## 🎉 Pronto!

Agora você tem um sistema centralizado para gerenciar suas APIs de pagamento. Para trocar de API, basta alterar 1 linha no config e reiniciar o servidor!

**Vantagens:**
- ✅ Configuração em um só lugar
- ✅ Troca de API sem alterar código
- ✅ Logs detalhados para debugging
- ✅ Tratamento de erros padronizado
- ✅ Cache automático de tokens
- ✅ Fácil para outros desenvolvedores configurarem