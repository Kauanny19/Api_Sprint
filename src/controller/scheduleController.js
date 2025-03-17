const connect = require("../db/connect");

// Verificar se o horário de início de um agendamento está dentro de um intervalo de tempo
function isInTimeRange(timeStart, timeRange) {
  const [start, end] = timeRange.split(" - ");
  const startTime = new Dia(`1970-01-01T${start}`).getTime();
  const endTime = new Dia(`1970-01-01T${end}`).getTime();
  const scheduleTime = new Date(`1970-01-01T${timeStart}`).getTime();
  return scheduleTime >= startTime && scheduleTime < endTime;
}

module.exports = class scheduleController {
  static async createSchedule(req, res) {
    const { dataInicio, dataFim, dias, usuario, salas, horarioInicio, horarioFim } =
      req.body;
    console.log(req.body);
    // Verificar se todos os campos estão preenchidos
    if (
      !dataInicio ||
      !dataFim ||
      !dias ||
      !usuario ||
      !salas ||
      !horarioInicio ||
      !horarioFim
    ) {
      return res
        .status(400)
        .json({ error: "Todos os campos devem ser preenchidos" });
    }

    // Converter o array days em uma string separada por vírgulas
    const daysString = days.map((dia) => `${dia}`).join(", ");
    console.log(daysString);

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
        salas = '${salas}'
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
                INSERT INTO schedule (dataInicio, dataFim, dias, usuario, salas, horarioInicio, horarioFim)
                VALUES (
                    '${dataInicio}',
                    '${dataFim}',
                    '${diasString}',
                    '${usuario}',
                    '${salas}',
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
    const salasId = req.params.id;
    const { weekStart, weekEnd } = req.query; // Variavel para armazenar a semana selecionada
    console.log(weekStart+' '+weekEnd)
    // Consulta SQL para obter todos os agendamentos para uma determinada sala de aula
    const query = `
    SELECT reserva.*, usuario.nome AS nomeUsuario
    FROM schedule
    JOIN usuario ON reserva.usuario = usuario.cpf
    WHERE salas = '${salasId}'
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
      SELECT schedule.*, user.name AS userName
      FROM schedule
      JOIN user ON schedule.user = user.cpf
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
