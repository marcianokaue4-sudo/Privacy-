/**
 * Event ID Generator Module - Sistema de Geração e Gestão de Event IDs
 * 
 * Este módulo gera IDs únicos para eventos de tracking e gerencia
 * a persistência desses IDs para deduplicação entre Browser e Server.
 * 
 * Funcionalidades:
 * - Geração de event_id únicos no formato: type-timestamp-random
 * - Fallback para crypto.randomUUID() quando disponível
 * - Persistência em sessionStorage para deduplicação
 * - Recuperação de último event_id por tipo
 * - Limpeza automática de IDs antigos
 * 
 * @author Sistema de Tracking UTMify + Meta Pixel
 * @version 1.0.0
 */

(function(window) {
    'use strict';

    // Configurações do módulo
    const CONFIG = {
        STORAGE_PREFIX: 'mp_event_',
        MAX_STORED_IDS: 10, // Máximo de IDs por tipo
        ID_EXPIRY_HOURS: 24 // IDs expiram em 24 horas
    };

    /**
     * Gera um ID aleatório
     * @returns {string} ID aleatório
     */
    function generateRandomId() {
        // Tenta usar crypto.randomUUID() se disponível (mais seguro)
        if (window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID().replace(/-/g, '').substring(0, 12);
        }
        
        // Fallback para Math.random()
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Gera caracteres base62 (0-9, A-Z, a-z)
     * @returns {string} String de caracteres base62
     */
    function getBase62Chars() {
        return '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    }

    /**
     * Gera um ID curto em base62 (para deduplicação perfeita)
     * @param {string} type - Tipo do evento
     * @param {number} length - Comprimento do ID (12-16 chars)
     * @returns {string} Event ID curto para deduplicação
     */
    function shortEventId(type, length = 12) {
        if (!type) {
            throw new Error('Tipo do evento é obrigatório');
        }

        // Normaliza o tipo
        const normalizedType = type.toLowerCase().replace(/\s+/g, '');
        
        // Gera timestamp compacto
        const timestamp = Date.now();
        const timestampBase62 = timestamp.toString(36);
        
        // Gera parte aleatória em base62
        const base62Chars = getBase62Chars();
        let randomPart = '';
        
        if (window.crypto && window.crypto.getRandomValues) {
            // Usa crypto seguro se disponível
            const array = new Uint8Array(8);
            window.crypto.getRandomValues(array);
            
            for (let i = 0; i < array.length; i++) {
                randomPart += base62Chars[array[i] % 62];
            }
        } else {
            // Fallback para Math.random()
            for (let i = 0; i < 8; i++) {
                randomPart += base62Chars[Math.floor(Math.random() * 62)];
            }
        }
        
        // Combina timestamp + random e ajusta para o comprimento desejado
        let shortId = timestampBase62 + randomPart;
        
        // Ajusta comprimento
        if (shortId.length > length) {
            shortId = shortId.substring(0, length);
        } else if (shortId.length < length) {
            // Preenche com caracteres aleatórios
            while (shortId.length < length) {
                shortId += base62Chars[Math.floor(Math.random() * 62)];
            }
        }
        
        console.log(`🆔 Short event_id gerado: ${shortId} (${shortId.length} chars)`);
        
        return shortId;
    }

    /**
     * Gera um timestamp formatado
     * @returns {string} Timestamp no formato YYYYMMDDHHMMSS
     */
    function generateTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    /**
     * Gera um novo event_id único
     * @param {string} type - Tipo do evento (ex: 'initiatecheckout', 'lead', 'viewcontent')
     * @returns {string} Event ID no formato: type-timestamp-random
     */
    function newEventId(type) {
        if (!type) {
            throw new Error('Tipo do evento é obrigatório');
        }

        // Normaliza o tipo (lowercase, sem espaços)
        const normalizedType = type.toLowerCase().replace(/\s+/g, '');
        
        // Gera componentes do ID
        const timestamp = generateTimestamp();
        const randomId = generateRandomId();
        
        // Monta o event_id final
        const eventId = `${normalizedType}-${timestamp}-${randomId}`;
        
        console.log(`🆔 Novo event_id gerado: ${eventId}`);
        
        return eventId;
    }

    /**
     * Salva um event_id no sessionStorage
     * @param {string} type - Tipo do evento
     * @param {string} id - ID do evento
     */
    function rememberEventId(type, id) {
        if (!type || !id) {
            console.warn('⚠️ Tipo e ID são obrigatórios para salvar event_id');
            return;
        }

        try {
            const storageKey = CONFIG.STORAGE_PREFIX + type.toLowerCase();
            
            // Recupera IDs existentes ou cria array vazio
            let storedIds = [];
            const existingData = sessionStorage.getItem(storageKey);
            if (existingData) {
                storedIds = JSON.parse(existingData);
            }
            
            // Adiciona novo ID com timestamp
            const eventData = {
                id: id,
                timestamp: Date.now(),
                created_at: new Date().toISOString()
            };
            
            storedIds.unshift(eventData); // Adiciona no início (mais recente)
            
            // Limita o número de IDs armazenados
            if (storedIds.length > CONFIG.MAX_STORED_IDS) {
                storedIds = storedIds.slice(0, CONFIG.MAX_STORED_IDS);
            }
            
            // Salva no sessionStorage
            sessionStorage.setItem(storageKey, JSON.stringify(storedIds));
            
            console.log(`💾 Event ID salvo: ${type} → ${id}`);
            
        } catch (error) {
            console.warn('⚠️ Erro ao salvar event_id:', error);
        }
    }

    /**
     * Recupera o último event_id de um tipo
     * @param {string} type - Tipo do evento
     * @returns {string|null} Último event_id ou null se não encontrado
     */
    function getLastEventId(type) {
        if (!type) {
            return null;
        }

        try {
            const storageKey = CONFIG.STORAGE_PREFIX + type.toLowerCase();
            const existingData = sessionStorage.getItem(storageKey);
            
            if (!existingData) {
                return null;
            }
            
            const storedIds = JSON.parse(existingData);
            
            if (!Array.isArray(storedIds) || storedIds.length === 0) {
                return null;
            }
            
            // Remove IDs expirados
            const now = Date.now();
            const expiryTime = CONFIG.ID_EXPIRY_HOURS * 60 * 60 * 1000; // 24 horas em ms
            
            const validIds = storedIds.filter(item => {
                return item.timestamp && (now - item.timestamp) < expiryTime;
            });
            
            // Se removeu IDs expirados, atualiza o storage
            if (validIds.length !== storedIds.length) {
                sessionStorage.setItem(storageKey, JSON.stringify(validIds));
            }
            
            // Retorna o ID mais recente
            return validIds.length > 0 ? validIds[0].id : null;
            
        } catch (error) {
            console.warn('⚠️ Erro ao recuperar event_id:', error);
            return null;
        }
    }

    /**
     * Lista todos os event_ids armazenados por tipo
     * @param {string} type - Tipo do evento (opcional)
     * @returns {Object|Array} IDs armazenados
     */
    function listStoredEventIds(type = null) {
        try {
            if (type) {
                // Retorna IDs de um tipo específico
                const storageKey = CONFIG.STORAGE_PREFIX + type.toLowerCase();
                const data = sessionStorage.getItem(storageKey);
                return data ? JSON.parse(data) : [];
            }
            
            // Retorna todos os tipos
            const allIds = {};
            
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith(CONFIG.STORAGE_PREFIX)) {
                    const eventType = key.replace(CONFIG.STORAGE_PREFIX, '');
                    const data = sessionStorage.getItem(key);
                    allIds[eventType] = data ? JSON.parse(data) : [];
                }
            }
            
            return allIds;
            
        } catch (error) {
            console.warn('⚠️ Erro ao listar event_ids:', error);
            return type ? [] : {};
        }
    }

    /**
     * Limpa event_ids antigos ou de um tipo específico
     * @param {string} type - Tipo específico para limpar (opcional)
     */
    function clearEventIds(type = null) {
        try {
            if (type) {
                // Limpa um tipo específico
                const storageKey = CONFIG.STORAGE_PREFIX + type.toLowerCase();
                sessionStorage.removeItem(storageKey);
                console.log(`🗑️ Event IDs limpos para tipo: ${type}`);
            } else {
                // Limpa todos os event_ids
                const keysToRemove = [];
                
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key && key.startsWith(CONFIG.STORAGE_PREFIX)) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => sessionStorage.removeItem(key));
                console.log('🗑️ Todos os event IDs foram limpos');
            }
            
        } catch (error) {
            console.warn('⚠️ Erro ao limpar event_ids:', error);
        }
    }

    /**
     * Obtém estatísticas dos event_ids armazenados
     * @returns {Object} Estatísticas
     */
    function getStatistics() {
        try {
            const allIds = listStoredEventIds();
            const stats = {
                total_types: Object.keys(allIds).length,
                total_ids: 0,
                types: {},
                oldest_id: null,
                newest_id: null,
                storage_usage: 0
            };
            
            let oldestTimestamp = Infinity;
            let newestTimestamp = 0;
            
            Object.keys(allIds).forEach(type => {
                const ids = allIds[type];
                stats.types[type] = {
                    count: ids.length,
                    last_id: ids.length > 0 ? ids[0].id : null,
                    last_created: ids.length > 0 ? ids[0].created_at : null
                };
                
                stats.total_ids += ids.length;
                
                // Encontra o mais antigo e mais novo
                ids.forEach(item => {
                    if (item.timestamp < oldestTimestamp) {
                        oldestTimestamp = item.timestamp;
                        stats.oldest_id = item.id;
                    }
                    if (item.timestamp > newestTimestamp) {
                        newestTimestamp = item.timestamp;
                        stats.newest_id = item.id;
                    }
                });
            });
            
            // Calcula uso aproximado do storage
            const storageData = JSON.stringify(allIds);
            stats.storage_usage = new Blob([storageData]).size;
            
            return stats;
            
        } catch (error) {
            console.warn('⚠️ Erro ao calcular estatísticas:', error);
            return {
                total_types: 0,
                total_ids: 0,
                types: {},
                error: error.message
            };
        }
    }

    // API pública do módulo
    const EventIdGenerator = {
        // Funções principais
        newEventId: newEventId,
        shortEventId: shortEventId, // NOVO: Para deduplicação perfeita
        rememberEventId: rememberEventId,
        getLastEventId: getLastEventId,
        
        // Funções de gestão
        listStoredEventIds: listStoredEventIds,
        clearEventIds: clearEventIds,
        getStatistics: getStatistics,
        
        // Configurações (somente leitura)
        config: {
            STORAGE_PREFIX: CONFIG.STORAGE_PREFIX,
            MAX_STORED_IDS: CONFIG.MAX_STORED_IDS,
            ID_EXPIRY_HOURS: CONFIG.ID_EXPIRY_HOURS
        },
        
        // Funções auxiliares (para debug)
        _generateRandomId: generateRandomId,
        _generateTimestamp: generateTimestamp,
        _getBase62Chars: getBase62Chars
    };

    // Exporta o módulo
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js
        module.exports = EventIdGenerator;
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(function() { return EventIdGenerator; });
    } else {
        // Browser global
        window.EventIdGenerator = EventIdGenerator;
        
        // Alias para facilitar uso
        window.newEventId = newEventId;
        window.shortEventId = shortEventId; // NOVO: Alias para deduplicação
        window.rememberEventId = rememberEventId;
        window.getLastEventId = getLastEventId;
    }

})(window);
