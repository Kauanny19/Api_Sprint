const connect = require("../db/connect");
const validadeSchedule = require("../services/validadeSchedule");

// Função auxiliar para executar queries e retornar uma Promise
const queryAsync = (query, values = []) => {
  return new Promise((resolve, reject) => {
    connect.query(query, values, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

  getSchedulesByIdClassroomRanges(req, res) {
    const salaId = req.params.id;
    const { weekStart, weekEnd } = req.query; // Variavel para armazenar a semana selecionada
    console.log(weekStart+' '+weekEnd)
    // Consulta SQL para obter todos os agendamentos para uma determinada sala de aula
    const query = `
    SELECT reserva.*, usuario.nome AS nomeUsuario
    FROM schedule
    JOIN usuario ON reserva.usuario = usuario.cpf
    WHERE sala = '${salaId}'
    AND (dataInicio <= '${weekEnd}' AND dataFim >= '${weekStart}')`;



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

  getSchedulesByIdClassroom(req, res) {
    const classroomID = req.params.id;

    // Consulta SQL para obter todos os agendamentos para uma determinada sala de aula
    const query = `
  SELECT schedule.*, user.name AS userName
  FROM schedule
  JOIN user ON schedule.user = user.cpf
  WHERE classroom = '${classroomID}'`;

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

  getAllSchedules(req, res) {
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

  deleteSchedule(req, res) {
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

