const connect = require("../db/connect");

module.exports = function validateHorario(fk_id_sala, data, horarioInicio, horarioFim, id_reserva = null) {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT id_reserva FROM reserva
      WHERE fk_id_sala = ? 
      AND data = ? 
      AND (
        (horarioInicio < ? AND horarioFim > ?) OR
        (horarioInicio < ? AND horarioFim > ?) OR
        (horarioInicio >= ? AND horarioInicio < ?) OR
        (horarioFim > ? AND horarioFim <= ?)
      )
    `;

    const values = [
      fk_id_sala,
      data,
      horarioInicio, horarioInicio,
      horarioInicio, horarioFim,
      horarioInicio, horarioFim,
      horarioInicio, horarioFim,
    ];

    if (id_reserva) {
      query += " AND id != ?";
      values.push(id_reserva);
    }

    connect.query(query, values, (err, results) => {
      if (err) {
        return reject({ error: "Erro ao verificar conflito de horário"});
      }
      if (results.length > 0) {
        return resolve({ error: "A sala já está reservada neste dia e horário." });
      }
      resolve(null);
    });
  });
};
