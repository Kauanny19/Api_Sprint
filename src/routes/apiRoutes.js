const router = require("express").Router();
const userController = require("../controller/userController");
const classroomController = require("../controller/classroomController");
const controllerReserva = require("../controller/controllerReserva");
const verifyJWT = require("../services/verifyJWT");

//User
router.post("/user/", userController.createUser);
router.post("/user/login", userController.postLogin);
router.get("/user/", userController.getAllUsers);
router.get("/user/:id", userController.getUserById);
router.put("/user", verifyJWT, userController.updateUser); 
router.delete("/user/:id", verifyJWT, userController.deleteUser); 

//Classroom
router.post("/sala/", classroomController.createClassroom);
router.get("/sala/", classroomController.getAllClassrooms);
router.get("/sala/:numero", classroomController.getClassroomById);
router.put("/sala/", classroomController.updateClassroom);
router.delete("/sala/:numero", classroomController.deleteClassroom);

// Reservas
router.post("/reserva/", controllerReserva.createReserva);
router.get("/reserva/", controllerReserva.getReservas);
router.put("/reserva/:id", controllerReserva.updateReserva);
router.delete("/reserva/:id_reserva", controllerReserva.deleteReserva);
router.get("/reserva/horarios/:id_sala/:data", controllerReserva.getHorariosSala);

module.exports = router;

// http://10.89.240.73:3000/api/
