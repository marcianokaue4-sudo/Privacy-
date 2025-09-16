/**
 * Telegram Deep Link Module - Sistema de Payload para Start Parameter
 * 
 * Este módulo gera payloads compactos para deep links do Telegram,
 * respeitando o limite de 64 caracteres do parâmetro start.
 * 
 * Funcionalidades:
 * - Codificação base64url (sem =, com - e _)
 * - Hash SHA256 truncado (6 caracteres) para compactação
 * - Geração de payload no formato: v1|src|cmp|ad|ts|eid
 * - Construção de deep link para t.me/stellabeghini_bot
 * - Função de debug para desenvolvimento
 * 
 * @author Sistema de Tracking UTMify + Meta Pixel + Telegram
 * @version 1.0.0
 */

(function(window) {
    'use strict';

    // Configurações do módulo
    const CONFIG = {
        BOT_USERNAME: 'marianapolleto_bot',
        TELEGRAM_BASE_URL: 'https://t.me/',
        PAYLOAD_VERSION: 'v1',
        MAX_PAYLOAD_LENGTH: 64,
        HASH_LENGTH: 6
    };

    /**
     * Codifica string em base64url (RFC 4648 Section 5)
     * Remove padding (=) e substitui + por - e / por _
     * @param {string} str - String para codificar
     * @returns {string} String codificada em base64url
     */
    function base64url(str) {
        try {
            // Converte string para base64 padrão
            const base64 = btoa(unescape(encodeURIComponent(str)));
            
            // Converte para base64url
            return base64
                .replace(/\+/g, '-')    // + vira -
                .replace(/\//g, '_')    // / vira _
                .replace(/=/g, '');     // Remove padding =
                
        } catch (error) {
            console.warn('⚠️ Erro na codificação base64url:', error);
            return str.replace(/[^a-zA-Z0-9\-_]/g, ''); // Fallback: remove caracteres especiais
        }
    }

    /**
     * Gera hash SHA256 truncado (primeiros 6 caracteres)
     * @param {string} input - String para fazer hash
     * @returns {Promise<string>} Hash truncado de 6 caracteres
     */
    async function hash6(input) {
        if (!input || input === '-') {
            return '------'; // Placeholder para valores vazios
        }

        try {
            // Tenta usar crypto.subtle (mais seguro)
            if (window.crypto && window.crypto.subtle) {
                const encoder = new TextEncoder();
                const data = encoder.encode(input);
                const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
                const hashArray = new Uint8Array(hashBuffer);
                
                // Converte para hex e pega os primeiros 6 caracteres
                const hashHex = Array.from(hashArray)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
                
                return hashHex.substring(0, CONFIG.HASH_LENGTH);
            }
        } catch (error) {
            console.warn('⚠️ Erro no crypto.subtle, usando fallback:', error);
        }

        // Fallback simples: hash baseado em charCode
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Converte para 32bit integer
        }
        
        // Converte para hex positivo e pega 6 caracteres
        const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
        return hashHex.substring(0, CONFIG.HASH_LENGTH);
    }

    /**
     * Versão síncrona do hash6 (fallback)
     * @param {string} input - String para fazer hash
     * @returns {string} Hash truncado de 6 caracteres
     */
    function hash6Sync(input) {
        if (!input || input === '-') {
            return '------';
        }

        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
        return hashHex.substring(0, CONFIG.HASH_LENGTH);
    }

    /**
     * Constrói payload para o parâmetro start do Telegram
     * Formato: v1|src|cmp|ad|ts|eid
     * @param {Object} tracking - Dados de tracking do UTMStore
     * @param {string} eventId - Event ID do Meta Pixel
     * @returns {Promise<string>} Payload compacto ≤ 64 caracteres
     */
    async function buildTelegramStartPayload(tracking, eventId) {
        try {
            // 1. Versão do payload
            const version = CONFIG.PAYLOAD_VERSION;
            
            // 2. Source (paid ou organic)
            let src = 'organic'; // Padrão
            if (tracking && tracking.src) {
                src = tracking.src.toLowerCase() === 'paid' ? 'paid' : 'organic';
            }
            
            // 3. Campaign hash (utm_campaign)
            const campaignValue = (tracking && tracking.utm_campaign) ? tracking.utm_campaign : '-';
            const cmp = await hash6(campaignValue);
            
            // 4. Content/Ad hash (utm_content)
            const contentValue = (tracking && tracking.utm_content) ? tracking.utm_content : '-';
            const ad = await hash6(contentValue);
            
            // 5. Timestamp (epoch seconds)
            let ts = Math.floor(Date.now() / 1000).toString();
            
            // 6. Event ID (completo se shortEventId, senão últimos 4)
            let eid = '0000'; // Padrão
            if (eventId) {
                // Se é um shortEventId (12-16 chars), usa completo
                if (eventId.length >= 12 && eventId.length <= 16 && !eventId.includes('-')) {
                    eid = eventId;
                } else if (eventId.length >= 4) {
                    // Fallback: últimos 4 caracteres (compatibilidade)
                    eid = eventId.slice(-4);
                }
            }
            
            // Monta o payload inicial
            let payload = `${version}|${src}|${cmp}|${ad}|${ts}|${eid}`;
            
            // Verifica se excede 64 caracteres
            if (payload.length > CONFIG.MAX_PAYLOAD_LENGTH) {
                // Reduz timestamp para 6 dígitos (mod 1e6)
                ts = (parseInt(ts) % 1000000).toString();
                payload = `${version}|${src}|${cmp}|${ad}|${ts}|${eid}`;
                
                console.log('⚠️ Payload reduzido para caber em 64 chars:', payload.length);
            }
            
            return payload;
            
        } catch (error) {
            console.error('❌ Erro ao construir payload Telegram:', error);
            
            // Fallback mínimo
            const fallbackTs = Math.floor(Date.now() / 1000) % 1000000;
            return `v1|organic|---------|---------|${fallbackTs}|0000`;
        }
    }

    /**
     * Versão síncrona do buildTelegramStartPayload
     * @param {Object} tracking - Dados de tracking do UTMStore
     * @param {string} eventId - Event ID do Meta Pixel
     * @returns {string} Payload compacto ≤ 64 caracteres
     */
    function buildTelegramStartPayloadSync(tracking, eventId) {
        try {
            const version = CONFIG.PAYLOAD_VERSION;
            
            let src = 'organic';
            if (tracking && tracking.src) {
                src = tracking.src.toLowerCase() === 'paid' ? 'paid' : 'organic';
            }
            
            const campaignValue = (tracking && tracking.utm_campaign) ? tracking.utm_campaign : '-';
            const cmp = hash6Sync(campaignValue);
            
            const contentValue = (tracking && tracking.utm_content) ? tracking.utm_content : '-';
            const ad = hash6Sync(contentValue);
            
            let ts = Math.floor(Date.now() / 1000).toString();
            
            let eid = '0000';
            if (eventId) {
                // Se é um shortEventId (12-16 chars), usa completo
                if (eventId.length >= 12 && eventId.length <= 16 && !eventId.includes('-')) {
                    eid = eventId;
                } else if (eventId.length >= 4) {
                    // Fallback: últimos 4 caracteres (compatibilidade)
                    eid = eventId.slice(-4);
                }
            }
            
            let payload = `${version}|${src}|${cmp}|${ad}|${ts}|${eid}`;
            
            if (payload.length > CONFIG.MAX_PAYLOAD_LENGTH) {
                ts = (parseInt(ts) % 1000000).toString();
                payload = `${version}|${src}|${cmp}|${ad}|${ts}|${eid}`;
            }
            
            return payload;
            
        } catch (error) {
            console.error('❌ Erro ao construir payload Telegram (sync):', error);
            const fallbackTs = Math.floor(Date.now() / 1000) % 1000000;
            return `v1|organic|---------|---------|${fallbackTs}|0000`;
        }
    }

    /**
     * Constrói deep link completo do Telegram
     * @param {string} payload - Payload do start parameter
     * @returns {string} URL completa do deep link
     */
    function buildTelegramDeepLink(payload) {
        const baseUrl = CONFIG.TELEGRAM_BASE_URL + CONFIG.BOT_USERNAME;
        const encodedPayload = encodeURIComponent(payload);
        return `${baseUrl}?start=${encodedPayload}`;
    }

    /**
     * Parseia um payload de volta para seus componentes
     * @param {string} payload - Payload para parsear
     * @returns {Object} Componentes do payload
     */
    function parsePayload(payload) {
        try {
            const parts = payload.split('|');
            
            if (parts.length !== 6) {
                throw new Error('Formato de payload inválido');
            }
            
            return {
                version: parts[0],
                src: parts[1],
                cmp: parts[2],
                ad: parts[3],
                ts: parseInt(parts[4]),
                eid: parts[5],
                timestamp_date: new Date(parseInt(parts[4]) * 1000),
                is_paid: parts[1] === 'paid'
            };
            
        } catch (error) {
            console.warn('⚠️ Erro ao parsear payload:', error);
            return {
                version: 'v1',
                src: 'unknown',
                cmp: '------',
                ad: '------',
                ts: 0,
                eid: '0000',
                timestamp_date: new Date(),
                is_paid: false,
                error: error.message
            };
        }
    }

    /**
     * Função de debug para desenvolvimento
     * Simula payload com dados atuais
     */
    function debugTelegram() {
        try {
            console.log('🔍 TELEGRAM DEBUG - Simulando payload atual:');
            
            // Obtém dados de tracking atuais
            const tracking = window.UTMStore ? window.UTMStore.getTracking() : {};
            
            // Simula event_id
            const eventId = window.newEventId ? window.newEventId('lead') : 'lead-test-1234';
            
            // Gera payload
            const payload = buildTelegramStartPayloadSync(tracking, eventId);
            const deepLink = buildTelegramDeepLink(payload);
            
            console.log('📊 Dados de tracking:', tracking);
            console.log('🆔 Event ID simulado:', eventId);
            console.log('📦 Payload gerado:', payload, `(${payload.length} chars)`);
            console.log('🔗 Deep link:', deepLink);
            
            // Parseia de volta para validar
            const parsed = parsePayload(payload);
            console.log('🔄 Payload parseado:', parsed);
            
            return {
                tracking,
                eventId,
                payload,
                deepLink,
                parsed,
                payload_length: payload.length
            };
            
        } catch (error) {
            console.error('❌ Erro no debug Telegram:', error);
            return { error: error.message };
        }
    }

    // API pública do módulo
    const TelegramDeepLink = {
        // Funções principais
        buildPayload: buildTelegramStartPayload,
        buildPayloadSync: buildTelegramStartPayloadSync,
        buildDeepLink: buildTelegramDeepLink,
        parsePayload: parsePayload,
        
        // Funções auxiliares
        base64url: base64url,
        hash6: hash6,
        hash6Sync: hash6Sync,
        
        // Debug
        debug: debugTelegram,
        
        // Configurações (somente leitura)
        config: {
            BOT_USERNAME: CONFIG.BOT_USERNAME,
            TELEGRAM_BASE_URL: CONFIG.TELEGRAM_BASE_URL,
            PAYLOAD_VERSION: CONFIG.PAYLOAD_VERSION,
            MAX_PAYLOAD_LENGTH: CONFIG.MAX_PAYLOAD_LENGTH,
            HASH_LENGTH: CONFIG.HASH_LENGTH
        }
    };

    // Exporta o módulo
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js
        module.exports = TelegramDeepLink;
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(function() { return TelegramDeepLink; });
    } else {
        // Browser global
        window.TelegramDeepLink = TelegramDeepLink;
        
        // Alias para debug
        window.__tgDebug = debugTelegram;
    }

})(window);
