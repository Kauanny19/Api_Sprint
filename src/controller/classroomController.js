const connect = require("../db/connect");
module.exports = class classroomController {
  static async createClassroom(req, res) {
    const { numero, descricao, capacidade } = req.body;
    
    const validationError = validateClassroom(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }
    // Caso todos os campos estejam preenchidos, realiza a inserção na tabela
    const query = `INSERT INTO sala (numero, descricao, capacidade) VALUES ( 
        '${numero}', 
        '${descricao}', 
        '${capacidade}'
      )`;

    try {
      connect.query(query, function (err) {
        if (err) {
          console.log(err);
          res.status(500).json({ error: "Erro ao cadastrar sala" });
          return;
        }
        console.log("Sala cadastrada com sucesso");
        res.status(201).json({ message: "Sala cadastrada com sucesso" });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getAllClassrooms(req, res) {
    try {
      const query = "SELECT * FROM sala";
      connect.query(query, function (err, results) {
        if (err) {
          console.error("Erro ao obter salas:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }
        console.log("Salas obtidas com sucesso");
        res.status(200).json({ salas: results });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getClassroomById(req, res) {
    const salaId = req.params.numero;

    try {
      const query = `SELECT * FROM sala WHERE numero = '${salaId}'`;
      connect.query(query, function (err, result) {
        if (err) {
          console.error("Erro ao obter sala:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (result.length === 0) {
          return res.status(404).json({ error: "Sala não encontrada" });
        }

        console.log("Sala obtida com sucesso");
        res.status(200).json({
          message: "Obtendo a sala com ID: " + salaId,
          salas: result[0],
        });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async updateClassroom(req, res) {
    const { numero, descricao, capacidade } = req.body;

    // Validar campos obrigatórios
    if (!numero || !descricao || !capacidade) {
      return res
        .status(400)
        .json({ error: "Todos os campos devem ser preenchidos" });
    }

    try {
      // Verificar se a sala existe
      const findQuery = `SELECT * FROM salas WHERE numero = ?`;
      connect.query(findQuery, [numero], function (err, result) {
        if (err) {
          console.error("Erro ao buscar a sala:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (result.length === 0) {
          return res.status(404).json({ error: "Sala não encontrada" });
        }

        // Atualizar a sala
        const updateQuery = `
              UPDATE sala
              SET descricao = ?, capacidade = ?
              WHERE numero = ?
          `;
        connect.query(
          updateQuery,
          [descricao, capacidade, numero],
          function (err) {
            if (err) {
              console.error("Erro ao atualizar a sala:", err);
              return res
                .status(500)
                .json({ error: "Erro interno do servidor" });
            }

            console.log("Sala atualizada com sucesso");
            res.status(200).json({ message: "Sala atualizada com sucesso" });
          }
        );
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async deleteClassroom(req, res) {
    const salaId = req.params.numero;
    try {
      // Verificar se há reservas associadas à sala
      const checkReservationsQuery = `SELECT * FROM reserva WHERE sala = ?`;
      connect.query(
        checkReservationsQuery,
        [salaId],
        function (err, reservations) {
          if (err) {
            console.error("Erro ao verificar reservas:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
          }

          // Verificar se existem reservas associadas
          if (reservations.length > 0) {
            // Impedir exclusão e retornar erro
            return res
              .status(400)
              .json({
                error:
                  "Não é possível excluir a sala, pois há reservas associadas.",
              });
          } else {
            // Deletar a sala de aula
            const deleteQuery = `DELETE FROM sala WHERE numero = ?`;
            connect.query(deleteQuery, [salaId], function (err, result) {
              if (err) {
                console.error("Erro ao deletar a sala:", err);
                return res
                  .status(500)
                  .json({ error: "Erro ao deletar a sala" });
              }

              if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Sala não encontrada" });
              }

              console.log("Sala deletada com sucesso");
              res.status(200).json({ message: "Sala excluída com sucesso" });
            });
          }
        }
      );
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};
