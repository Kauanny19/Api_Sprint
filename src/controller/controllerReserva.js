// Importações necessárias
const connect = require("../db/connect"); // Conexão com o banco de dados
const validateReserva = require("../services/validateReserva"); // Valida os dados da reserva
const validateHorario = require("../services/validateHorario"); // Verifica se há conflito de horário
const validateId = require("../services/validateId"); // Verifica se IDs de usuário e sala existem
const listarReservasPorUsuario = require("../services/listarReservasPorUsuario");

// Função auxiliar para usar Promises com consultas SQL
const queryAsync = (query, values) => {
  return new Promise((resolve, reject) => {
    connect.query(query, values, (err, results) => {
      if (err) reject(err); // Em caso de erro, rejeita a Promise
      else resolve(results); // Caso contrário, resolve com os resultados
    });
  });
};

// Define a classe de controle de reservas
module.exports = class ControllerReserva {
  // Método para criar uma nova reserva
  static async createReserva(req, res) {
    const { id_usuario, fk_id_sala, data, horarioInicio, horarioFim } =
      req.body;

    // Valida os dados da reserva
    const validation = validateReserva({
      fk_id_usuario: id_usuario,
      fk_id_sala,
      data,
      horarioInicio,
      horarioFim,
    });

    if (validation) {
      return res.status(400).json(validation); // Retorna erro de validação, se houver
    }

    try {
      // Verifica se os IDs de usuário e sala existem
      const idValidation = await validateId(id_usuario, fk_id_sala);
      if (idValidation) {
        return res.status(400).json(idValidation);
      }

      // Verifica se o horário já está ocupado
      const conflito = await validateHorario(
        fk_id_sala,
        data,
        horarioInicio,
        horarioFim
      );
      if (conflito) {
        return res.status(400).json(conflito);
      }

      // Insere a reserva no banco de dados
      const query = `
        INSERT INTO reserva (fk_id_usuario, fk_id_sala, data, horarioInicio, horarioFim)
        VALUES (?, ?, ?, ?, ?)
      `;
      const values = [id_usuario, fk_id_sala, data, horarioInicio, horarioFim];

      const result = await queryAsync(query, values);

      // Retorna sucesso com o ID da reserva criada
      return res.status(201).json({
        message: "Reserva criada com sucesso",
        id_reserva: result.insertId,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao criar reserva" }); // Erro interno
    }
  }

  // Método para buscar todas as reservas
  static async getReservas(req, res) {
    // Consulta todas as reservas com nome do usuário e número da sala
    const query = `
      SELECT r.id_reserva, r.fk_id_usuario, r.fk_id_sala, r.data, r.horarioInicio, r.horarioFim, 
      u.nome AS nomeUsuario, s.numero AS salaNome
      FROM reserva r
      INNER JOIN usuario u ON r.fk_id_usuario = u.id_usuario
      INNER JOIN sala s ON r.fk_id_sala = s.id_sala
    `;

    try {
      const results = await queryAsync(query);

      // Formata as datas e horários para exibição
      const reservasFormatadas = results.map((reserva) =>
        reservaFormat(reserva)
      );

      return res
        .status(200)
        .json({ message: "Lista de Reservas", reservas: reservasFormatadas });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Método para atualizar uma reserva existente
  static async updateReserva(req, res) {
    const { fk_id_usuario, fk_id_sala, data, horarioInicio, horarioFim } =
      req.body;
    const reservaId = req.params.id;

    // Valida os dados da atualização
    const validationError = validateReserva({
      fk_id_usuario,
      fk_id_sala,
      data,
      horarioInicio,
      horarioFim,
    });

    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      // Verifica se a reserva existe e obtém a sala vinculada
      const querySala = `SELECT fk_id_sala FROM reserva WHERE id_reserva = ?`;
      const resultadosSala = await queryAsync(querySala, [reservaId]);

      if (resultadosSala.length === 0) {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }

      const { fk_id_sala } = resultadosSala[0];

      // Verifica se há conflitos de horário com outras reservas
      const queryHorario = `
        SELECT horarioInicio, horarioFim 
        FROM reserva 
        WHERE fk_id_sala = ? AND id_reserva != ? AND data = ? AND (
          (horarioInicio < ? AND horarioFim > ?) OR
          (horarioInicio < ? AND horarioFim > ?) OR
          (horarioInicio >= ? AND horarioInicio < ?) OR
          (horarioFim > ? AND horarioFim <= ?)
        )
      `;
      const conflitos = await queryAsync(queryHorario, [
        fk_id_sala,
        reservaId,
        data,
        horarioInicio,
        horarioInicio,
        horarioInicio,
        horarioFim,
        horarioInicio,
        horarioFim,
        horarioInicio,
        horarioFim,
      ]);

      if (conflitos.length > 0) {
        return res
          .status(400)
          .json({ error: "A sala já está reservada neste horário." });
      }

      // Atualiza a reserva no banco de dados
      const queryUpdate = `
        UPDATE reserva 
        SET data = ?, horarioInicio = ?, horarioFim = ?
        WHERE id_reserva = ?
      `;
      await queryAsync(queryUpdate, [
        data,
        horarioInicio,
        horarioFim,
        reservaId,
      ]);

      return res
        .status(200)
        .json({ message: "Reserva atualizada com sucesso!" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao atualizar reserva" });
    }
  }

  // Método para excluir uma reserva
  static async deleteReserva(req, res) {
    const reservaId = req.params.id_reserva;
    const query = `DELETE FROM reserva WHERE id_reserva = ?`;

    try {
      const results = await queryAsync(query, [reservaId]);

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }

      return res.status(200).json({ message: "Reserva excluída com sucesso" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
  }

  static async getHorariosSala(req, res) {
    // Extrai os parâmetros 'id_sala' e 'data'
    const { id_sala, data } = req.params;
    console.log(id_sala, data);
    // Verifica se ambos os parâmetros obrigatórios foram fornecidos
    if (!id_sala || !data) {
      // Se não, retorna erro 400 (requisição inválida)
      return res
        .status(400)
        .json({ error: "Parâmetros 'id_sala' e 'data' são obrigatórios." });
    }

    try {
      // Monta a query para buscar os horários já reservados para a sala e data informadas
      const query = `
      SELECT horarioInicio, horarioFim
      FROM reserva
      WHERE fk_id_sala = ? AND data = ?
    `;

      // Executa a query de forma assíncrona com os parâmetros fornecidos
      const reservas = await queryAsync(query, [id_sala, data]);

      // Transforma os horários reservados para o formato HH:MM (ex: 13:00)
      const indisponiveis = reservas.map((r) => ({
        inicio: r.horarioInicio.toString().slice(0, 5), // Pega os primeiros 5 caracteres do horário de início
        fim: r.horarioFim.toString().slice(0, 5), // Pega os primeiros 5 caracteres do horário de fim
      }));

      // Define o horário de funcionamento da sala (das 07h às 23h)
      const horarioAbertura = 7;
      const horarioFechamento = 23;
      const intervaloHoras = 1;
      let disponiveis = [];

      // Gera os horários possíveis dentro do expediente
      for (
        let h = horarioAbertura;
        h < horarioFechamento;
        h += intervaloHoras
      ) {
        // Formata o horário de início no formato HH:00
        const horaInicio = `${h.toString().padStart(2, "0")}:00`;

        // Formata o horário de fim como HH+1:00
        const horaFim = `${(h + intervaloHoras)
          .toString()
          .padStart(2, "0")}:00`;

        // Verifica se o intervalo gerado conflita com algum horário indisponível
        const conflita = indisponiveis.some(
          (b) => !(horaFim <= b.inicio || horaInicio >= b.fim)
        );
        // A lógica acima verifica se há interseção com algum horário reservado

        // Se não houver conflito, adiciona o intervalo como disponível
        if (!conflita) {
          disponiveis.push({ inicio: horaInicio, fim: horaFim });
        }
      }

      // Retorna uma resposta com os horários disponíveis e indisponíveis
      return res.status(200).json({
        sala: id_sala, // ID da sala
        data, // Data da consulta
        horariosIndisponiveis: indisponiveis, // Lista de horários já reservados
        horariosDisponiveis: disponiveis, // Lista de horários ainda livres
      });
    } catch (error) {
      // Em caso de erro na execução do try, exibe no console e retorna erro 500
      console.error(error);
      return res.status(500).json({ error: "Erro ao obter horários da sala." });
    }
  }

  // Dentro da classe ControllerReserva
  static async getReservasPorUsuario(req, res) {
    const { id_usuario } = req.params;

    if (!id_usuario) {
      return res.status(400).json({ error: "ID do usuário é obrigatório." });
    }

    try {
      const reservas = await listarReservasPorUsuario(id_usuario);

      // Formata as datas e horários para exibição, se necessário
      const reservasFormatadas = reservas.map((reserva) =>
        reservaFormat(reserva)
      );

      return res.status(200).json({
        message: `Reservas do usuário ${id_usuario}`,
        reservas: reservasFormatadas,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Erro ao buscar reservas do usuário." });
    }
  }
};

// Função auxiliar que formata os campos de data e horário de uma reserva
function reservaFormat(reserva) {
  // Se o campo 'data' for do tipo Date, converte para o formato YYYY-MM-DD
  if (reserva.data instanceof Date) {
    reserva.data = reserva.data.toISOString().split("T")[0]; // Pega apenas a parte da data
  }

  // Se o campo 'horarioInicio' for Date, extrai apenas o horário no formato HH:MM:SS
  if (reserva.horarioInicio instanceof Date) {
    reserva.horarioInicio = reserva.horarioInicio
      .toISOString()
      .split("T")[1]
      .split(".")[0];
  }

  // Mesmo processo para 'horarioFim'
  if (reserva.horarioFim instanceof Date) {
    reserva.horarioFim = reserva.horarioFim
      .toISOString()
      .split("T")[1]
      .split(".")[0];
  }

  // Retorna o objeto reserva com os campos formatados
  return reserva;
}
