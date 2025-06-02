create table logExclusaoReserva (
  id_log int auto_increment primary key,
  id_reserva int,
  nome_usuario varchar(50),
  fk_id_sala int,
  data_reserva date,
  horario_inicio time,
  horario_fim time,
  data_exclusao datetime
);
 

delimiter //

create trigger tr_logExclusaoReserva
before delete on reserva
for each row
begin
  declare v_nome_usuario varchar(50);

  -- Busca o nome do usuário baseado na FK
  select nome into v_nome_usuario
  from usuario
  where id_usuario = old.fk_id_usuario;

  -- Insere os dados no log
  insert into logExclusaoReserva (
    id_reserva,
    nome_usuario,
    fk_id_sala,
    data_reserva,
    horario_inicio,
    horario_fim,
    data_exclusao
  )
  values (
    old.id_reserva,
    v_nome_usuario,
    old.fk_id_sala,
    old.data,
    old.horarioInicio,
    old.horarioFim,
    now()
  );
end;//

delimiter ;


select * from logExclusaoReserva;