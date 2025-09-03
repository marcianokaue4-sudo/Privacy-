require('dotenv').config();

function getConfig() {
  return {
    gateway: process.env.GATEWAY || 'pushinpay',
    environment: process.env.ENVIRONMENT || 'production',
    generateQRCodeOnMobile: process.env.GENERATE_QR_CODE_ON_MOBILE === 'true',
    
    syncpay: {
      clientId: process.env.SYNCPAY_CLIENT_ID || '',
      clientSecret: process.env.SYNCPAY_CLIENT_SECRET || ''
    },
    
    pushinpay: {
      token: process.env.PUSHINPAY_TOKEN || ''
    },
    
    webhook: {
      baseUrl: process.env.WEBHOOK_BASE_URL || 'https://privacy-sync.vercel.app',
      secret: process.env.WEBHOOK_SECRET || ''
    },
    
    model: {
      name: process.env.MODEL_NAME || 'Mariana Poletto',
      handle: process.env.MODEL_HANDLE || '@oi.marianapoletto',
      bio: process.env.MODEL_BIO || 'Aqui você vai me ver de um jeitinho exclusivo que você nem imagina (toda peladinha!!! Sem censura!) A bunda mais gostosa que você já viu, tudo rosinha 🩷 18 aninhos... muita PUTARIA, vídeos e fotos sozinha, acompanhada, com amigas, falando putaria pra você .. dançando peladinha !!! São mais de 756 mídias!! TUDO SEM CENSURA, mostrando TU-DO, do melhor ângulo pra você se sentir aqui comigo! Chat diretamente comigo, eu mesma respondo e adoro conhecer vc mais de perto 😍 e se a química rolar, pq não? ❤️ Só falta você! ❤️‍🔥 Espero que goste!!!'
    },
    
    plans: {
      monthly: {
        buttonId: process.env.PLAN_MONTHLY_BUTTON_ID || 'btn-1-mes',
        label: process.env.PLAN_MONTHLY_LABEL || '1 mês',
        priceLabel: process.env.PLAN_MONTHLY_PRICE_LABEL || 'R$ 19,99',
        price: parseFloat(process.env.PLAN_MONTHLY_PRICE) || 19.99,
        description: process.env.PLAN_MONTHLY_DESCRIPTION || 'Assinatura mensal'
      },
      quarterly: {
        buttonId: process.env.PLAN_QUARTERLY_BUTTON_ID || 'btn-3-meses',
        label: process.env.PLAN_QUARTERLY_LABEL || '3 meses',
        priceLabel: process.env.PLAN_QUARTERLY_PRICE_LABEL || 'R$ 59,76',
        price: parseFloat(process.env.PLAN_QUARTERLY_PRICE) || 59.76,
        description: process.env.PLAN_QUARTERLY_DESCRIPTION || 'Assinatura trimestral'
      },
      semestrial: {
        buttonId: process.env.PLAN_SEMESTRIAL_BUTTON_ID || 'btn-6-meses',
        label: process.env.PLAN_SEMESTRIAL_LABEL || '6 meses',
        priceLabel: process.env.PLAN_SEMESTRIAL_PRICE_LABEL || 'R$ 119,43',
        price: parseFloat(process.env.PLAN_SEMESTRIAL_PRICE) || 119.43,
        description: process.env.PLAN_SEMESTRIAL_DESCRIPTION || 'Assinatura semestral'
      }
    },
    
    redirectUrl: process.env.REDIRECT_URL || 'https://privacymarianapoletto.site/Compra-aprovada/'
  };
}

function saveConfig(newConfig) {
  console.log('⚠️ Configuração salva em variáveis de ambiente (.env)');
  console.log('Para alterar configurações, edite o arquivo .env');
}

module.exports = { getConfig, saveConfig };
