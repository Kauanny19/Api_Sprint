module.exports = function validadeTimeRange() {
    //Verificar se o tempo está dentro do intervalo permitido
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
  return null; // Retorna null se não houver erro
  };