const connect = require("../db/connect");
const validateUser = require("../services/validateUser");
const validateCpf = require("../services/validateCpf");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

module.exports = class userController {
  static async createUser(req, res) {
    const { cpf, email, senha, nome } = req.body;

    const validationError = validateUser(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      const cpfError = await validateCpf(cpf);
      if (cpfError) {
        return res.status(400).json(cpfError);
      }
      const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

      const query = `INSERT INTO usuario (cpf, senha, email, nome) VALUES (?, ?, ?, ?)`;
      connect.query(query, [cpf, hashedPassword, email, nome], (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            if (err.message.includes("email")) {
              return res.status(400).json({ error: "Email já cadastrado" });
            }
          } else {
            console.log(err);
            return res
              .status(500)
              .json({ error: "Erro interno do servidor", err });
          }
        }
        return res.status(201).json({ message: "Usuário criado com sucesso" });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
  static async getAllUsers(req, res) {
    const query = `SELECT * FROM usuario`;

    try {
      connect.query(query, function (err, results) {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        return res
          .status(200)
          .json({ message: "Obtendo todos os usuários", users: results });
      });
    } catch (error) {
      console.log("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  static async getUserById(req, res) {
    const userId = req.params.id;
    const query = `SELECT * FROM usuario WHERE id_usuario = ?`;
    const values = [userId];

    try {
      connect.query(query, values, function (err, results) {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        return res.status(200).json({
          message: "Obtendo usuário com id: " + userId,
          user: results[0],
        });
      });
    } catch (error) {
      console.log("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async updateUser(req, res) {
    const { cpf, email, senha, nome, id } = req.body;
    const userId = id;
    const VerificarToken = userId;

    // Aqui você precisa ter certeza que `req.user.id` existe, ou adaptar conforme seu token
    if (Number(VerificarToken) !== Number(req.userId)) {
      return res
        .status(403)
        .json({ error: "Usuário não autorizado a atualizar este perfil" });
    }

    const validationError = validateUser(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      const cpfError = await validateCpf(cpf, id);
      if (cpfError) {
        return res.status(400).json(cpfError);
      }

      const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

      const query =
        "UPDATE usuario SET cpf = ?, email = ?, senha = ?, nome = ?  WHERE id_usuario = ?";
      connect.query(
        query,
        [cpf, email, hashedPassword, nome, id],
        (err, results) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY") {
              if (err.message.includes("email")) {
                return res.status(400).json({ error: "Email já cadastrado" });
              }
            } else {
              return res
                .status(500)
                .json({ error: "Erro interno do servidor", err });
            }
          }
          if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
          }
          return res
            .status(200)
            .json({ message: "Usuário atualizado com sucesso" });
        }
      );
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
  static async deleteUser(req, res) {
    const userId = req.params.id;
    const usuarioId = req.userId; // ID do usuário autenticado via token

    // Verifica se o usuário autenticado é o mesmo que está tentando deletar
    if (Number(userId) !== Number(usuarioId)) {
      return res
        .status(403)
        .json({ error: "Usuário não autorizado a deletar este perfil" });
    }

    try {
      const query = `CALL deletarUsuarioComReservas(?)`;

      connect.query(query, [userId], (err, results) => {
        if (err) {
          console.error("Erro ao executar procedure:", err);
          return res
            .status(500)
            .json({ error: "Erro ao excluir usuário e reservas" });
        }

        return res.status(200).json({
          message: `Usuário (ID: ${userId}) e suas reservas foram excluídos com sucesso`,
        });
      });
    } catch (error) {
      console.error("Erro inesperado:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Método de Login
  static async postLogin(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const query = `SELECT * FROM usuario WHERE email = ?`;

    try {
      connect.query(query, [email], (err, results) => {
        if (err) {
          console.log("Erro ao executar a consulta:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
          return res.status(401).json({ error: "Usuário não encontrado" });
        }

        const user = results[0];

        // Comparar a senha enviada na requisição com o hash do banco
        const passwordOK = bcrypt.compareSync(senha, user.senha);

        if (!passwordOK) {
          return res.status(401).json({ error: "Senha incorreta" });
        }

        const token = jwt.sign({ id: user.id_usuario }, process.env.SECRET, {
          expiresIn: "1h",
        });

        delete user.senha;

        // Retorna resposta de sucesso com os dados do usuário e o token JWT gerado
        return res.status(200).json({
          message: "Login bem-sucedido",
          user,
          token,
        });
      });
    } catch (error) {
      console.log("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};
