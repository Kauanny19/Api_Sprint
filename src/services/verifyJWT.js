// Importa o módulo 'jsonwebtoken', usado para criar e verificar tokens JWT (JSON Web Token)
const jwt = require("jsonwebtoken");

// Define a função middleware 'verifyJWT' para verificar a autenticidade do token JWT
function verifyJWT(req, res, next) {
    // Obtém o token JWT do cabeçalho HTTP "authorization"
    const token = req.headers["authorization"];

    // Se o token não for fornecido, retorna erro 401 (Unauthorized)
    if (!token) {
        return res.status(401).json({
            auth: false, // Indica que o usuário não está autenticado
            message: "Token não foi fornecido" // Mensagem explicando o erro
        });
    }

    // Verifica se o token é válido usando a chave secreta armazenada na variável de ambiente SECRET
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        // Se ocorrer um erro na verificação (token inválido, expirado, etc.)
        if (err) {
            return res.status(403).json({
                auth: false, // Indica que o usuário não está autenticado
                message: "Falha na autenticação do Token" // Mensagem explicando o erro
            });
        }

        // Se o token for válido, salva o ID do usuário extraído do token na requisição
        req.userId = decoded.id;

        // Chama o próximo middleware ou rota, já que o token foi verificado com sucesso
        next();
    });
}

// Exporta a função para que ela possa ser usada em outras partes da aplicação
module.exports = verifyJWT;
