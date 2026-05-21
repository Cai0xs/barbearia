document.addEventListener('DOMContentLoaded', () => {
    // Elementos das seções
    const sectionForm = document.getElementById('section-form');
    const sectionSuccess = document.getElementById('section-success');
    const sectionConsultar = document.getElementById('section-consultar');
    
    // Botões de Navegação do Topo
    document.getElementById('btn-navegar-agendar').addEventListener('click', () => {
        sectionForm.classList.remove('hidden');
        sectionConsultar.classList.add('hidden');
        sectionSuccess.classList.add('hidden');
    });
    document.getElementById('btn-navegar-consultar').addEventListener('click', () => {
        sectionConsultar.classList.remove('hidden');
        sectionForm.classList.add('hidden');
        sectionSuccess.classList.add('hidden');
    });

    // Elementos do Formulário
    const form = document.getElementById('form-agendamento');
    const inputData = document.getElementById('data_agendamento');
    const selectHora = document.getElementById('hora_agendamento');
    const successText = document.getElementById('success-text');

    // Lista de horários padrão da barbearia
    const horariosFuncionamento = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

    // Bloqueia datas passadas no calendário
    const hoje = new Date().toISOString().split('T')[0];
    inputData.min = hoje;

    // Quando o usuário escolhe uma data, buscamos os horários livres no backend
    inputData.addEventListener('change', async () => {
        const dataSelecionada = inputData.value;
        if (!dataSelecionada) return;

        selectHora.innerHTML = '<option value="" disabled selected>Carregando horários...</option>';

        try {
            const response = await fetch(`/api/agendamentos/ocupados?data=${dataSelecionada}`);
            const horariosOcupados = await response.json();

            selectHora.innerHTML = '<option value="" disabled selected>Selecione um horário...</option>';

            horariosFuncionamento.forEach(horario => {
                const option = document.createElement('option');
                option.value = horario;
                
                if (horariosOcupados.includes(horario)) {
                    option.textContent = `${horario} (Ocupado)`;
                    option.disabled = true;
                    option.style.color = '#ff6b6b';
                } else {
                    option.textContent = `${horario} (Disponível)`;
                }
                selectHora.appendChild(option);
            });

        } catch (error) {
            console.error("Erro ao carregar horários livres:", error);
            selectHora.innerHTML = '<option value="" disabled selected>Erro ao carregar horários</option>';
        }
    });

    // Enviar agendamento
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        
        const dadosAgendamento = {
            id_cliente: crypto.randomUUID(),
            nome_cliente: formData.get('nome_cliente'),
            telefone_cliente: formData.get('telefone_cliente'),
            email_cliente: formData.get('email_cliente'),
            data_agendamento: formData.get('data_agendamento'),
            hora_agendamento: formData.get('hora_agendamento'),
            servico_desejado: formData.get('servico_desejado')
        };

        if (!dadosAgendamento.nome_cliente || !dadosAgendamento.data_agendamento || !dadosAgendamento.hora_agendamento) {
            alert("Por favor, preencha todos os campos!");
            return;
        }

        try {
            const response = await fetch('/api/agendamentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAgendamento)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro no servidor.');
            }

            // Exibe mensagem personalizada de sucesso mostrando o dia e horário agendados!
            // Formatando a data de AAAA-MM-DD para DD/MM/AAAA na exibição
            const [ano, mes, dia] = dadosAgendamento.data_agendamento.split('-');
            successText.innerHTML = `Perfeito, <strong>${dadosAgendamento.nome_cliente}</strong>!<br>Seu horário para <strong>${dadosAgendamento.servico_desejado}</strong> foi marcado para o dia <strong>${dia}/${mes}/${ano}</strong> às <strong>${dadosAgendamento.hora_agendamento}</strong>.`;

            sectionForm.classList.add('hidden');
            sectionSuccess.classList.remove('hidden');
            form.reset();

        } catch (error) {
            alert(`Erro ao agendar: ${error.message}`);
        }
    });

    // Lógica da busca de agendamentos por E-mail
    const btnBuscar = document.getElementById('btn-buscar');
    const inputEmailBusca = document.getElementById('email-busca');
    const resultadoBusca = document.getElementById('resultado-busca');

    btnBuscar.addEventListener('click', async () => {
        const email = inputEmailBusca.value.trim();
        if (!email) {
            alert("Digite um e-mail para pesquisar.");
            return;
        }

        resultadoBusca.innerHTML = "<p>Buscando...</p>";

        try {
            const response = await fetch(`/api/agendamentos/busca?email=${email}`);
            const agendamentos = await response.json();

            if (agendamentos.length === 0) {
                resultadoBusca.innerHTML = "<p style='color: #ff6b6b;'>Nenhum agendamento encontrado para este e-mail.</p>";
                return;
            }

            let htmlResultados = "<h3>Seus horários marcados:</h3>";
            agendamentos.forEach(a => {
                const [ano, mes, dia] = a.data_agendamento.split('-');
                htmlResultados += `
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #d4af37;">
                        <p><strong>Serviço:</strong> ${a.servico_desejado}</p>
                        <p><strong>Data:</strong> ${dia}/${mes}/${ano} às <strong>${a.hora_agendamento}</strong></p>
                        <p style="font-size: 12px; color: #aaa;">Nome no cadastro: ${a.nome_cliente}</p>
                    </div>
                `;
            });

            resultadoBusca.innerHTML = htmlResultados;

        } catch (error) {
            console.error(error);
            resultadoBusca.innerHTML = "<p>Erro ao realizar busca.</p>";
        }
    });

    document.getElementById('btn-novo-agendamento').addEventListener('click', () => {
        sectionSuccess.classList.add('hidden');
        sectionForm.classList.remove('hidden');
    });
});