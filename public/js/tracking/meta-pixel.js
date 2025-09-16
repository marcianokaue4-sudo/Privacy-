/**
 * Meta Pixel Module - Sistema de Tracking Meta/Facebook
 * 
 * Este módulo gerencia o Meta Pixel (Facebook Pixel) para tracking de eventos
 * de conversão e integração com a Meta Conversions API.
 * 
 * Funcionalidades:
 * - Bootstrap do fbq (Facebook Pixel)
 * - Inicialização com Pixel ID 916142607046004
 * - Tracking de eventos com dados customizados
 * - Integração com UTMStore para dados de rastreamento
 * - Suporte a modo de teste via fb_test_event_code
 * - Deduplicação de eventos via event_id
 * 
 * @author Sistema de Tracking UTMify + Meta Pixel
 * @version 1.0.0
 */

(function(window) {
    'use strict';

    // Configurações do Meta Pixel
    const CONFIG = {
        PIXEL_ID: '1501535374352620', // Z Hot Principal
        DEFAULT_CURRENCY: 'BRL',
        DEFAULT_VALUE: 0
    };

    /**
     * Inicializa o Meta Pixel (Facebook Pixel)
     * Garante que não seja duplicado se já existir
     */
    function initializeMetaPixel() {
        // Verifica se fbq já existe
        if (window.fbq) {
            console.log('🎯 Meta Pixel já inicializado');
            return;
        }

        // Bootstrap do Facebook Pixel
        !function(f,b,e,v,n,t,s) {
            if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)
        }(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');

        // Inicializa o pixel
        window.fbq('init', CONFIG.PIXEL_ID);
        window.fbq('consent', 'grant');

        console.log('🎯 Meta Pixel inicializado:', CONFIG.PIXEL_ID);
    }

    /**
     * Configura modo de teste se fb_test_event_code estiver presente na URL
     */
    function configureTestMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const testEventCode = urlParams.get('fb_test_event_code');
        
        if (testEventCode) {
            console.log('🧪 Meta Pixel - Modo de teste ativado:', testEventCode);
            
            // Configurações para modo de teste
            window.fbq('set', 'autoConfig', false, CONFIG.PIXEL_ID);
            window.fbq('set', 'agent', 'tmgoogletagmanager', CONFIG.PIXEL_ID);
            
            // Armazena o test event code para referência (usado no CAPI)
            window._fbTestEventCode = testEventCode;
            
            return testEventCode;
        }
        
        return null;
    }

    /**
     * Constrói dados customizados base para eventos
     * @returns {Object} Dados base para eventos Meta Pixel
     */
    function buildBaseCustomData() {
        const customData = {
            event_source_url: window.location.href,
            client_user_agent: navigator.userAgent,
            currency: CONFIG.DEFAULT_CURRENCY,
            value: CONFIG.DEFAULT_VALUE
        };

        // Adiciona dados do UTMStore se disponível
        if (window.UTMStore) {
            try {
                const trackingData = window.UTMStore.getTracking();
                
                // Adiciona UTMs e dados de rastreamento em custom_data
                // (não obrigatório para o Meta, mas útil para debug)
                customData.custom_data = {
                    utm_source: trackingData.utm_source,
                    utm_medium: trackingData.utm_medium,
                    utm_campaign: trackingData.utm_campaign,
                    utm_content: trackingData.utm_content,
                    utm_term: trackingData.utm_term,
                    src: trackingData.src,
                    fbclid: trackingData.fbclid,
                    fbp: trackingData.fbp,
                    fbc: trackingData.fbc,
                    is_paid: window.UTMStore.isPaid ? window.UTMStore.isPaid(trackingData) : false
                };
            } catch (error) {
                console.warn('⚠️ Erro ao obter dados do UTMStore:', error);
            }
        }

        return customData;
    }

    /**
     * Dispara evento do Meta Pixel
     * @param {string} eventName - Nome do evento (ex: 'InitiateCheckout', 'Lead', 'ViewContent')
     * @param {Object} customData - Dados customizados específicos do evento
     * @param {string} eventId - ID único do evento para deduplicação
     */
    function trackEvent(eventName, customData = {}, eventId = null) {
        if (!window.fbq) {
            console.error('❌ Meta Pixel não inicializado');
            return;
        }

        try {
            // Combina dados base com dados customizados
            const baseData = buildBaseCustomData();
            const finalData = { ...baseData, ...customData };
            
            // Configurações do evento
            const eventConfig = {};
            if (eventId) {
                eventConfig.eventID = eventId;
            }

            // Dispara o evento
            window.fbq('track', eventName, finalData, eventConfig);

            // Log para diagnóstico
            console.log(`🎯 Meta Pixel - ${eventName} disparado:`, {
                event_id: eventId,
                event_data: finalData,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                event_name: eventName,
                event_id: eventId,
                event_data: finalData
            };

        } catch (error) {
            console.error(`❌ Erro ao disparar evento ${eventName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtém informações de diagnóstico do Meta Pixel
     * @returns {Object} Informações de diagnóstico
     */
    function getDiagnostics() {
        const testEventCode = window._fbTestEventCode || null;
        const urlParams = new URLSearchParams(window.location.search);
        
        return {
            pixel_id: CONFIG.PIXEL_ID,
            fbq_loaded: typeof window.fbq !== 'undefined',
            test_mode: !!testEventCode,
            test_event_code: testEventCode,
            utm_store_available: typeof window.UTMStore !== 'undefined',
            current_url: window.location.href,
            has_utm_params: window.location.search.includes('utm_'),
            has_fbclid: window.location.search.includes('fbclid='),
            base_custom_data: buildBaseCustomData(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Inicializa o Meta Pixel com todas as configurações
     */
    function initialize() {
        try {
            // 1. Inicializa o Meta Pixel
            initializeMetaPixel();
            
            // 2. Configura modo de teste se necessário
            const testEventCode = configureTestMode();
            
            // 3. Dispara PageView automático (padrão do Meta Pixel)
            if (window.fbq) {
                window.fbq('track', 'PageView');
                console.log('🎯 Meta Pixel - PageView automático disparado');
            }

            // Log de inicialização
            console.log('🎯 Meta Pixel inicializado com sucesso:', {
                pixel_id: CONFIG.PIXEL_ID,
                test_mode: !!testEventCode,
                test_event_code: testEventCode
            });

            return true;

        } catch (error) {
            console.error('❌ Erro ao inicializar Meta Pixel:', error);
            return false;
        }
    }

    // API pública do módulo
    const MetaPixel = {
        // Função principal de tracking
        track: trackEvent,
        
        // Funções de inicialização
        initialize: initialize,
        
        // Funções de diagnóstico
        getDiagnostics: getDiagnostics,
        
        // Configurações (somente leitura)
        config: {
            PIXEL_ID: CONFIG.PIXEL_ID,
            DEFAULT_CURRENCY: CONFIG.DEFAULT_CURRENCY
        },
        
        // Funções auxiliares (para debug)
        _buildBaseCustomData: buildBaseCustomData,
        _configureTestMode: configureTestMode
    };

    // Exporta o módulo
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js
        module.exports = MetaPixel;
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(function() { return MetaPixel; });
    } else {
        // Browser global
        window.MetaPixel = MetaPixel;
    }

    // Auto-inicialização se o DOM já estiver carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOM já carregado, inicializa imediatamente
        setTimeout(initialize, 0);
    }

})(window);

