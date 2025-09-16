/**
 * Webhook Handler para PushinPay
 * Gerencia os webhooks recebidos da API PushinPay
 */

const express = require('express');

class PushinPayWebhookHandler {
    constructor() {
        console.log('🔔 PushinPay Webhook Handler inicializado');
    }

    /**
     * Processar webhook da PushinPay
     * Conforme documentação: webhook é enviado quando status é alterado
     */
    handleWebhook(req, res) {
        try {
            console.log('🔔 Webhook PushinPay recebido');
            console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
            console.log('📦 Body:', JSON.stringify(req.body, null, 2));

            const webhookData = req.body;

            // Validar estrutura do webhook
            if (!webhookData || !webhookData.id) {
                console.error('❌ Webhook inválido - sem ID da transação');
                return res.status(400).json({ 
                    error: 'Webhook inválido',
                    message: 'ID da transação não encontrado'
                });
            }

            // Processar webhook baseado no status
            this.processWebhookByStatus(webhookData);

            // Confirmar recebimento (importante para evitar reenvios)
            res.status(200).json({ 
                success: true,
                message: 'Webhook processado com sucesso',
                transaction_id: webhookData.id
            });

        } catch (error) {
            console.error('❌ Erro ao processar webhook PushinPay:', error.message);
            res.status(500).json({ 
                error: 'Erro interno',
                message: 'Falha ao processar webhook'
            });
        }
    }

    /**
     * Processar webhook baseado no status da transação
     */
    processWebhookByStatus(webhookData) {
        const { id, status, value, payer_name, payer_national_registration, end_to_end_id } = webhookData;

        console.log(`📊 Processando webhook para transação ${id} com status: ${status}`);

        switch (status) {
            case 'created':
                this.handleCreatedStatus(webhookData);
                break;
            
            case 'paid':
                this.handlePaidStatus(webhookData);
                break;
            
            case 'expired':
                this.handleExpiredStatus(webhookData);
                break;
            
            default:
                console.warn(`⚠️ Status desconhecido recebido: ${status}`);
                this.handleUnknownStatus(webhookData);
        }
    }

    /**
     * Processar status 'created'
     */
    async handleCreatedStatus(webhookData) {
        console.log('✅ PIX criado:', {
            id: webhookData.id,
            value: webhookData.value,
            qr_code: webhookData.qr_code ? 'Presente' : 'Ausente'
        });


        // Aqui você pode:
        // - Atualizar banco de dados local
        // - Notificar o usuário que o PIX foi criado
        // - Enviar email/SMS com QR Code
        // - Log para auditoria
    }

    /**
     * Processar status 'paid'
     */
    async handlePaidStatus(webhookData) {
        console.log('💰 PIX pago:', {
            id: webhookData.id,
            value: webhookData.value,
            payer_name: webhookData.payer_name,
            payer_document: webhookData.payer_national_registration,
            end_to_end_id: webhookData.end_to_end_id
        });


        // Aqui você pode:
        // - Confirmar pagamento no sistema
        // - Liberar produto/serviço
        // - Enviar confirmação ao cliente
        // - Processar split_rules se houver
        // - Atualizar estoque
        // - Enviar nota fiscal
    }

    /**
     * Processar status 'expired'
     */
    handleExpiredStatus(webhookData) {
        console.log('⏰ PIX expirado:', {
            id: webhookData.id,
            value: webhookData.value
        });

        // Aqui você pode:
        // - Marcar transação como expirada
        // - Notificar cliente sobre expiração
        // - Liberar estoque reservado
        // - Log para relatórios
    }

    /**
     * Processar status desconhecido
     */
    handleUnknownStatus(webhookData) {
        console.log('❓ Status desconhecido:', {
            id: webhookData.id,
            status: webhookData.status,
            data: webhookData
        });

        // Log para investigação
    }

    /**
     * Middleware para validar webhook (opcional)
     * A PushinPay permite headers customizados para autenticação
     */
    validateWebhook(req, res, next) {
        // Implementar validação se necessário
        // Exemplo: verificar header customizado configurado no painel PushinPay
        
        const customHeader = req.headers['x-pushinpay-signature'];
        if (customHeader) {
            // Validar assinatura customizada
            console.log('🔐 Header customizado detectado:', customHeader);
        }

        next();
    }

    /**
     * Configurar rotas do webhook
     */
    setupRoutes(app) {
        // Rota principal do webhook
        app.post('/webhook/pushinpay', 
            this.validateWebhook.bind(this),
            this.handleWebhook.bind(this)
        );

        console.log('🛣️ Rota do webhook PushinPay configurada: POST /webhook/pushinpay');
    }

    /**
     * Testar webhook com dados simulados
     */
    testWebhook() {
        console.log('🧪 Testando webhook PushinPay com dados simulados');

        const mockWebhookData = {
            id: "9c29870c-9f69-4bb6-90d3-2dce9453bb45",
            qr_code: "00020101021226770014BR.GOV.BCB.PIX2555api...",
            status: "paid",
            value: 1000,
            webhook_url: "http://localhost:3000/webhook/pushinpay",
            qr_code_base64: "data:image/png;base64,iVBORw0KGgoAA.....",
            webhook: null,
            split_rules: [],
            end_to_end_id: "E12345678202412071234567890123456",
            payer_name: "João da Silva",
            payer_national_registration: "12345678901"
        };

        this.processWebhookByStatus(mockWebhookData);
    }
}

module.exports = PushinPayWebhookHandler;