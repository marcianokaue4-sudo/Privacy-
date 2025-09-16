/**
 * UTM Store Module - Sistema de Rastreamento e Persistência de UTMs
 * 
 * Este módulo captura, processa e persiste parâmetros UTM e de rastreamento
 * para uso com a integração UTMify e outros sistemas de analytics.
 * 
 * Funcionalidades:
 * - Captura UTMs da URL (utm_source, utm_medium, utm_campaign, utm_content, utm_term)
 * - Captura parâmetros adicionais (src, sck, fbclid)
 * - Gera fbc a partir de fbclid quando disponível
 * - Captura _fbp do cookie do Meta Pixel
 * - Normaliza e valida dados antes da persistência
 * - Persiste dados em localStorage e cookies com TTL de 90 dias
 * - Fornece fallbacks orgânicos quando não há UTMs
 * - Anexa UTMs preservados a URLs
 * - Detecta tráfego pago vs orgânico
 * - Constrói URLs limpas para links
 * 
 * @author Sistema de Tracking UTMify
 * @version 1.1.0
 */

(function(window) {
    'use strict';

    // Configurações do módulo
    const CONFIG = {
        STORAGE_KEY: 'stella_tracking',
        COOKIE_EXPIRY_DAYS: 90,
        FALLBACK_VALUES: {
            src: 'organic',
            utm_source: 'organic',
            utm_medium: 'none',
            utm_campaign: 'direct'
        }
    };

    // Parâmetros UTM padrão que devem ser capturados
    const UTM_PARAMS = [
        'utm_source',
        'utm_medium', 
        'utm_campaign',
        'utm_content',
        'utm_term'
    ];

    // Parâmetros adicionais de rastreamento
    const ADDITIONAL_PARAMS = [
        'src',
        'sck',
        'fbclid'
    ];

    /**
     * Extrai parâmetros da URL atual
     * @returns {Object} Objeto com todos os parâmetros encontrados
     */
    function extractUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};

        // Captura UTMs
        UTM_PARAMS.forEach(param => {
            const value = urlParams.get(param);
            if (value) {
                params[param] = value;
            }
        });

        // Captura parâmetros adicionais
        ADDITIONAL_PARAMS.forEach(param => {
            const value = urlParams.get(param);
            if (value) {
                params[param] = value;
            }
        });

        return params;
    }

    /**
     * Aplica valores de fallback para parâmetros não encontrados
     * @param {Object} params - Parâmetros já capturados
     * @returns {Object} Parâmetros com fallbacks aplicados
     */
    function applyFallbacks(params) {
        const result = { ...params };

        // Aplica fallbacks apenas se não houver UTMs válidos
        const hasValidUtms = UTM_PARAMS.some(param => params[param]);
        
        if (!hasValidUtms) {
            Object.assign(result, CONFIG.FALLBACK_VALUES);
        }

        return result;
    }

    /**
     * Verifica se o tráfego é pago
     * @param {Object} obj - Objeto de tracking
     * @returns {boolean} True se for tráfego pago
     */
    function isPaid(obj) {
        if (!obj) return false;
        
        // Verifica se src='paid'
        if (obj.src === 'paid') return true;
        
        // Verifica se há fbclid
        if (obj.fbclid) return true;
        
        // Verifica se há qualquer UTM preenchido (exceto fallbacks orgânicos)
        const hasValidUtms = UTM_PARAMS.some(param => {
            const value = obj[param];
            return value && value !== 'organic' && value !== 'none' && value !== 'direct';
        });
        
        return hasValidUtms;
    }

    /**
     * Normaliza e valida dados de tracking antes da persistência
     * @param {Object} obj - Dados de tracking brutos
     * @returns {Object} Dados normalizados e validados
     */
    function normalizeUtms(obj) {
        if (!obj) return {};
        
        const normalized = { ...obj };
        
        // 1. Forçar lowercase em utm_* e src
        UTM_PARAMS.forEach(param => {
            if (normalized[param]) {
                normalized[param] = normalized[param].toString().toLowerCase();
            }
        });
        
        if (normalized.src) {
            normalized.src = normalized.src.toString().toLowerCase();
        }
        
        // 2. Trocar espaços por - em utm_campaign, utm_content, utm_term
        const spaceToHyphen = ['utm_campaign', 'utm_content', 'utm_term'];
        spaceToHyphen.forEach(param => {
            if (normalized[param]) {
                normalized[param] = normalized[param].replace(/\s+/g, '-');
            }
        });
        
        // 3. Remover caracteres fora de [a-z0-9\-\._|] em utm_* e src
        const allowedChars = /[^a-z0-9\-\._|]/g;
        [...UTM_PARAMS, 'src'].forEach(param => {
            if (normalized[param]) {
                normalized[param] = normalized[param].replace(allowedChars, '');
            }
        });
        
        // 4. Se src ausente e houver fbclid → src='paid'
        if (!normalized.src && normalized.fbclid) {
            normalized.src = 'paid';
        }
        
        // 5. Se nenhum utm_* e nenhum fbclid → preencher fallback orgânico
        const hasValidUtms = UTM_PARAMS.some(param => normalized[param]);
        if (!hasValidUtms && !normalized.fbclid) {
            Object.assign(normalized, CONFIG.FALLBACK_VALUES);
        }
        
        // 6. Garantir que utm_source exista
        if (!normalized.utm_source) {
            if (normalized.src === 'paid') {
                normalized.utm_source = 'facebook'; // Padrão para tráfego pago
            } else {
                normalized.utm_source = 'organic';
            }
        }
        
        // Manter outros parâmetros não-UTM inalterados (fbclid, sck, fbp, fbc)
        ['fbclid', 'sck', 'fbp', 'fbc'].forEach(param => {
            if (obj[param]) {
                normalized[param] = obj[param];
            }
        });
        
        return normalized;
    }

    /**
     * Constrói URL limpa para /links com parâmetros normalizados
     * @returns {string} URL limpa para /links
     */
    function buildLinksUrl() {
        const trackingData = getTracking();
        
        if (isPaid(trackingData)) {
            // Para tráfego pago, incluir todos os UTMs + src
            const urlObj = new URL('/links', window.location.origin);
            
            // Adiciona UTMs
            UTM_PARAMS.forEach(param => {
                if (trackingData[param]) {
                    urlObj.searchParams.set(param, trackingData[param]);
                }
            });
            
            // Adiciona src
            if (trackingData.src) {
                urlObj.searchParams.set('src', trackingData.src);
            }
            
            // Adiciona fbclid se existir
            if (trackingData.fbclid) {
                urlObj.searchParams.set('fbclid', trackingData.fbclid);
            }
            
            return urlObj.toString();
        } else {
            // Para tráfego orgânico, retorna /links?src=organic
            return '/links?src=organic';
        }
    }

    /**
     * Captura o valor do cookie _fbp (Meta Pixel)
     * @returns {string|null} Valor do cookie _fbp ou null se não encontrado
     */
    function getFbpFromCookie() {
        const cookies = document.cookie.split(';');
        
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === '_fbp') {
                return decodeURIComponent(value);
            }
        }
        
        return null;
    }

    /**
     * Gera o parâmetro fbc a partir do fbclid
     * @param {string} fbclid - Valor do fbclid da URL
     * @returns {string} Valor fbc formatado
     */
    function generateFbc(fbclid) {
        if (!fbclid) return null;
        
        const timestamp = Math.floor(Date.now() / 1000);
        return `fb.1.${timestamp}.${fbclid}`;
    }

    /**
     * Salva dados no localStorage
     * @param {Object} data - Dados para salvar
     */
    function saveToLocalStorage(data) {
        try {
            const dataWithTimestamp = {
                ...data,
                _timestamp: Date.now()
            };
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(dataWithTimestamp));
        } catch (error) {
            console.warn('Erro ao salvar no localStorage:', error);
        }
    }

    /**
     * Salva dados em cookies
     * @param {Object} data - Dados para salvar
     */
    function saveToCookies(data) {
        try {
            const expires = new Date();
            expires.setDate(expires.getDate() + CONFIG.COOKIE_EXPIRY_DAYS);
            
            const cookieValue = encodeURIComponent(JSON.stringify(data));
            const cookieString = `${CONFIG.STORAGE_KEY}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
            
            document.cookie = cookieString;
        } catch (error) {
            console.warn('Erro ao salvar cookies:', error);
        }
    }

    /**
     * Carrega dados do localStorage
     * @returns {Object|null} Dados salvos ou null se não encontrados
     */
    function loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                
                // Verifica se os dados não expiraram (90 dias)
                const age = Date.now() - (data._timestamp || 0);
                const maxAge = CONFIG.COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
                
                if (age < maxAge) {
                    // Remove timestamp dos dados retornados
                    const { _timestamp, ...trackingData } = data;
                    return trackingData;
                }
            }
        } catch (error) {
            console.warn('Erro ao carregar do localStorage:', error);
        }
        
        return null;
    }

    /**
     * Carrega dados dos cookies
     * @returns {Object|null} Dados salvos ou null se não encontrados
     */
    function loadFromCookies() {
        try {
            const cookies = document.cookie.split(';');
            
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === CONFIG.STORAGE_KEY) {
                    return JSON.parse(decodeURIComponent(value));
                }
            }
        } catch (error) {
            console.warn('Erro ao carregar cookies:', error);
        }
        
        return null;
    }

    /**
     * Processa e persiste os dados de tracking
     * @returns {Object} Dados de tracking processados
     */
    function processAndStoreTracking() {
        // 1. Extrai parâmetros da URL
        let trackingData = extractUrlParams();
        
        // 2. Se não há parâmetros na URL, tenta carregar dados salvos
        if (Object.keys(trackingData).length === 0) {
            const storedData = loadFromLocalStorage() || loadFromCookies();
            if (storedData) {
                trackingData = storedData;
            }
        }
        
        // 3. Aplica fallbacks se necessário
        trackingData = applyFallbacks(trackingData);
        
        // 4. Captura _fbp do cookie
        const fbp = getFbpFromCookie();
        if (fbp) {
            trackingData.fbp = fbp;
        }
        
        // 5. Gera fbc se houver fbclid
        if (trackingData.fbclid) {
            trackingData.fbc = generateFbc(trackingData.fbclid);
        }
        
        // 6. NOVO: Normaliza dados antes de persistir
        trackingData = normalizeUtms(trackingData);
        
        // 7. Persiste os dados normalizados
        saveToLocalStorage(trackingData);
        saveToCookies(trackingData);
        
        return trackingData;
    }

    /**
     * Retorna os dados de tracking atuais
     * @returns {Object} Dados de tracking
     */
    function getTracking() {
        const stored = loadFromLocalStorage() || loadFromCookies();
        
        if (stored) {
            // Atualiza fbp se mudou
            const currentFbp = getFbpFromCookie();
            if (currentFbp && currentFbp !== stored.fbp) {
                stored.fbp = currentFbp;
                saveToLocalStorage(stored);
                saveToCookies(stored);
            }
            
            return stored;
        }
        
        // Se não há dados salvos, processa novamente
        return processAndStoreTracking();
    }

    /**
     * Anexa parâmetros UTM e src a uma URL
     * @param {string} url - URL de destino
     * @returns {string} URL com parâmetros anexados
     */
    function appendUtms(url) {
        try {
            const trackingData = getTracking();
            const urlObj = new URL(url, window.location.origin);
            
            // Lista de parâmetros para anexar (UTMs + src)
            const paramsToAppend = [...UTM_PARAMS, 'src'];
            
            paramsToAppend.forEach(param => {
                if (trackingData[param]) {
                    urlObj.searchParams.set(param, trackingData[param]);
                }
            });
            
            return urlObj.toString();
        } catch (error) {
            console.warn('Erro ao anexar UTMs à URL:', error);
            return url;
        }
    }

    /**
     * Console de diagnóstico para debug
     * @returns {Object} Informações de diagnóstico
     */
    function getDiagnostics() {
        const tracking = getTracking();
        const fbpCookie = getFbpFromCookie();
        const urlParams = extractUrlParams();
        
        // Verifica se os dados foram normalizados comparando com dados brutos
        const rawData = { ...urlParams };
        if (fbpCookie) rawData.fbp = fbpCookie;
        if (rawData.fbclid) rawData.fbc = generateFbc(rawData.fbclid);
        const normalizedData = normalizeUtms(rawData);
        const wasNormalized = JSON.stringify(rawData) !== JSON.stringify(normalizedData);
        
        const diagnostics = {
            current_url: window.location.href,
            url_params: urlParams,
            stored_tracking: tracking,
            fbp_cookie: fbpCookie,
            normalized: wasNormalized || Object.keys(urlParams).length === 0, // true se houve normalização ou se carregou dados salvos
            is_paid: isPaid(tracking),
            localStorage_available: typeof Storage !== 'undefined',
            cookies_enabled: navigator.cookieEnabled,
            sample_privacy_url: appendUtms('/privacy'),
            clean_links_url: buildLinksUrl(),
            timestamp: new Date().toISOString()
        };
        
        return diagnostics;
    }

    /**
     * Inicializa o sistema de tracking
     * Deve ser chamado no DOMContentLoaded
     */
    function initializeTracking() {
        try {
            // Processa e armazena os dados de tracking
            const trackingData = processAndStoreTracking();
            
            // Log para diagnóstico (apenas em desenvolvimento)
            if (window.location.hostname === 'localhost' || window.location.search.includes('debug=1')) {
                console.log('🎯 UTM Store inicializado:', trackingData);
                console.log('📊 Diagnósticos:', getDiagnostics());
            }
            
            return trackingData;
        } catch (error) {
            console.error('Erro ao inicializar tracking:', error);
            return CONFIG.FALLBACK_VALUES;
        }
    }

    // API pública do módulo
    const UTMStore = {
        // Funções principais
        getTracking,
        appendUtms,
        
        // Funções de inicialização
        initialize: initializeTracking,
        
        // Funções de diagnóstico
        getDiagnostics,
        
        // Novas funções públicas
        isPaid,
        buildLinksUrl,
        
        // Funções auxiliares (para debug)
        _extractUrlParams: extractUrlParams,
        _getFbpFromCookie: getFbpFromCookie,
        _generateFbc: generateFbc,
        _loadFromLocalStorage: loadFromLocalStorage,
        _loadFromCookies: loadFromCookies,
        _normalizeUtms: normalizeUtms
    };

    // Exporta o módulo
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js
        module.exports = UTMStore;
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(function() { return UTMStore; });
    } else {
        // Browser global
        window.UTMStore = UTMStore;
    }

    // Auto-inicialização se o DOM já estiver carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTracking);
    } else {
        // DOM já carregado, inicializa imediatamente
        setTimeout(initializeTracking, 0);
    }

})(window);
