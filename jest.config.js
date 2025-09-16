/**
 * Configuração Jest para testes E2E
 * 
 * Suporta ES6 modules e mocking da Meta CAPI
 */

export default {
    // Ambiente de teste
    testEnvironment: 'node',
    
    // Suporte a ES6 modules
    extensionsToTreatAsEsm: ['.js'],
    
    // Transform configuration
    transform: {},
    
    // Module name mapping para resolver imports relativos
    moduleNameMapping: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    
    // Configuração global para ES modules
    globals: {
        'jest': {
            useESM: true
        }
    },
    
    // Padrão de arquivos de teste
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],
    
    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    
    // Timeout para testes assíncronos
    testTimeout: 10000,
    
    // Executar testes em série (importante para testes E2E)
    maxWorkers: 1,
    
    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js', // Excluir arquivo principal
        '!**/node_modules/**',
        '!**/tests/**'
    ],
    
    coverageDirectory: 'coverage',
    
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],
    
    // Verbose output
    verbose: true,
    
    // Detectar handles abertos
    detectOpenHandles: true,
    
    // Forçar saída após testes
    forceExit: true
};
