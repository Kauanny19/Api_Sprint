const connect = require("../db/connect");

module.exports = function listarReservasPorUsuario(id_usuario, callback) {
  const query = `CALL ListarReservasPorUsuario(?)`;

  connect.query(query, [id_usuario], (err, results) => {
    if (err) {
      console.error("Erro ao listar reservas:", err);
      return callback(err, null); // Retorna erro ao callback
    }

    // results[0] contém o resultado da procedure
    return callback(null, results[0]);
  });
};