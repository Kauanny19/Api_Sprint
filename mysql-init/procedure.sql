delimiter // 
create procedure ListarReservasPorUsuario(
    in id_usuario int
)
begin
    select
        u.id_usuario,
        u.nome as nomeUsuario,
        s.numero as nomeSala,
        r.data,
        r.horarioInicio,
        r.horarioFim
    from reserva r
    join usuario u on r.fk_id_usuario = u.id_usuario
    join sala s on r.fk_id_sala = s.id_sala
    where r.fk_id_usuario = id_usuario;
    order by u.nome, r.data, r.horarioInicio;
end; //

delimiter ;
call ListarReservasPorUsuario()

