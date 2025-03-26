module.exports = {
  validadeSchedule: function ({
    fk_id_classroom,
    fk_id_usuario,
    data,
    horarioInicio,
    horarioFim
  }) {
    if (!data || !fk_id_usuario || !fk_id_classroom || !horarioFim || !horarioInicio) {
      return { error: "Todos os campos devem ser preenchidos" };
    }

     // Verifica se os horários estão no funcionamento padronizado
     const horaInicio = horarioInicio.getHora();
     const horaFim = horarioFim.getHora();
     if (horaInicio < 7 || horaInicio >= 23 || horaFim < 7 || horaFim >= 23) {
       return {
         error:
           "A reserva deve ser feita no horário de funcionamento do SENAI. Entre 7:00 e 23:00",
       };
     }

     //Veerifica se a reserva é de 50 minutos
    const duration = fimTime - inicioTime;
    const limit = 50 * 60 * 1000;
    if (duration !== limit) {
      return { error: "A reserva deve ter exatamente 50 minutos" };
    }

    // Converter o array days em uma string separada por vírgulas
    const diasString = dias.map((dia) => `${dia}`).join(", ");
    console.log(diasString);

    // Verificar se o tempo está dentro do intervalo permitido
    const isWithinTimeRange = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes;
      return totalMinutes >= 7.5 * 60 && totalMinutes <= 23 * 60;
    } 

    
    
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
}