const connect = require("../db/connect");
const validateReserva = require("../services/validateReserva");
const validateHorario = require("../services/validateHorario");
const validateId = require("../services/validateId");

// Função para facilitar a execução de queries assíncronas
const queryAsync = (query, values) => {
  return new Promise((resolve, reject) => {
    connect.query(query, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

module.exports = class ControllerReserva {
  static async createReserva(req, res) {
    const { id_usuario, fk_id_sala, data, horarioInicio, horarioFim } = req.body;

    // Validar os dados recebidos
    const validation = validateReserva({
      fk_id_usuario: id_usuario,
      fk_id_sala,
      data,
      horarioInicio,
      horarioFim
    });

    if (validation) {
      return res.status(400).json(validation);
    }

    try {
      // Validar IDs de usuário e sala
      const idValidation = await validateId(id_usuario, fk_id_sala);
      if (idValidation) {
        return res.status(400).json(idValidation);
      }

      // Verificar conflito de horário
      const conflito = await validateHorario(fk_id_sala, data, horarioInicio, horarioFim);
      if (conflito) {
        return res.status(400).json(conflito);
      }

      // const query = ''

      // Inserir reserva no banco
      const query = `
        INSERT INTO reserva (fk_id_usuario, fk_id_sala, data, horarioInicio, horarioFim)
        VALUES (?, ?, ?, ?, ?)
      `;
      const values = [id_usuario, fk_id_sala, data, horarioInicio, horarioFim];

      const result = await queryAsync(query, values);

      return res.status(201).json({
        message: "Reserva criada com sucesso",
        id_reserva: result.insertId
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao criar reserva" });
    }
  }

  static async getReservas(req, res) {
    const query = `
      SELECT r.id_reserva, r.fk_id_usuario, r.fk_id_sala, r.data, r.horarioInicio, r.horarioFim, 
      u.nome AS nomeUsuario, s.numero AS salaNome
      FROM reserva r
      INNER JOIN usuario u ON r.fk_id_usuario = u.id_usuario
      INNER JOIN sala s ON r.fk_id_sala = s.id_sala
    `;

    try {
      const results = await queryAsync(query);

      // Ajustar datas para UTC-3
      const reservasFormatadas = results.map(reserva => reservaFormat(reserva));
      return res.status(200).json({ message: "Lista de Reservas", reservas: reservasFormatadas });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async updateReserva(req, res) {
    const { fk_id_usuario, fk_id_sala, data, horarioInicio, horarioFim } = req.body;
    const reservaId = req.params.id;

    // Valida os campos de atualização
    const validationError = validateReserva({
      fk_id_usuario,
      fk_id_sala,
      data,
      horarioInicio,
      horarioFim
    });

    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      // Obtém o fk_id_sala da reserva
      const querySala = `SELECT fk_id_sala FROM reserva WHERE id_reserva = ?`;
      const resultadosSala = await queryAsync(querySala, [reservaId]);

      if (resultadosSala.length === 0) {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }

      const { fk_id_sala } = resultadosSala[0];

      // Verifica conflitos de horário (excluindo a própria reserva)
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
        return res.status(400).json({ error: "A sala já está reservada neste horário." });
      }

      // Atualiza a reserva
      const queryUpdate = `
        UPDATE reserva 
        SET data = ?, horarioInicio = ?, horarioFim = ?
        WHERE id_reserva = ?
      `;
      await queryAsync(queryUpdate, [data, horarioInicio, horarioFim, reservaId]);

      return res.status(200).json({ message: "Reserva atualizada com sucesso!" });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao atualizar reserva" });
    }
  }

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

  static async viewReservaSala(req, res) {
    const { id_sala, data } = req.body;
    console.log("Dados recebidos:", { id_sala, data });
    
    // Validate parameters
    if (!id_sala || !data) {
      return res.status(400).json({ 
        error: "Parâmetros incompletos. Informe id_sala e data" 
      });
    }
  
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data)) {
      return res.status(400).json({ 
        error: "Formato de data inválido. Use o formato YYYY-MM-DD" 
      });
    }
  
    try {
      const query = `CALL sp_get_sala_reservada(?, ?)`;
      console.log("Executando query:", query);
      console.log("Parâmetros:", [id_sala, data]);
      
      const results = await queryAsync(query, [id_sala, data]);
      console.log("Resultados obtidos:", results);
      
      const salareservada = results[0];
      const salasemreserva = results[1];
      
      return res.status(200).json({ 
        message: "Agenda da sala recuperada com sucesso",
        sala_id: id_sala,
        data: data,
        horarios_reservados: salareservada.map(sala => ({
          id_reserva: sala.id_reserva,
          usuario: sala.nomeUsuario,
          inicio: sala.horarioInicio,
          fim: sala.horarioFim
        })),
        horarios_disponiveis: salasemreserva
      });
    } catch (error) {
      console.error("Erro ao buscar agenda da sala:", error);
      return res.status(500).json({ error: "Erro interno do servidor", detalhes: error.message });
    }
  }
  
};

function reservaFormat(reserva) {
  if (reserva.data instanceof Date) {
    reserva.data = reserva.data.toISOString().split("T")[0];
  }

  if (reserva.horarioInicio instanceof Date) {
    reserva.horarioInicio = reserva.horarioInicio.toISOString().split("T")[1].split(".")[0];
  }

  if (reserva.horarioFim instanceof Date) {
    reserva.horarioFim = reserva.horarioFim.toISOString().split("T")[1].split(".")[0];
  }

  return reserva;
}

