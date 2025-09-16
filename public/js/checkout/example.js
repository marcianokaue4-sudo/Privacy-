/**
 * Exemplo de Uso - Checkout Tracking Integration
 * 
 * Este arquivo demonstra como integrar o tracking de checkout
 * com PushinPay e Meta Pixel.
 * 
 * @author Sistema de Tracking UTMify + Meta Pixel + Telegram
 * @version 1.0.0
 */

// Importa módulos (se usando ES6 modules)
// import { createCheckoutWithTracking, firePixelPurchase } from './tracking.js';

/**
 * Exemplo 1: Checkout básico (Trilha A)
 */
async function exemploCheckoutBasico() {
    try {
        const resultado = await window.lepolepoCheckout.createCheckoutWithTracking({
            value: 19.90,
            currency: 'BRL',
            enablePurchaseEventId: false, // Trilha A - sem dedupe
            
            // Callback para criar cobrança PushinPay
            pushinpayCallback: async (dados) => {
                console.log('💳 Criando cobrança PushinPay:', dados);
                
                // Aqui você chama sua API PushinPay
                // const response = await criarCobrancaPushinPay({
                //     amount: dados.value,
                //     currency: dados.currency,
                //     metadata: dados.metadata // Inclui checkout_id
                // });
                
                // return response;
                
                // Simulação para exemplo
                return {
                    success: true,
                    transaction_id: 'tx_' + Date.now(),
                    pix_code: 'PIX_CODE_AQUI'
                };
            }
        });
        
        console.log('✅ Checkout criado:', resultado);
        
        if (resultado.success) {
            // Salva dados para usar na página de confirmação
            sessionStorage.setItem('checkout_data', JSON.stringify({
                checkout_id: resultado.checkout_id,
                value: 19.90,
                currency: 'BRL'
            }));
            
            // Redireciona ou mostra PIX
            // window.location.href = '/pagamento?checkout=' + resultado.checkout_id;
        }
        
    } catch (error) {
        console.error('❌ Erro no checkout:', error);
    }
}

/**
 * Exemplo 2: Checkout com dedupe perfeito (Trilha B)
 */
async function exemploCheckoutComDedupe() {
    try {
        const resultado = await window.lepolepoCheckout.createCheckoutWithTracking({
            value: 29.90,
            currency: 'BRL',
            enablePurchaseEventId: true, // Trilha B - dedupe perfeito
            
            pushinpayCallback: async (dados) => {
                console.log('💳 Criando cobrança PushinPay (com dedupe):', dados);
                
                // Sua implementação PushinPay aqui
                return {
                    success: true,
                    transaction_id: 'tx_dedupe_' + Date.now(),
                    pix_code: 'PIX_CODE_DEDUPE'
                };
            },
            
            // Metadados adicionais
            metadata: {
                product_id: 'curso_stella',
                campaign: 'black_friday_2024'
            }
        });
        
        console.log('✅ Checkout com dedupe criado:', resultado);
        
        if (resultado.success) {
            // Salva purchase_event_id para usar na página de confirmação
            sessionStorage.setItem('purchase_event_id', resultado.purchase_event_id);
            sessionStorage.setItem('checkout_data', JSON.stringify({
                checkout_id: resultado.checkout_id,
                purchase_event_id: resultado.purchase_event_id,
                value: 29.90,
                currency: 'BRL'
            }));
        }
        
    } catch (error) {
        console.error('❌ Erro no checkout com dedupe:', error);
    }
}

/**
 * Exemplo 3: Página de confirmação/obrigado (Trilha B)
 * Execute este código na página de confirmação de pagamento
 */
