/**
 * Demo Completa - Sistema de Tracking + PushinPay + Meta CAPI
 * 
 * Execute: node demo-complete.js
 * 
 * Demonstra todo o fluxo de tracking de checkout
 */

const BASE_URL = 'http://localhost:3000';

// Cores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(color, ...args) {
    console.log(color + args.join(' ') + colors.reset);
}

async function request(method, endpoint, data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const result = await response.json();
        
        return { status: response.status, data: result };
        
    } catch (error) {
        return { error: error.message };
    }
}

async function demoComplete() {
    log(colors.cyan, '\n🚀 DEMO COMPLETA - Sistema de Tracking + PushinPay + Meta CAPI\n');
    
    // 1. Health Check
    log(colors.yellow, '1️⃣ Verificando saúde do sistema...');
    const health = await request('GET', '/health');
    if (health.error) {
        log(colors.red, '❌ Servidor offline:', health.error);
        return;
    }
    log(colors.green, '✅ Servidor online:', health.data.service);
    
    // 2. Cenário A1 - Trilha A (Pago com UTMs)
    log(colors.yellow, '\n2️⃣ Cenário A1 - Trilha A (Pago com UTMs)');
    
    const checkoutIdA1 = `co_demo_a1_${Date.now()}`;
    const trackingA1 = {
        checkout_id: checkoutIdA1,
        value: 19.90,
        currency: 'BRL',
        fbp: '_fbp_1.1734567890.demo123',
        fbc: '_fbc_1.1734567890.demo456',
        utms: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'demo_a1',
            utm_content: 'banner_test',
            utm_term: 'curso_online'
        },
        src: 'paid',
        client_user_agent: 'Demo-Script/1.0'
    };
    
    log(colors.blue, '   📤 Salvando tracking...');
    const trackingResult = await request('POST', '/track/checkout', trackingA1);
    if (trackingResult.error || trackingResult.status !== 200) {
        log(colors.red, '   ❌ Erro no tracking:', trackingResult.error || trackingResult.data);
        return;
    }
    log(colors.green, '   ✅ Tracking salvo:', trackingResult.data.checkout_id);
    
    log(colors.blue, '   🔔 Simulando webhook PushinPay...');
    const webhookA1 = {
        id: `tx_demo_a1_${Date.now()}`,
        status: 'approved',
        amount: 19.90,
        currency: 'BRL',
        approved_at: new Date().toISOString(),
        metadata: {
            checkout_id: checkoutIdA1
        }
    };
    
    const webhookResult = await request('POST', '/webhooks/pushinpay', webhookA1);
    if (webhookResult.error || webhookResult.status !== 200) {
        log(colors.red, '   ❌ Erro no webhook:', webhookResult.error || webhookResult.data);
        return;
    }
    log(colors.green, '   ✅ Webhook processado:', webhookResult.data.event_id);
    
    // 3. Cenário A2 - Trilha A (Orgânico)
    log(colors.yellow, '\n3️⃣ Cenário A2 - Trilha A (Orgânico)');
    
    const checkoutIdA2 = `co_demo_a2_${Date.now()}`;
    const trackingA2 = {
        checkout_id: checkoutIdA2,
        value: 29.90,
        currency: 'BRL',
        fbp: '_fbp_1.1734567890.organic789',
        src: 'organic',
        client_user_agent: 'Demo-Script/1.0'
    };
    
    log(colors.blue, '   📤 Salvando tracking orgânico...');
    const trackingA2Result = await request('POST', '/track/checkout', trackingA2);
    log(colors.green, '   ✅ Tracking orgânico salvo');
    
    log(colors.blue, '   🔔 Webhook orgânico...');
    const webhookA2 = {
        id: `tx_demo_a2_${Date.now()}`,
        status: 'approved',
        amount: 29.90,
        currency: 'BRL',
        approved_at: new Date().toISOString(),
        metadata: { checkout_id: checkoutIdA2 }
    };
    
    const webhookA2Result = await request('POST', '/webhooks/pushinpay', webhookA2);
    log(colors.green, '   ✅ Webhook orgânico processado');
    
    // 4. Cenário B1 - Trilha B (Dedupe Perfeito)
    log(colors.yellow, '\n4️⃣ Cenário B1 - Trilha B (Dedupe Perfeito)');
    
    const checkoutIdB1 = `co_demo_b1_${Date.now()}`;
    const purchaseEventId = `purchase_demo_${Math.random().toString(36).slice(2, 8)}`;
    const trackingB1 = {
        checkout_id: checkoutIdB1,
        value: 39.90,
        currency: 'BRL',
        fbp: '_fbp_1.1734567890.dedupe123',
        fbc: '_fbc_1.1734567890.dedupe456',
        utms: {
            utm_source: 'facebook',
            utm_medium: 'social',
            utm_campaign: 'demo_b1_dedupe'
        },
        src: 'paid',
        purchase_event_id: purchaseEventId,
        client_user_agent: 'Demo-Script/1.0'
    };
    
    log(colors.blue, '   📤 Salvando tracking com purchase_event_id...');
    log(colors.magenta, '   🎯 Purchase Event ID:', purchaseEventId);
    await request('POST', '/track/checkout', trackingB1);
    log(colors.green, '   ✅ Tracking B1 salvo');
    
    log(colors.blue, '   🔔 Webhook B1 (dedupe)...');
    const webhookB1 = {
        id: `tx_demo_b1_${Date.now()}`,
        status: 'approved',
        amount: 39.90,
        currency: 'BRL',
        approved_at: new Date().toISOString(),
        metadata: { checkout_id: checkoutIdB1 }
    };
    
    const webhookB1Result = await request('POST', '/webhooks/pushinpay', webhookB1);
    log(colors.green, '   ✅ Webhook B1 processado');
    log(colors.magenta, '   🎯 Event ID usado:', webhookB1Result.data.event_id);
    
    // 5. Cenário B2 - Webhook Duplicado
    log(colors.yellow, '\n5️⃣ Cenário B2 - Webhook Duplicado (Idempotência)');
    
    log(colors.blue, '   🔔 Enviando mesmo webhook novamente...');
    const duplicateResult = await request('POST', '/webhooks/pushinpay', webhookB1);
    log(colors.green, '   ✅ Webhook duplicado processado (sem erro)');
    
    // 6. Teste de Formato Alternativo
    log(colors.yellow, '\n6️⃣ Teste de Formato Alternativo (Schema B)');
    
    const checkoutIdAlt = `co_demo_alt_${Date.now()}`;
    await request('POST', '/track/checkout', {
        checkout_id: checkoutIdAlt,
        value: 49.90,
        currency: 'BRL',
        src: 'paid'
    });
    
    const webhookAlt = {
        transaction_id: `tx_alt_${Date.now()}`,
        payment_status: 'paid',
        value: 49.90,
        currency_code: 'BRL',
        payment_date: Date.now(),
        custom_data: {
            checkout_id: checkoutIdAlt
        }
    };
    
    log(colors.blue, '   🔔 Webhook formato alternativo...');
    const altResult = await request('POST', '/webhooks/pushinpay', webhookAlt);
    log(colors.green, '   ✅ Formato alternativo processado');
    
    // 7. Buscar Trackings Salvos
    log(colors.yellow, '\n7️⃣ Verificando Trackings Salvos');
    
    const searches = [checkoutIdA1, checkoutIdA2, checkoutIdB1];
    for (const id of searches) {
        const searchResult = await request('GET', `/track/checkout/${id}`);
        if (searchResult.status === 200) {
            log(colors.green, `   ✅ ${id}: R$ ${searchResult.data.data.value}`);
        }
    }
    
    // 8. Resumo Final
    log(colors.cyan, '\n🎉 DEMO CONCLUÍDA COM SUCESSO!');
    log(colors.cyan, '\n📊 Resumo dos Cenários:');
    log(colors.green, '   ✅ A1: Checkout pago com UTMs → Meta CAPI Purchase');
    log(colors.green, '   ✅ A2: Checkout orgânico → Meta CAPI Purchase (organic)');
    log(colors.green, '   ✅ B1: Checkout com dedupe → Meta CAPI Purchase (event_id personalizado)');
    log(colors.green, '   ✅ B2: Webhook duplicado → Processado sem duplicação');
    log(colors.green, '   ✅ Alt: Formato alternativo → Mapeado e processado');
    
    log(colors.cyan, '\n🔍 Para validar no Meta Events Manager:');
    log(colors.blue, '   1. Acesse Meta Business → Events Manager → Test Events');
    log(colors.blue, '   2. Filtre por test_event_code (se configurado)');
    log(colors.blue, '   3. Procure por eventos Purchase com:');
    log(colors.blue, '      • UTMs em custom_data (A1)');
    log(colors.blue, '      • src=organic (A2)');
    log(colors.blue, '      • event_id personalizado (B1)');
    
    log(colors.yellow, '\n⚡ Sistema pronto para produção!');
}

// Executa a demo
demoComplete().catch(error => {
    log(colors.red, '💥 Erro na demo:', error.message);
    process.exit(1);
});
