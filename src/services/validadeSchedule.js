module.exports = function validadeSchedule({
    dataFim,
    dataInicio,
    days,
    usuario,
    salas,
    horarioFim,
    horarioInicio,
  }) {
    if (!dataFim || !dataInicio || !days || !usuario || !salas || !horarioFim || !horarioInicio) {
      return { error: "Todos os campos devem ser preenchidos" };
    }
  
    return null; // Retorna null se não houver erro
  };
  