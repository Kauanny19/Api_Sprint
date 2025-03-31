const db = require("../db/connect");

module.exports = function validateId(fk_id_usuario, fk_id_sala) {
  // Função para verificar se o usuário existe
  const checkUser = (fk_id_usuario) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT id_usuario FROM usuario WHERE id_usuario = ?",
        [fk_id_usuario],
        (err, results) => {
          if (err) return reject({ error: "Erro ao verificar usuário" });
          if (results.length === 0) return resolve({ error: "Usuário não encontrado" });
          resolve(null); // Usuário encontrado
        }
      );
    });
  };
  
  // Função para verificar se a sala existe
  const checkSala = (fk_id_sala) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT id_sala FROM sala WHERE id_sala = ?",
        [fk_id_sala],
        (err, results) => {
          if (err) return reject({ error: "Erro ao verificar sala" });
          if (results.length === 0) return resolve({ error: "Sala não encontrada" });
          resolve(null); // Sala encontrada
        }
      );
    });
  };
  
  // Função para validar os IDs antes de criar a reserva
  const validateId = async (fk_id_usuario, fk_id_sala) => {
    try {
      const userValidation = await checkUser(fk_id_usuario);
      if (userValidation) return userValidation;
  
      const salaValidation = await checkSala(fk_id_sala);
      if (salaValidation) return salaValidation;
  
      return null; // Tudo certo
    } catch (error) {
      return error;
    }
  };

  return validateId(fk_id_usuario, fk_id_sala); // Retorna a execução da validação
};
