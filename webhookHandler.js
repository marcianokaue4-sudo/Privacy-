/**
 * Webhook Handler para SyncPayments
 * Gerencia os webhooks recebidos da API SyncPayments
 */

const express = require('express');
const crypto = require('crypto');
const { getConfig } = require('./loadConfig');

class WebhookHandler {
    constructor() {
        const cfg = getConfig();
        this.webhookSecret = cfg.webhook?.secret || 'default_secret';
    }

    /**
     * Middleware para verificar assinatura do webhook
     */
    verifySignature(req, res, next) {
        const signature = req.headers['x-syncpay-signature'];
        const payload = JSON.stringify(req.body);
        
        if (!signature) {
            console.warn('⚠️ Webhook sem assinatura recebido');
            return res.status(401).json({ error: 'Assinatura não fornecida' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.warn('⚠️ Assinatura de webhook inválida');
            return res.status(401).json({ error: 'Assinatura inválida' });
        }

        console.log('✅ Assinatura de webhook válida');
        next();
    }

    /**
     * Processar webhook de criação de cash-in
     */
    handleCashInCreate(req, res) {
        try {
            const { data } = req.body;
            const event = req.headers['event'] || 'cashin.create';

            console.log('🔔 Webhook Cash-In Create recebido:', {
                event,
                transactionId: data.id,
                amount: data.amount,
                status: data.status,
                client: data.client.name
            });

            // Aqui você pode implementar sua lógica de negócio
            // Por exemplo: atualizar banco de dados, enviar notificação, etc.
            
            this.processCashInEvent(data, event);

            res.status(200).json({ received: true });
        } catch (error) {
            console.error('❌ Erro ao processar webhook cash-in create:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Processar webhook de atualização de cash-in
     */
    handleCashInUpdate(req, res) {
        try {
            const { data } = req.body;
            const event = req.headers['event'] || 'cashin.update';

            console.log('🔔 Webhook Cash-In Update recebido:', {
                event,
                transactionId: data.id,
                amount: data.amount,
                status: data.status,
                client: data.client.name
            });

            // Aqui você pode implementar sua lógica de negócio
            this.processCashInEvent(data, event);

            res.status(200).json({ received: true });
        } catch (error) {
            console.error('❌ Erro ao processar webhook cash-in update:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Processar webhook de criação de cash-out
     */
    handleCashOutCreate(req, res) {
        try {
            const { data } = req.body;
            const event = req.headers['event'] || 'cashout.create';

            console.log('🔔 Webhook Cash-Out Create recebido:', {
                event,
                transactionId: data.id,
                amount: data.amount,
                status: data.status,
                pixKey: data.pix_key
            });

            // Aqui você pode implementar sua lógica de negócio
            this.processCashOutEvent(data, event);

            res.status(200).json({ received: true });
        } catch (error) {
            console.error('❌ Erro ao processar webhook cash-out create:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Processar webhook de atualização de cash-out
     */
    handleCashOutUpdate(req, res) {
        try {
            const { data } = req.body;
            const event = req.headers['event'] || 'cashout.update';

            console.log('🔔 Webhook Cash-Out Update recebido:', {
                event,
                transactionId: data.id,
                amount: data.amount,
                status: data.status,
                pixKey: data.pix_key
            });

            // Aqui você pode implementar sua lógica de negócio
            this.processCashOutEvent(data, event);

            res.status(200).json({ received: true });
        } catch (error) {
            console.error('❌ Erro ao processar webhook cash-out update:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Processar eventos de cash-in
     */
    processCashInEvent(data, event) {
        console.log(`🔄 Processando evento ${event} para cash-in ${data.id}`);

        switch (data.status) {
            case 'pending':
                console.log('⏳ Transação pendente - aguardando pagamento');
                // Implementar lógica para transação pendente
                break;
            
            case 'completed':
                console.log('✅ Transação completada - pagamento confirmado');
                // Implementar lógica para transação completada
                // Ex: liberar produto, enviar confirmação, etc.
                
                break;
            
            case 'failed':
                console.log('❌ Transação falhou - pagamento não realizado');
                // Implementar lógica para transação falhada
                break;
            
            case 'refunded':
                console.log('↩️ Transação estornada - reembolso realizado');
                // Implementar lógica para transação estornada
                break;
            
            case 'med':
                console.log('⚠️ Transação em análise - MED');
                // Implementar lógica para transação em análise
                break;
            
            default:
                console.log(`❓ Status desconhecido: ${data.status}`);
        }
    }

    /**
     * Processar eventos de cash-out
     */
    processCashOutEvent(data, event) {
        console.log(`🔄 Processando evento ${event} para cash-out ${data.id}`);

        switch (data.status) {
            case 'pending':
                console.log('⏳ Saque pendente - aguardando processamento');
                // Implementar lógica para saque pendente
                break;
            
            case 'completed':
                console.log('✅ Saque completado - transferência realizada');
                // Implementar lógica para saque completado
                break;
            
            case 'failed':
                console.log('❌ Saque falhou - transferência não realizada');
                // Implementar lógica para saque falhado
                break;
            
            case 'refunded':
                console.log('↩️ Saque estornado - reembolso realizado');
                // Implementar lógica para saque estornado
                break;
            
            case 'med':
                console.log('⚠️ Saque em análise - MED');
                // Implementar lógica para saque em análise
                break;
            
            default:
                console.log(`❓ Status desconhecido: ${data.status}`);
        }
    }

    /**
     * Configurar rotas de webhook
     */
    setupRoutes(app) {
        // Middleware para verificar assinatura em todas as rotas de webhook
        app.use('/webhooks/syncpay', this.verifySignature.bind(this));

        // Rotas de webhook
        app.post('/webhooks/syncpay/cashin/create', this.handleCashInCreate.bind(this));
        app.post('/webhooks/syncpay/cashin/update', this.handleCashInUpdate.bind(this));
        app.post('/webhooks/syncpay/cashout/create', this.handleCashOutCreate.bind(this));
        app.post('/webhooks/syncpay/cashout/update', this.handleCashOutUpdate.bind(this));

        // Rota genérica para todos os webhooks (legacy)
        app.post('/webhooks/syncpay', (req, res) => {
            const event = req.headers['event'];
            
            if (event === 'cashin.create') {
                this.handleCashInCreate(req, res);
            } else if (event === 'cashin.update') {
                this.handleCashInUpdate(req, res);
            } else if (event === 'cashout.create') {
                this.handleCashOutCreate(req, res);
            } else if (event === 'cashout.update') {
                this.handleCashOutUpdate(req, res);
            } else {
                console.log('🔔 Webhook genérico recebido:', event);
                res.status(200).json({ received: true });
            }
        });

        console.log('🔗 Rotas de webhook configuradas:');
        console.log('  - POST /webhooks/syncpay/cashin/create');
        console.log('  - POST /webhooks/syncpay/cashin/update');
        console.log('  - POST /webhooks/syncpay/cashout/create');
        console.log('  - POST /webhooks/syncpay/cashout/update');
        console.log('  - POST /webhooks/syncpay (genérico)');
    }

}

module.exports = WebhookHandler;
