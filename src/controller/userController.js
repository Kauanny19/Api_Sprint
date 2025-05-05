const connect = require("../db/connect");
const validateUser = require("../services/validateUser");
const validateCpf = require("../services/validateCpf");
const jwt = require("jsonwebtoken");

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
      const query = `INSERT INTO usuario (cpf, senha, email, nome) VALUES (?, ?, ?, ?)`;
      connect.query(query, [cpf, senha, email, nome], (err) => {
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
          console.error(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        return res
          .status(200)
          .json({ message: "Obtendo todos os usuários", users: results });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  static async getUserById(req, res) {
    const userId = req.params.id;
    const query = `SELECT * FROM usuario WHERE cpf = ?`;
    const values = [userId];

    try {
      connect.query(query, values, function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        return res.status(200).json({
          message: "Obtendo usuário com CPF: " + userId,
          user: results[0],
        });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async updateUser(req, res) {
    const { cpf, email, senha, nome, id } = req.body;
    const userId = id;
    const VerificarToken = userId;

    // Aqui você precisa ter certeza que `req.user.id` existe, ou adaptar conforme seu token
    if (VerificarToken !== req.userId) {
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
      const query =
        "UPDATE usuario SET cpf = ?, email = ?, senha = ?, nome = ?  WHERE id_usuario = ?";
      connect.query(query, [cpf, email, senha, nome, id], (err, results) => {
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
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
  static async deleteUser(req, res) {
    const userId = req.params.id;
    const usuarioId = req.userId; // ID do usuário autenticado (via token)

    // Verifica se o usuário autenticado está tentando deletar outro usuário
    if (Number(userId) !== Number(usuarioId)) {
      return res
        .status(403)
        .json({ error: "Usuário não autorizado a deletar este perfil" });
    }

    const query = `DELETE FROM usuario WHERE id_usuario = ?`;
    const values = [userId];

    try {
      connect.query(query, values, function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        return res
          .status(200)
          .json({ message: "Usuário excluído com ID: " + userId });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Método de Login
  static async postLogin(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    // Usando uma function SQL para validar login
    const query = `SELECT fn_validar_login(?, ?) AS usuario_id`;

    try {
      connect.query(query, [email, senha], (err, results) => {
        if (err) {
          console.error("Erro ao executar a consulta:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        const usuarioId = results[0].usuario_id;

        if (usuarioId <= 0) {
          return res.status(401).json({ error: "Credenciais inválidas" });
        }

        // Define a query SQL para obter os dados do usuário a partir do ID
        const getUserQuery = `SELECT id_usuario, nome, email, cpf FROM usuario WHERE id_usuario = ?`;

        // Executa a query no banco de dados, passando o ID do usuário como parâmetro
        connect.query(getUserQuery, [usuarioId], (err, userResults) => {
          // Se ocorrer um erro durante a execução da consulta, retorna erro 500 (erro interno do servidor)
          if (err) {
            return res
              .status(500)
              .json({ error: "Erro ao obter dados do usuário" });
          }

          // Armazena o primeiro resultado da consulta (usuário encontrado)
          const user = userResults[0];

          // Gera um token JWT assinado com o ID do usuário, usando a chave secreta (process.env.SECRET)
          // O token terá validade de 1 hora
          const token = jwt.sign({ id: user.id_usuario }, process.env.SECRET, {
            expiresIn: "1h",
          });

          // Retorna resposta de sucesso com os dados do usuário e o token JWT gerado
          return res.status(200).json({
            message: "Login bem-sucedido", // Mensagem de sucesso
            user, // Objeto com dados do usuário (id, nome, email, cpf)
            token, // Token JWT que poderá ser usado para autenticação nas próximas requisições
          });
        });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};
