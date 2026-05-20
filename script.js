document.addEventListener('DOMContentLoaded', () => {
    // Captura de Elementos DOM do formulário e seções SPA
    const form = document.getElementById('form-agendamento');
    const inputTelefone = document.getElementById('telefone_cliente');
    const feedbackMessage = document.getElementById('feedback-message');
    const sectionForm = document.getElementById('section-form');
    const sectionSuccess = document.getElementById('section-success');
    const btnNovoAgendamento = document.getElementById('btn-novo-agendamento');

    // Bloqueia agendamentos em dias passados configurando a data mínima como hoje
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('data_agendamento').setAttribute('min', hoje);

    // Máscara em tempo real para o campo de telefone: (XX) XXXXX-XXXX
    inputTelefone.addEventListener('input', (e) => {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });

    // Evento de Envio do Formulário
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Retém comportamento SPA impedindo refresh
        
        clearFeedbacks();
        const isFormValid = validateForm();

        if (isFormValid) {
            // Objeto estruturado mapeando os campos exigidos nos requisitos
            const formData = {
                id_cliente: crypto.randomUUID(), // UUID gerado dinamicamente para chave primária
                nome_cliente: document.getElementById('nome_cliente').value.trim(),
                telefone_cliente: inputTelefone.value.trim(),
                email_cliente: document.getElementById('email_cliente').value.trim(),
                data_agendamento: document.getElementById('data_agendamento').value,
                hora_agendamento: document.getElementById('hora_agendamento').value,
                servico_desejado: document.getElementById('servico_desejado').value
            };

            // Dispara requisição assíncrona para persistência
            await sendDataToBackend(formData);
        }
    });

    // Reseta o estado da SPA para permitir que outro agendamento seja feito
    btnNovoAgendamento.addEventListener('click', () => {
        form.reset();
        sectionSuccess.classList.add('hidden');
        sectionForm.classList.remove('hidden');
    });

    // Função de Validação Manual (Puro Javascript)
    function validateForm() {
        let isValid = true;

        // Validar Nome Completo
        const nome = document.getElementById('nome_cliente');
        if (nome.value.trim().length < 3) { setErrorFor(nome); isValid = false; }

        // Validar Telefone (Verifica se contém os dígitos necessários após a limpeza da máscara)
        const telLimpo = inputTelefone.value.replace(/\D/g, ''); 
        if (telLimpo.length < 10 || telLimpo.length > 11) { setErrorFor(inputTelefone); isValid = false; }

        // Validar E-mail usando Expressão Regular
        const email = document.getElementById('email_cliente');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value.trim())) { setErrorFor(email); isValid = false; }

        // Validar Data
        const data = document.getElementById('data_agendamento');
        if (!data.value) { setErrorFor(data); isValid = false; }

        // Validar Horário
        const hora = document.getElementById('hora_agendamento');
        if (!hora.value) { setErrorFor(hora); isValid = false; }

        // Validar Serviço Desejado
        const servico = document.getElementById('servico_desejado');
        if (!servico.value) { setErrorFor(servico); isValid = false; }

        return isValid;
    }

    function setErrorFor(input) {
        input.parentElement.classList.add('invalid');
    }

    function clearFeedbacks() {
        feedbackMessage.className = 'feedback hidden';
        feedbackMessage.textContent = '';
        document.querySelectorAll('.form-group').forEach(group => group.classList.remove('invalid'));
    }

    // Comunicação AJAX com a API Backend Node.js
    async function sendDataToBackend(data) {
        try {
            // Rota local padrão do servidor Node.js/Express
            const urlBackend = 'http://localhost:3000/api/agendamentos'; 

            /* 
            // ==========================================================
            // CÓDIGO DO INTEGRADO (Descomente quando ligar seu Node.js)
            // ==========================================================
            const response = await fetch(urlBackend, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Falha no processamento interno do servidor.');
            */

            // Log de depuração do JSON gerado
            console.log("JSON enviado com sucesso para o banco de dados:", data);
            
            // Chaveamento visual da SPA: esconde form e exibe a animação do V de sucesso
            sectionForm.classList.add('hidden');
            sectionSuccess.classList.remove('hidden');

        } catch (error) {
            console.error("Falha ao persistir dados via API:", error);
            feedbackMessage.textContent = 'Erro de comunicação: Não foi possível salvar o agendamento no servidor.';
            feedbackMessage.className = 'feedback error';
        }
    }
});