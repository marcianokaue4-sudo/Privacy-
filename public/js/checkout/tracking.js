/**
 * Checkout Tracking Integration - Integração com tracking antes do pagamento
 * 
 * Este módulo integra o tracking do checkout com UTMStore e Meta Pixel,
 * enviando dados para o backend antes de criar a cobrança PushinPay.
 * 
 * @author Sistema de Tracking UTMify + Meta Pixel + Telegram
 * @version 1.0.0
 */

import { makeCheckoutId, shortEventId } from './ids.js';

/**
 * Classe principal para tracking de checkout
 */
class CheckoutTracking {
    constructor(options = {}) {
        this.backendUrl = options.backendUrl || window.location.origin;
        this.debug = options.debug || false;
        
        this.log('CheckoutTracking inicializado:', {
            backendUrl: this.backendUrl,
            debug: this.debug
        });
    }

    /**
     * Log condicional para debug
     */
    log(...args) {
        if (this.debug || window.lepolepoDebug) {
            console.log('🛒 CheckoutTracking:', ...args);
        }
    }

    /**
     * Obtém dados de tracking do UTMStore
     * @returns {Object} Dados de tracking
     */
    getTrackingData() {
        try {
            // Verifica se UTMStore está disponível
            if (typeof window.UTMStore === 'undefined') {
                this.log('⚠️ UTMStore não encontrado, usando dados básicos');
                return this.getFallbackTrackingData();
            }

            const tracking = window.UTMStore.getTracking();
            this.log('📊 Tracking obtido do UTMStore:', tracking);
            
            return tracking;
            
        } catch (error) {
            this.log('❌ Erro ao obter tracking, usando fallback:', error);
            return this.getFallbackTrackingData();
        }
    }

    /**
     * Dados de tracking de fallback quando UTMStore não está disponível
     * @returns {Object} Dados básicos de tracking
     */
    getFallbackTrackingData() {
        // Tenta ler cookies fbp/fbc diretamente
        const fbp = this.getCookie('_fbp');
        const fbc = this.getCookie('_fbc');
        
        return {
            fbp,
            fbc,
            src: 'organic', // Assume orgânico como padrão
            utms: this.getUtmsFromUrl(),
            timestamp: Date.now()
        };
    }

