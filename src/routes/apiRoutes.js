const router = require("express").Router();

const userController = require("../controller/userController");
const classroomController = require("../controller/classroomController");
const controllerReserva = require("../controller/controllerReserva");

const verifyJWT = require("../services/verifyJWT");

//User
router.post("/user/", userController.createUser);
// http://10.89.240.73:3000/api/user/

router.post("/user/login", userController.postLogin);
// http://10.89.240.73:3000/api/user/login

router.get("/user/", userController.getAllUsers);
// http://10.89.240.73:3000/api/user/

router.get("/user/:id", userController.getUserById);
// http://10.89.240.73:3000/api/user/id

// JWT User na delete e Update 
router.put("/user", verifyJWT, userController.updateUser); 
// http://10.89.240.73:3000/api/user/

router.delete("/user/:id", verifyJWT, userController.deleteUser); 
// http://10.89.240.73:3000/api/user/id/


//Classroom
router.post("/sala/", classroomController.createClassroom);
// http://10.89.240.73:3000/api/sala

router.get("/sala/", classroomController.getAllClassrooms);
// http://10.89.240.73:3000/api/sala

router.get("/sala/:numero", classroomController.getClassroomById);
// http://10.89.240.73:3000/api/sala/numero

router.put("/sala/", classroomController.updateClassroom);
// http://10.89.240.73:3000/api/sala

router.delete("/sala/:numero", classroomController.deleteClassroom);
// http://10.89.240.73:3000/api/sala/numero


// Reservas
router.post("/reserva/", controllerReserva.createReserva);
// http://10.89.240.73:3000/api/reserva

router.get("/reserva/", controllerReserva.getReservas);
// http://10.89.240.73:3000/api/reserva

router.put("/reserva/:id", controllerReserva.updateReserva);
// http://10.89.240.73:3000/api/reserva/id

router.delete("/reserva/:id_reserva", controllerReserva.deleteReserva);
// http://10.89.240.73:3000/api/reserva/id_reserva

router.get("/reserva/horarios/:id_sala/:data", controllerReserva.getHorariosSala);
// http://10.89.240.73:3000/api/reserva/horarios/:id_sala/:data


module.exports = router;

// http://10.89.240.73:3000/api/
