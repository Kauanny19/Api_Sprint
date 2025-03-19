const connect = require("../db/connect");

// Verificar se o horário de início de um agendamento está dentro de um intervalo de tempo
function isInTimeRange(horarioInicio, timeRange) {
  const [start, end] = timeRange.split(" - ");
  const horarioInicioMs = new Date(`1970-01-01T${start}`).getTime();
  const horarioFimMs = new Date(`1970-01-01T${end}`).getTime();
  const reservaTime = new Date(`1970-01-01T${horarioInicio}`).getTime();
  return reservaTime >= horarioInicioMs && reservaTime < horarioFimMs;
}

module.exports = class scheduleController {
  static async createSchedule(req, res) {
    const { dataInicio, dataFim, dias, usuario, idSala, horarioInicio, horarioFim } =
      req.body;
    console.log(req.body);



    // Converter o array days em uma string separada por vírgulas
    const diasString = dias.map((dia) => `${dia}`).join(", ");
    console.log(diasString);

    // Verificar se o tempo está dentro do intervalo permitido
    const isWithinTimeRange = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes;
      return totalMinutes >= 7.5 * 60 && totalMinutes <= 23 * 60;
    };

    // Verificar se o tempo de início e término está dentro do intervalo permitido
    if (!isWithinTimeRange(horarioInicio) || !isWithinTimeRange(horarioFim)) {
      return res.status(400).json({
        error:
          "A sala de aula só pode ser reservada dentro do intervalo de 7:30 às 23:00",
      });
    }

    try {
      const overlapQuery = `
    SELECT * FROM reserva
    WHERE 
        sala = '${idSala}'
        AND (
            (dataInicio <= '${dataFim}' AND dataFim >= '${dataInicio}')
        )
        AND (
            (dataInicio <= '${horarioFim}' AND horarioFim >= '${horarioInicio}')
        )
        AND (
            (dias LIKE '%Seg%' AND '${diasString}' LIKE '%Seg%') OR
            (dias LIKE '%Ter%' AND '${diasString}' LIKE '%Ter%') OR
            (dias LIKE '%Qua%' AND '${diasString}' LIKE '%Qua%') OR 
            (dias LIKE '%Qui%' AND '${diasString}' LIKE '%Qui%') OR
            (dias LIKE '%Sex%' AND '${diasString}' LIKE '%Sex%') OR
            (dias LIKE '%Sab%' AND '${diasString}' LIKE '%Sab%')
        )`;

      connect.query(overlapQuery, function (err, results) {
        if (err) {
          console.log(err);
          return res
            .status(500)
            .json({ error: "Erro ao verificar agendamento existente" });
        }

        // Se a consulta retornar algum resultado, significa que já existe um agendamento
        if (results.length > 0) {
          return res.status(400).json({
            error:
              "Já existe um agendamento para os mesmos dias, sala e horários",
          });
        }

        // Caso contrário, prossegue com a inserção na tabela
        const insertQuery = `
                INSERT INTO schedule (dataInicio, dataFim, dias, usuario, idSala, horarioInicio, horarioFim)
                VALUES (
                    '${dataInicio}',
                    '${dataFim}',
                    '${diasString}',
                    '${usuario}',
                    '${idSala}',
                    '${horarioInicio}',
                    '${horarioFim}'
                )
            `;

        // Executa a consulta de inserção
        connect.query(insertQuery, function (err) {
          if (err) {
            console.log(err);
            return res
              .status(500)
              .json({ error: "Erro ao cadastrar agendamento" });
          }
          console.log("Agendamento cadastrado com sucesso");
          return res
            .status(201)
            .json({ message: "Agendamento cadastrado com sucesso" });
        });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getSchedulesByIdClassroomRanges(req, res) {
    const salaId = req.params.id;
    const { weekStart, weekEnd } = req.query; // Variavel para armazenar a semana selecionada
    console.log(weekStart+' '+weekEnd)
    // Consulta SQL para obter todos os agendamentos para uma determinada sala de aula
    const query = `
    SELECT reserva.*, usuario.nome AS nomeUsuario
    FROM schedule
    JOIN usuario ON reserva.usuario = usuario.cpf
    WHERE sala = '${salaId}'
    AND (dataInicio <= '${weekEnd}' AND dataFim >= '${weekStart}')
`;



    try {
      // Executa a consulta
      connect.query(query, function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        // Objeto para armazenar os agendamentos organizados por dia da semana e intervalo de horário
        const schedulesByDayAndTimeRange = {
          Seg: {
            "07:30 - 09:30": [],
            "09:30 - 11:30": [],
            "12:30 - 15:30": [],
            "15:30 - 17:30": [],
            "19:00 - 22:00": [],
          },
          Ter: {
            "07:30 - 09:30": [],
            "09:30 - 11:30": [],
            "12:30 - 15:30": [],
            "15:30 - 17:30": [],
            "19:00 - 22:00": [],
          },
          Qua: {
            "07:30 - 09:30": [],
            "09:30 - 11:30": [],
            "12:30 - 15:30": [],
            "15:30 - 17:30": [],
            "19:00 - 22:00": [],
          },
          Qui: {
            "07:30 - 09:30": [],
            "09:30 - 11:30": [],
            "12:30 - 15:30": [],
            "15:30 - 17:30": [],
            "19:00 - 22:00": [],
          },
          Sex: {
            "07:30 - 09:30": [],
            "09:30 - 11:30": [],
            "12:30 - 15:30": [],
            "15:30 - 17:30": [],
            "19:00 - 22:00": [],
          },
          Sab: {
            "07:30 - 09:30": [],
            "09:30 - 11:30": [],
            "12:30 - 15:30": [],
            "15:30 - 17:30": [],
            "19:00 - 22:00": [],
          },
        };

        // Organiza os agendamentos pelos dias da semana e intervalo de horário
        results.forEach((reserva) => {
          const dias = reserva.dias.split(", ");
          const timeRanges = [
            "07:30 - 09:30",
            "09:30 - 11:30",
            "12:30 - 15:30",
            "15:30 - 17:30",
            "19:00 - 22:00",
          ];
          dias.forEach((dia) => {
            timeRanges.forEach((timeRange) => {
              if (isInTimeRange(schedule.timeStart, timeRange)) {
                schedulesByDayAndTimeRange[dia][timeRange].push(reserva);
              }
            });
          });
        });

        // Ordena os agendamentos dentro de cada lista com base no timeStart
        Object.keys(schedulesByDayAndTimeRange).forEach((dia) => {
          Object.keys(schedulesByDayAndTimeRange[dia]).forEach((timeRange) => {
            schedulesByDayAndTimeRange[dia][timeRange].sort((a, b) => {
              const timeStartA = new Date(`1970-01-01T${a.timeStart}`);
              const timeStartB = new Date(`1970-01-01T${b.timeStart}`);
              return timeStartA - timeStartB;
            });
          });
        });

        // Retorna os agendamentos organizados por dia da semana e intervalo de horário
        return res.status(200).json({ schedulesByDayAndTimeRange });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getSchedulesByIdClassroom(req, res) {
    const classroomID = req.params.id;

    // Consulta SQL para obter todos os agendamentos para uma determinada sala de aula
    const query = `
  SELECT schedule.*, user.name AS userName
  FROM schedule
  JOIN user ON schedule.user = user.cpf
  WHERE classroom = '${classroomID}'
`;

    try {
      connect.query(query, function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        // Objeto para armazenar os agendamentos organizados por dia da semana
        const schedulesByDay = {
          Seg: [],
          Ter: [],
          Qua: [],
          Qui: [],
          Sex: [],
          Sab: [],
        };

        // Organiza os agendamentos pelos dias da semana
        results.forEach((schedule) => {
          const days = schedule.days.split(", ");
          days.forEach((day) => {
            schedulesByDay[day].push(schedule);
          });
        });

        // Ordena os agendamentos dentro de cada lista com base no timeStart
        Object.keys(schedulesByDay).forEach((day) => {
          schedulesByDay[day].sort((a, b) => {
            const timeStartA = new Date(`1970-01-01T${a.timeStart}`);
            const timeStartB = new Date(`1970-01-01T${b.timeStart}`);
            return timeStartA - timeStartB;
          });
        });

        // Retorna os agendamentos organizados por dia da semana e ordenados por timeStart
        return res.status(200).json({ schedulesByDay });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getAllSchedules(req, res) {
    try {
      // Consulta SQL para obter todos os agendamentos
      const query = `
      SELECT reserva.*, usuario.nome AS usuarioNome
      FROM reserva
      JOIN usuario ON reserva.fk_id_usuario = usuario.cpf
    `;

      connect.query(query, function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        // Objeto para armazenar os agendamentos organizados por dia da semana
        const schedulesByDay = {
          Seg: [],
          Ter: [],
          Qua: [],
          Qui: [],
          Sex: [],
          Sab: [],
        };

        // Organiza os agendamentos pelos dias da semana
        results.forEach((schedule) => {
          const days = schedule.days.split(", ");
          days.forEach((day) => {
            schedulesByDay[day].push(schedule);
          });
        });

        // Ordena os agendamentos dentro de cada lista com base no timeStart
        Object.keys(schedulesByDay).forEach((day) => {
          schedulesByDay[day].sort((a, b) => {
            const timeStartA = new Date(`1970-01-01T${a.timeStart}`);
            const timeStartB = new Date(`1970-01-01T${b.timeStart}`);
            return timeStartA - timeStartB;
          });
        });

        // Retorna os agendamentos organizados por dia da semana e ordenados por timeStart
        return res.status(200).json({ schedulesByDay });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async deleteSchedule(req, res) {
    const scheduleId = req.params.id;
    const query = `DELETE FROM schedule WHERE id = ?`;
    const values = [scheduleId];

    try {
      connect.query(query, values, function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Agendamento não encontrado" });
        }

        return res
          .status(200)
          .json({ message: "Agendamento excluído com ID: " + scheduleId });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};



// CODIGO JAO
// const connect_database = require("../db/connect");

// module.exports = class agendamentoController {

// // ------------------------ Criação de um agendamento

//   static async createAgend(req, res) {
//     const {fk_id_usuario, fk_id_sala, begin, end} = req.body;

//     // Validação dos campos obrigatórios
//     if (!fk_id_usuario || !fk_id_sala || !begin || !end) 
//       { return res.status(400).json({ error: "Todos os campos devem ser preenchidos!" });
//     }

//     // Converte os horários de início e fim para objetos Date
//     const inicio = new Date(begin);
//     const fim = new Date(end);

//     // Define os horários de limite (7h00 e 21h00)
//     const limiteInicio = new Date(inicio);
//     limiteInicio.setHours(7, 0, 0, 0); //limite do inicio
//     const limiteFim = new Date(inicio);
//     limiteFim.setHours(21, 0, 0, 0); //limite do fim

//     // Verifica se o horário de início e fim estão dentro do intervalo permitido (7h - 21h)
//     if (inicio < limiteInicio || inicio >= limiteFim) {
//       return res.status(400).json({ error: "O horário de início deve ser entre 07:00 e 21:00!" });
//     }

//     if (fim <= inicio || fim > limiteFim) {
//       return res.status(400).json({
//         error:"O horário de término deve ser entre 07:00 e 21:00 e não pode ser antes do horário de início!",
//       });
//     }

//     // Verifica se já existe agendamento para a sala no horário
//     const checkQuery = `SELECT * FROM reserva WHERE fk_id_sala = ? 
//       AND (
//         (begin < ? AND end > ?) OR 
//         (begin >= ? AND begin < ?) OR
//         (end > ? AND end <= ?) 
//       )`;

//     const checkValues = [fk_id_sala, begin, end, begin, end, begin, end ];

//     try {
//       connect_database.query(checkQuery, checkValues, (err, results) => {
//         if (err) {
//           console.log(err);
//           return res.status(500).json({ error: "Erro ao verificar disponibilidade da sala!" });
//         }
//         if (results.length > 0) {
//           return res.status(400).json({ error: "A sala já está reservada nesse horário!" });
//         }
//         if (begin > end) {
//           return res.status(400).json({
//             error: "O horário de inicio é maior que o horário de fim!",
//           });
//         }
//         if (begin === end) {
//           return res.status(400).json({ error: "Os horários estão iguais!" });
//         }
//         const limite_hora = 1000 * 60 * 60; //1 hora em milesegundos
//         if (new Date(end) - new Date(begin) > limite_hora) {
//           return res.status(400).json({
//             error:"A sua reserva excede o tempo, se necessário faça uma segunda reserva!"
//           });
//         }

//         // Inserir o novo agendamento
//         const query = `INSERT INTO reserva (fk_id_usuario, fk_id_sala, begin, end) 
//                        VALUES (?, ?, ?, ?)`;
//         const values = [fk_id_usuario, fk_id_sala, begin, end];

//         connect_database.query(query, values, (err) => {
//           if (err) {
//             console.log(err);
//             return res.status(500).json({ error: "Erro ao criar reserva!" });
//           }
//           return res.status(201).json({ message: "Reserva realizada com sucesso!" });
//         });
//       });
//     } catch (error) {
//       console.log("Erro ao executar consulta:", error);
//       return res.status(500).json({ error: "Erro interno do servidor!" });
//     }
//   }

// // ------------------------ Visualizar todos os agendamentos

//   static async getAllAgend(req, res) {
//     const query = `SELECT * FROM reserva`;

//     try {
//       connect_database.query(query, (err, results) => {
//         if (err) {
//           console.log(err);
//           return res.status(500).json({ error: "Erro ao buscar reserva" });
//         }
//         return res.status(200).json({
//           message: "reserva realizada com sucesso!",
//           reserva: results,
//         });
//       });
//     } catch (error) {
//       console.log("Erro ao executar consulta:", error);
//       return res.status(500).json({ error: "Erro interno do servidor!" });
//     }
//   }


// // --------------------- Atualizar um agendamento

//   static async updateAgend(req, res) {
//     const {id_reserva, fk_id_usuario, fk_id_sala, begin, end} = req.body;

//     // Validação dos campos obrigatórios
//     if (!id_reserva || !fk_id_usuario || !fk_id_sala || !begin || !end ) 
//       {return res.status(400).json({ error: "Todos os campos devem ser preenchidos!" });
//     }

//     // Converte os horários de início e fim para objetos Date
//     const inicio = new Date(begin);
//     const fim = new Date(end);

//     // Define os horários de limite (7h00 e 21h00)
//     const limiteInicio = new Date(inicio);
//     limiteInicio.setHours(7, 0, 0, 0); //limite do inicio
//     const limiteFim = new Date(inicio);
//     limiteFim.setHours(21, 0, 0, 0); //limite do fim

//     // Verifica se o horário de início e fim estão dentro do intervalo permitido (7h - 21h)
//     if (inicio < limiteInicio || inicio >= limiteFim) {
//       return res.status(400).json({ error: "O horário está fora do determinado" });
//     }

//     if (fim <= inicio || fim > limiteFim) {
//       return res.status(400).json({
//         error:
//           "O horário de término deve ser entre 07:00 e 21:00 e não pode ser antes do horário de início!",
//       });
//     }

//     // Verifica se já existe agendamento para a sala no horário
//     const checkQuery = `SELECT * FROM reserva WHERE fk_id_sala = ? AND id_reserva != ? AND
//                         ((begin BETWEEN ? AND ?) OR (end BETWEEN ? AND ?))`;
//     const checkValues = [fk_id_sala, id_reserva, begin, end, begin, end];

//     try {
//       connect_database.query(checkQuery, checkValues, (err, results) => {
//         if (err) {
//           console.log(err);
//           return res.status(500).json({ error: "Erro ao verificar disponibilidade da sala!" });
//         }
//         if (results.length > 0) {
//           return res.status(400).json({ error: "A sala já está reservada nesse horário!" });
//         }

//         // Atualizar o agendamento
//         const query = `UPDATE reserva SET fk_id_usuario = ?, fk_id_sala = ?, begin = ?, end = ? 
//                        WHERE id_reserva = ?`;
//         const values = [fk_id_usuario, fk_id_sala, begin, end, id_reserva,];

//         connect_database.query(query, values, (err, results) => {
//           if (err) {
//             console.log(err);
//             return res.status(500).json({ error: "Erro ao atualizar a reserva!" });
//           }
//           if (results.affectedRows === 0) {
//             return res.status(404).json({ error: "Reserva não encontrada!" });
//           }
//           return res.status(200).json({ message: "Reserva atualizada com sucesso!" });
//         });
//       });
//     } catch (error) {
//       console.log("Erro ao executar consulta:", error);
//       return res.status(500).json({ error: "Erro interno do servidor!" });
//     }
//   }

// // ----------------------------Excluir um agendamento

//   static async deleteAgend(req, res) {
//     const idAgendamento = req.params.id;

//     const query = `DELETE FROM reserva WHERE id_reserva = ?`;

//     try {
//       connect_database.query(query, idAgendamento, (err, results) => {
//         if (err) {
//           console.log(err);
//           return res.status(500).json({ error: "Erro ao excluir reserva!" });
//         }
//         if (results.affectedRows === 0) {
//           return res.status(404).json({ error: "Reserva não encontrada!" });
//         }
//         return res.status(200).json({ message: "Reserva excluída com sucesso!" });
//       });
//     } catch (error) {
//       console.log("Erro ao executar a consulta!", error);
//       return res.status(500).json({ error: "Erro interno do servidor!" });
//     }
//   }
// };
