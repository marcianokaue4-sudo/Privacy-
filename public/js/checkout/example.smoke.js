/**
 * Smoke Test Frontend - Testes rápidos de integração
 * 
 * Execute no console do navegador em /privacy:
 * window.smoke.purchase()
 * 
 * @author Sistema de Tracking UTMify + Meta Pixel + Telegram
 */

// Smoke Test Suite
window.smoke = {
    
    /**
     * Teste principal de Purchase
     */
    async purchase() {
        console.log('🔥 Iniciando Smoke Test - Purchase Flow');
        
        try {
            // 1. Testar geração de IDs
            console.log('\n📝 Testando geração de IDs...');
            const checkoutId = this.testIdGeneration();
            
            // 2. Testar captura de tracking
            console.log('\n📊 Testando captura de tracking...');
            const trackingData = this.testTrackingCapture();
            
            // 3. Testar envio para backend
            console.log('\n📤 Testando envio para backend...');
            const backendResult = await this.testBackendIntegration(checkoutId, trackingData);
            
            // 4. Testar integração completa (simulada)
            console.log('\n🔄 Testando integração completa...');
            const fullResult = await this.testFullIntegration();
            
            // Resumo
            console.log('\n✅ Smoke Test Concluído!');
            console.log('📋 Resumo:', {
                ids_ok: !!checkoutId,
                tracking_ok: !!trackingData,
                backend_ok: backendResult.success,
                integration_ok: fullResult.success
            });
            
            return {
                success: true,
                results: {
                    checkout_id: checkoutId,
                    tracking_data: trackingData,
                    backend_result: backendResult,
                    full_integration: fullResult
                }
            };
            
        } catch (error) {
            console.error('❌ Smoke Test Falhou:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    /**
     * Testa geração de IDs
     */
    testIdGeneration() {
        console.log('  🆔 Testando makeCheckoutId...');
        
        // Testa se as funções existem
        if (!window.lepolepoIds) {
            throw new Error('window.lepolepoIds não encontrado');
        }
        
        const { makeCheckoutId, shortEventId, isValidCheckoutId, debugIds } = window.lepolepoIds;
        
        // Gera checkout_id
        const checkoutId = makeCheckoutId();
        console.log('    ✓ checkout_id:', checkoutId);
        
        // Valida checkout_id
        const isValid = isValidCheckoutId(checkoutId);
        console.log('    ✓ válido:', isValid);
        
        if (!isValid) {
            throw new Error('checkout_id gerado é inválido');
        }
        
        // Testa purchase_event_id
        const purchaseEventId = shortEventId('purchase', 12);
        console.log('    ✓ purchase_event_id:', purchaseEventId);
        
        // Debug info
        const debug = debugIds();
        console.log('    ✓ debug info:', debug);
        
        return checkoutId;
    },
    
    /**
     * Testa captura de dados de tracking
     */
    testTrackingCapture() {
        console.log('  📊 Testando captura de tracking...');
        
        // Testa se CheckoutTracking existe
        if (!window.lepolepoCheckout) {
            throw new Error('window.lepolepoCheckout não encontrado');
        }
        
        const tracking = window.lepolepoCheckout.getCheckoutTracking({ debug: true });
        const trackingData = tracking.getTrackingData();
        
        console.log('    ✓ tracking data:', trackingData);
        
        // Verificações básicas
        if (!trackingData) {
            throw new Error('Falha ao capturar tracking data');
        }
        
        console.log('    ✓ fbp:', trackingData.fbp ? '✓' : '❌');
        console.log('    ✓ fbc:', trackingData.fbc ? '✓' : '❌');
        console.log('    ✓ src:', trackingData.src);
        console.log('    ✓ utms:', trackingData.utms ? '✓' : '❌');
        
        return trackingData;
    },
    
    /**
     * Testa integração com backend
     */
    async testBackendIntegration(checkoutId, trackingData) {
        console.log('  📤 Testando POST /track/checkout...');
        
        const payload = {
            checkout_id: checkoutId,
            value: 19.90,
            currency: 'BRL',
            fbp: trackingData.fbp,
            fbc: trackingData.fbc,
            utms: trackingData.utms,
            src: trackingData.src,
            client_user_agent: navigator.userAgent,
            purchase_event_id: window.shortEventId ? window.shortEventId('purchase', 12) : undefined
        };
        
        console.log('    📤 Payload:', payload);
        
        try {
            const response = await fetch('/track/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            console.log('    📥 Response:', response.status, result);
            
            if (!response.ok) {
                throw new Error(`Backend error: ${response.status} - ${result.error}`);
            }
            
            console.log('    ✅ Backend integration OK');
            
            return {
                success: true,
                status: response.status,
                result
            };
            
        } catch (error) {
            console.log('    ❌ Backend integration failed:', error.message);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    /**
     * Testa integração completa simulada
     */
    async testFullIntegration() {
        console.log('  🔄 Testando integração completa (simulada)...');
        
        try {
            // Simula criação de checkout com tracking
            const result = await window.lepolepoCheckout.createCheckoutWithTracking({
                value: 29.90,
                currency: 'BRL',
                enablePurchaseEventId: true, // Trilha B
                
                // Mock da função PushinPay
                pushinpayCallback: async (dados) => {
                    console.log('    💳 Mock PushinPay chamado:', dados);
                    
                    // Simula resposta da PushinPay
                    return {
                        success: true,
                        transaction_id: 'tx_smoke_' + Date.now(),
                        pix_code: 'MOCK_PIX_CODE',
                        metadata: dados.metadata
                    };
                }
            });
            
            console.log('    ✅ Integração completa:', result);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            // Testa disparo de Pixel Purchase (simulado)
            if (result.purchase_event_id) {
                console.log('  🎯 Testando Pixel Purchase (simulado)...');
                
                const pixelResult = window.lepolepoCheckout.firePixelPurchase({
                    purchase_event_id: result.purchase_event_id,
                    value: 29.90,
                    currency: 'BRL'
                });
                
                console.log('    ✓ Pixel Purchase:', pixelResult ? '✅' : '❌');
            }
            
            return result;
            
        } catch (error) {
            console.log('    ❌ Integração completa falhou:', error.message);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    /**
     * Teste rápido de conectividade
     */
    async ping() {
        console.log('🏓 Ping Test - Conectividade básica');
        
        try {
            const response = await fetch('/health');
            const result = await response.json();
            
            console.log('✅ Backend OK:', result.service);
            return { success: true, result };
            
        } catch (error) {
            console.log('❌ Backend offline:', error.message);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Teste de Meta Pixel
     */
    testMetaPixel() {
        console.log('🎯 Meta Pixel Test');
        
        const hasPixel = typeof window.fbq !== 'undefined';
        console.log('  Meta Pixel:', hasPixel ? '✅ Ativo' : '❌ Não encontrado');
        
        if (hasPixel) {
            // Testa disparo de evento personalizado
            try {
                window.fbq('track', 'CustomEvent', {
                    event_name: 'SmokeTest',
                    timestamp: Date.now()
                });
                console.log('  ✅ Evento teste disparado');
            } catch (error) {
                console.log('  ❌ Erro ao disparar evento:', error.message);
            }
        }
        
        return { hasPixel };
    },
    
    /**
     * Teste de UTMStore
     */
    testUTMStore() {
        console.log('🔍 UTMStore Test');
        
        const hasUTMStore = typeof window.UTMStore !== 'undefined';
        console.log('  UTMStore:', hasUTMStore ? '✅ Ativo' : '❌ Não encontrado');
        
        if (hasUTMStore) {
            const tracking = window.UTMStore.getTracking();
            console.log('  ✓ Tracking atual:', tracking);
            
            return { hasUTMStore: true, tracking };
        }
        
        return { hasUTMStore: false };
    },
    
    /**
     * Executa todos os testes básicos
     */
    async all() {
        console.log('🔥🔥🔥 SMOKE TEST COMPLETO 🔥🔥🔥\n');
        
        const results = {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            url: window.location.href
        };
        
        // Ping
        results.ping = await this.ping();
        
        // Meta Pixel
        results.meta_pixel = this.testMetaPixel();
        
        // UTMStore
        results.utm_store = this.testUTMStore();
        
        // Purchase Flow
        results.purchase_flow = await this.purchase();
        
        console.log('\n📊 RESUMO FINAL:', results);
        
        const allPassed = results.ping.success && 
                         results.purchase_flow.success;
        
        console.log(allPassed ? '\n🎉 TODOS OS TESTES PASSARAM!' : '\n⚠️ ALGUNS TESTES FALHARAM');
        
        return results;
    }
};

// Auto-execução se estiver em modo debug
if (window.location.search.includes('smoke=true')) {
    console.log('🚀 Auto-executando smoke test...');
    setTimeout(() => {
        window.smoke.all();
    }, 1000);
}

// Mensagem de instruções
console.log(`
🔥 SMOKE TESTS CARREGADOS 🔥

Comandos disponíveis:
• window.smoke.purchase()     - Teste completo de Purchase
• window.smoke.ping()         - Teste de conectividade  
• window.smoke.testMetaPixel() - Teste do Meta Pixel
• window.smoke.testUTMStore() - Teste do UTMStore
• window.smoke.all()          - Executa todos os testes

Para auto-executar: adicione ?smoke=true na URL
`);

export default window.smoke;