    /**
     * Extrai UTMs da URL atual
     * @returns {Object} Parâmetros UTM
     */
    getUtmsFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        
        return {
            utm_source: urlParams.get('utm_source'),
            utm_medium: urlParams.get('utm_medium'),
            utm_campaign: urlParams.get('utm_campaign'),
            utm_content: urlParams.get('utm_content'),
            utm_term: urlParams.get('utm_term')
        };
    }

    /**
     * Lê cookie por nome
     * @param {string} name - Nome do cookie
     * @returns {string|null} Valor do cookie
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    /**
     * Salva tracking do checkout no backend
     * @param {Object} checkoutData - Dados do checkout
     * @returns {Promise<Object>} Resultado do salvamento
     */
    async saveCheckoutTracking(checkoutData) {
        const {
            checkout_id,
            value,
            currency = 'BRL',
            enablePurchaseEventId = false // Trilha B - dedupe perfeito
        } = checkoutData;

        try {
            // Valida dados obrigatórios
            if (!checkout_id || !value) {
                throw new Error('checkout_id e value são obrigatórios');
            }

            // Obtém dados de tracking
            const tracking = this.getTrackingData();
            
            // Gera purchase_event_id se Trilha B estiver habilitada
            let purchase_event_id;
            if (enablePurchaseEventId) {
                purchase_event_id = window.shortEventId ? 
                    window.shortEventId('purchase', 12) : 
                    shortEventId('purchase', 12);
                
                this.log('🎯 Purchase Event ID gerado (Trilha B):', purchase_event_id);
            }

            // Monta payload para o backend
            const payload = {
                checkout_id,
                value: Number(value),
                currency: currency.toUpperCase(),
                fbp: tracking.fbp,
                fbc: tracking.fbc,
                utms: tracking.utms || tracking, // Compatibilidade
                src: tracking.src,
                client_user_agent: navigator.userAgent,
                purchase_event_id
            };

            this.log('📤 Enviando tracking para backend:', payload);

            // Envia para o backend
            const response = await fetch(`${this.backendUrl}/track/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Backend error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const result = await response.json();
            this.log('✅ Tracking salvo com sucesso:', result);

            return {
                success: true,
                checkout_id,
                purchase_event_id,
                result
            };

        } catch (error) {
            this.log('❌ Erro ao salvar tracking:', error);
            
            return {
                success: false,
                error: error.message,
                checkout_id
            };
        }
    }

    /**
     * Cria checkout completo com tracking
     * @param {Object} options - Opções do checkout
     * @returns {Promise<Object>} Resultado do checkout
     */
    async createCheckoutWithTracking(options) {
        const {
            value,
            currency = 'BRL',
            enablePurchaseEventId = false,
            pushinpayCallback, // Função para criar cobrança PushinPay
            metadata = {} // Metadados adicionais para PushinPay
        } = options;

        try {
            // Gera checkout_id único
            const checkout_id = makeCheckoutId();
            this.log('🆔 Checkout ID gerado:', checkout_id);

            // Salva tracking no backend
            const trackingResult = await this.saveCheckoutTracking({
                checkout_id,
                value,
                currency,
                enablePurchaseEventId
            });

            if (!trackingResult.success) {
                this.log('⚠️ Falha no tracking, continuando com checkout...');
            }

            // Prepara metadados para PushinPay
            const pushinpayMetadata = {
                ...metadata,
                checkout_id
            };

            // Se há dados de tracking, adiciona como base64 compacto
            if (trackingResult.success) {
                try {
                    const trackingData = { 
                        checkout_id,
                        purchase_event_id: trackingResult.purchase_event_id
                    };
                    pushinpayMetadata.tracking = btoa(JSON.stringify(trackingData));
                } catch (encodeError) {
                    this.log('⚠️ Erro ao codificar tracking metadata:', encodeError);
                }
            }

            // Chama função de criação da cobrança PushinPay
            let pushinpayResult;
            if (pushinpayCallback && typeof pushinpayCallback === 'function') {
                pushinpayResult = await pushinpayCallback({
                    value,
                    currency,
                    metadata: pushinpayMetadata
                });
                
                this.log('💳 Cobrança PushinPay criada:', pushinpayResult);
            }

            return {
                success: true,
                checkout_id,
                purchase_event_id: trackingResult.purchase_event_id,
                tracking_saved: trackingResult.success,
                pushinpay_result: pushinpayResult
            };

        } catch (error) {
            this.log('❌ Erro no checkout com tracking:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Dispara Pixel Purchase (Trilha B - página de obrigado)
     * @param {Object} purchaseData - Dados da compra
     */
    firePixelPurchase(purchaseData) {
        const {
            purchase_event_id,
            value,
            currency = 'BRL'
        } = purchaseData;

        try {
            // Verifica se Meta Pixel está disponível
            if (typeof window.fbq === 'undefined') {
                this.log('⚠️ Meta Pixel não encontrado, pulando Pixel Purchase');
                return false;
            }

            // Dispara Purchase com mesmo event_id para dedupe
            const pixelData = {
                value: Number(value),
                currency: currency.toUpperCase()
            };

            if (purchase_event_id) {
                // Trilha B: Usa mesmo event_id da CAPI
                window.fbq('track', 'Purchase', pixelData, { eventID: purchase_event_id });
                this.log('🎯 Pixel Purchase disparado (Trilha B):', {
                    purchase_event_id,
                    value,
                    currency
                });
            } else {
                // Trilha A: Disparo normal sem dedupe
                window.fbq('track', 'Purchase', pixelData);
                this.log('🎯 Pixel Purchase disparado (Trilha A):', {
                    value,
                    currency
                });
            }

            return true;

        } catch (error) {
            this.log('❌ Erro ao disparar Pixel Purchase:', error);
            return false;
        }
    }
}

// Instância global
let checkoutTrackingInstance = null;

/**
 * Obtém instância singleton do CheckoutTracking
 * @param {Object} options - Opções de configuração
 * @returns {CheckoutTracking} Instância do tracking
 */
export function getCheckoutTracking(options = {}) {
    if (!checkoutTrackingInstance) {
        checkoutTrackingInstance = new CheckoutTracking(options);
    }
    return checkoutTrackingInstance;
}

/**
 * Função de conveniência para criar checkout com tracking
 * @param {Object} options - Opções do checkout
 * @returns {Promise<Object>} Resultado do checkout
 */
export async function createCheckoutWithTracking(options) {
    const tracking = getCheckoutTracking();
    return await tracking.createCheckoutWithTracking(options);
}

/**
 * Função de conveniência para disparar Pixel Purchase
 * @param {Object} purchaseData - Dados da compra
 * @returns {boolean} True se disparado com sucesso
 */
export function firePixelPurchase(purchaseData) {
    const tracking = getCheckoutTracking();
    return tracking.firePixelPurchase(purchaseData);
}

// Exporta classe e funções para window (compatibilidade)
if (typeof window !== 'undefined') {
    window.CheckoutTracking = CheckoutTracking;
    window.lepolepoCheckout = {
        getCheckoutTracking,
        createCheckoutWithTracking,
        firePixelPurchase
    };
}

export { CheckoutTracking };
export default getCheckoutTracking;
