const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
});

const Agendamento = sequelize.define('Agendamento', {
    id_cliente: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    nome_cliente: { type: DataTypes.STRING, allowNull: false },
    telefone_cliente: { type: DataTypes.STRING, allowNull: false },
    email_cliente: { type: DataTypes.STRING, allowNull: false },
    data_agendamento: { type: DataTypes.DATEONLY, allowNull: false },
    hora_agendamento: { type: DataTypes.STRING, allowNull: false },
    servico_desejado: { type: DataTypes.STRING, allowNull: false }
});

sequelize.sync()
    .then(() => console.log('-> Banco de dados SQLite sincronizado com sucesso.'))
    .catch(err => console.error('Erro ao sincronizar o banco:', err));

// Rota 1: Salvar novo agendamento
app.post('/api/agendamentos', async (req, res) => {
    try {
        // Validação extra: impede agendar o mesmo dia e horário duas vezes
        const ocupado = await Agendamento.findOne({
            where: {
                data_agendamento: req.body.data_agendamento,
                hora_agendamento: req.body.hora_agendamento
            }
        });

        if (ocupado) {
            return res.status(400).json({ error: 'Este horário já foi preenchido por outro cliente!' });
        }

        const novoAgendamento = await Agendamento.create(req.body);
        return res.status(201).json({ message: 'Salvo com sucesso!', data: novoAgendamento });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro interno ao salvar.' });
    }
});

// Rota 2: Retorna os horários já OCUPADOS de uma determinada data
app.get('/api/agendamentos/ocupados', async (req, res) => {
    try {
        const { data } = req.query;
        const agendamentos = await Agendamento.findAll({
            where: { data_agendamento: data },
            attributes: ['hora_agendamento']
        });
        const horariosOcupados = agendamentos.map(a => a.hora_agendamento);
        return res.json(horariosOcupados);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar horários.' });
    }
});

// Rota 3: Busca todos os agendamentos feitos por um e-mail específico
app.get('/api/agendamentos/busca', async (req, res) => {
    try {
        const { email } = req.query;
        const meusAgendamentos = await Agendamento.findAll({
            where: { email_cliente: email },
            order: [['data_agendamento', 'ASC'], ['hora_agendamento', 'ASC']]
        });
        return res.json(meusAgendamentos);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar seus dados.' });
    }
});

app.listen(PORT, () => {
    console.log(`-> Servidor rodando em: http://localhost:${PORT}`);
});