create event if not exists excluirReservasAntigas
    on schedule every 1 week
    starts current_timestamp + interval 5 minute
    on completion preserve
    enable
do
    delete from reserva
    where data < now() - interval 1 year;

