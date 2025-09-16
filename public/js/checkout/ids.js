/**
 * Checkout IDs Generator - Geração de IDs únicos para checkout
 * 
 * Este módulo gera IDs únicos para tracking de checkout,
 * compatível com navegadores modernos e legados.
 * 
 * @author Sistema de Tracking UTMify + Meta Pixel + Telegram
 * @version 1.0.0
 */

/**
 * Gera um ID único para checkout
 * @returns {string} ID único do checkout
 */
export function makeCheckoutId() {
    // Tenta usar crypto.randomUUID se disponível (navegadores modernos)
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    
    // Fallback para navegadores mais antigos
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    return `co_${timestamp}_${random}`;
}

/**
 * Gera um ID curto para eventos (Trilha B - dedupe perfeito)
 * @param {string} eventType - Tipo do evento (ex: 'purchase')
 * @param {number} length - Comprimento do ID (padrão: 12)
 * @returns {string} ID curto do evento
 */
export function shortEventId(eventType, length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `${eventType}_${result}`;
}

/**
 * Valida se um ID de checkout é válido
 * @param {string} checkoutId - ID do checkout para validar
 * @returns {boolean} True se válido
 */
export function isValidCheckoutId(checkoutId) {
    if (!checkoutId || typeof checkoutId !== 'string') {
        return false;
    }
    
    // UUID v4 pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // Fallback pattern (co_timestamp_random)
    const fallbackPattern = /^co_\d+_[a-z0-9]{6}$/i;
    
    return uuidPattern.test(checkoutId) || fallbackPattern.test(checkoutId);
}

/**
 * Gera um ID de sessão para tracking
 * @returns {string} ID da sessão
 */
export function makeSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    return `sess_${timestamp}_${random}`;
}

/**
 * Obtém ou cria um ID de sessão persistente
 * @returns {string} ID da sessão (persistido no sessionStorage)
 */
export function getOrCreateSessionId() {
    const SESSION_KEY = 'lepolepo_session_id';
    
    try {
        let sessionId = sessionStorage.getItem(SESSION_KEY);
        
        if (!sessionId) {
            sessionId = makeSessionId();
            sessionStorage.setItem(SESSION_KEY, sessionId);
        }
        
        return sessionId;
        
    } catch (error) {
        // Se sessionStorage não estiver disponível, gera novo ID
        console.warn('SessionStorage não disponível, usando ID temporário:', error.message);
        return makeSessionId();
    }
}

/**
 * Debug: Lista informações sobre IDs gerados
 * @returns {Object} Informações de debug
 */
export function debugIds() {
    return {
        checkout_id_sample: makeCheckoutId(),
        session_id_sample: makeSessionId(),
        purchase_event_id_sample: shortEventId('purchase', 12),
        current_session_id: getOrCreateSessionId(),
        crypto_available: !!(window.crypto && window.crypto.randomUUID),
        sessionStorage_available: !!window.sessionStorage,
        timestamp: new Date().toISOString()
    };
}

// Compatibilidade com window.shortEventId (se já existir)
if (typeof window !== 'undefined') {
    // Se já existe shortEventId no window, preserva
    if (!window.shortEventId) {
        window.shortEventId = shortEventId;
    }
    
    // Adiciona outras funções úteis ao window para debug
    window.lepolepoIds = {
        makeCheckoutId,
        shortEventId,
        isValidCheckoutId,
        makeSessionId,
        getOrCreateSessionId,
        debugIds
    };
}

// Para uso em módulos ES6
export default {
    makeCheckoutId,
    shortEventId,
    isValidCheckoutId,
    makeSessionId,
    getOrCreateSessionId,
    debugIds
};