function exemploConfirmacaoPagamento() {
    try {
        // Recupera dados salvos do checkout
        const checkoutData = JSON.parse(sessionStorage.getItem('checkout_data') || '{}');
        
        if (checkoutData.purchase_event_id) {
            // Trilha B: Dispara Pixel Purchase com mesmo event_id da CAPI
            const sucesso = window.lepolepoCheckout.firePixelPurchase({
                purchase_event_id: checkoutData.purchase_event_id,
                value: checkoutData.value,
                currency: checkoutData.currency
            });
            
            console.log('🎯 Pixel Purchase disparado:', sucesso ? '✅' : '❌');
            
            // Limpa dados da sessão
            sessionStorage.removeItem('checkout_data');
            sessionStorage.removeItem('purchase_event_id');
        } else {
            console.log('ℹ️ Sem purchase_event_id, usando Trilha A (apenas CAPI)');
        }
        
    } catch (error) {
        console.error('❌ Erro na confirmação:', error);
    }
}

/**
 * Exemplo 4: Debug e teste
 */
function exemploDebugTracking() {
    // Ativa debug
    window.lepolepoDebug = true;
    
    // Testa geração de IDs
    console.log('🔍 Debug IDs:', window.lepolepoIds.debugIds());
    
    // Testa tracking básico
    const tracking = window.lepolepoCheckout.getCheckoutTracking({ debug: true });
    const trackingData = tracking.getTrackingData();
    console.log('📊 Tracking Data:', trackingData);
}

/**
 * Exemplo 5: Integração com botão de compra
 */
function configurarBotaoCompra() {
    const botaoComprar = document.getElementById('btn-comprar');
    
    if (botaoComprar) {
        botaoComprar.addEventListener('click', async (event) => {
            event.preventDefault();
            
            // Desabilita botão para evitar duplo clique
            botaoComprar.disabled = true;
            botaoComprar.textContent = 'Processando...';
            
            try {
                // Obtém valor do produto (exemplo)
                const valor = parseFloat(botaoComprar.dataset.valor || '19.90');
                
                // Cria checkout com tracking
                const resultado = await window.lepolepoCheckout.createCheckoutWithTracking({
                    value: valor,
                    currency: 'BRL',
                    enablePurchaseEventId: true, // Trilha B
                    
                    pushinpayCallback: async (dados) => {
                        // Sua integração PushinPay aqui
                        console.log('Criando cobrança:', dados);
                        
                        // Simulação
                        return {
                            success: true,
                            transaction_id: 'tx_' + Date.now(),
                            pix_code: 'PIX_CODE_EXEMPLO'
                        };
                    }
                });
                
                if (resultado.success) {
                    // Salva dados e redireciona
                    sessionStorage.setItem('checkout_data', JSON.stringify({
                        checkout_id: resultado.checkout_id,
                        purchase_event_id: resultado.purchase_event_id,
                        value: valor,
                        currency: 'BRL'
                    }));
                    
                    // Redireciona para página de pagamento
                    window.location.href = '/pagamento?checkout=' + resultado.checkout_id;
                } else {
                    alert('Erro ao processar checkout: ' + resultado.error);
                }
                
            } catch (error) {
                console.error('Erro no botão comprar:', error);
                alert('Erro inesperado. Tente novamente.');
            } finally {
                // Reabilita botão
                botaoComprar.disabled = false;
                botaoComprar.textContent = 'Comprar Agora';
            }
        });
    }
}

// Exemplos de uso quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    console.log('📚 Exemplos de Checkout Tracking carregados');
    
    // Configura botão de compra se existir
    configurarBotaoCompra();
    
    // Se estamos na página de confirmação, executa lógica de confirmação
    if (window.location.pathname.includes('/confirmacao') || 
        window.location.pathname.includes('/obrigado')) {
        exemploConfirmacaoPagamento();
    }
});

// Exporta exemplos para uso manual
if (typeof window !== 'undefined') {
    window.exemploCheckout = {
        basico: exemploCheckoutBasico,
        comDedupe: exemploCheckoutComDedupe,
        confirmacao: exemploConfirmacaoPagamento,
        debug: exemploDebugTracking
    };
}
