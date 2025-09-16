(function($){
    // Função para capturar IP do cliente
    function getClientIP() {
        // Tentar capturar IP de diferentes fontes
        const ipSources = [
            // Headers de proxy comuns
            'x-forwarded-for',
            'x-real-ip',
            'x-client-ip',
            'cf-connecting-ip', // Cloudflare
            'x-cluster-client-ip'
        ];
        
        // Para ambiente de desenvolvimento, usar IP local
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return '127.0.0.1';
        }
        
        // Tentar capturar via WebRTC (método alternativo)
        return new Promise((resolve) => {
            const pc = new RTCPeerConnection({iceServers: []});
            pc.createDataChannel('');
            pc.createOffer().then(offer => pc.setLocalDescription(offer));
            pc.onicecandidate = (ice) => {
                if (ice && ice.candidate && ice.candidate.candidate) {
                    const ip = ice.candidate.candidate.split(' ')[4];
                    if (ip && ip !== '0.0.0.0') {
                        resolve(ip);
                    }
                }
            };
            
            // Timeout após 2 segundos
            setTimeout(() => resolve('127.0.0.1'), 2000);
        });
    }

    function attachPlanHandler(buttonId, planKey){
        $(buttonId).on('click', async function(){
            // Verificar se a integração universal está disponível
            if (!window.syncPay && !window.universalPayment) {
                alert('Serviço de pagamento indisponível.');
                return;
            }

            const plans = window.SYNCPAY_CONFIG && window.SYNCPAY_CONFIG.plans;
            const plan = plans && plans[planKey];
            if (!plan) {
                alert('Plano não encontrado.');
                return;
            }

            try {
                // Definir o plano atual para redirecionamento
                window.currentPaymentPlan = planKey;
                
                // Usar a integração universal que detecta o gateway automaticamente
                const paymentService = window.universalPayment || window.syncPay;
                
                // Mostrar loading com informação do gateway atual
                if (paymentService.showLoading) {
                    paymentService.showLoading();
                }
                
                // Dados do cliente padrão (pode ser expandido para coletar dados reais)
                const clientData = {
                    name: 'Cliente',
                    cpf: '12345678901',
                    email: 'cliente@exemplo.com',
                    phone: '11999999999'
                };
                
                const transaction = await paymentService.createPixTransaction(plan.price, plan.description, clientData);
                $(this).data('pixTransaction', transaction);
                
                // Adicionar parâmetros na URL para controle
                const currentUrl = new URL(window.location);
                currentUrl.searchParams.set('checkout_initiated', 'true');
                currentUrl.searchParams.set('plan', planKey);
                currentUrl.searchParams.set('amount', plan.price);
                window.history.replaceState({}, '', currentUrl.toString());
                
                
                // Mostrar modal com o PIX gerado
                if (paymentService.showPixModal && transaction.pix_code) {
                    paymentService.showPixModal(transaction);
                } else {
                    alert(`PIX gerado com sucesso via ${transaction.gateway?.toUpperCase() || 'Gateway'}!`);
                }
                
            } catch (err) {
                console.error('Erro ao gerar PIX:', err);
                alert(`Erro ao gerar PIX: ${err.message}`);
            } finally {
                // Fechar loading
                if (typeof swal !== 'undefined') {
                    try {
                        swal.close();
                    } catch (error) {
                        console.warn('Erro ao fechar SweetAlert:', error);
                    }
                } else {
                    $('#nativeLoading').remove();
                }
            }
        });
    }

    $(function(){
        // Aguardar um pouco para garantir que as integrações estejam carregadas
        setTimeout(() => {
            attachPlanHandler('#btn-1-mes', 'monthly');
            attachPlanHandler('#btn-3-meses', 'quarterly');
            attachPlanHandler('#btn-6-meses', 'semestrial');
            console.log('🔧 Handlers dos botões PIX configurados com integração universal');
        }, 100);
    });
})(jQuery);
