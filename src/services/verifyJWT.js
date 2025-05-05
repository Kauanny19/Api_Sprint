const jwt = require("jsonwebtoken");
function verifyJWT(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) {
        return res.status(401).json({
            auth: false, // Indicando que a autenticação falhou
            message: "Token não foi fornecido" // Mensagem explicando o erro
        });
    }
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                auth: false, // Indicando que a autenticação falhou
                message: "Falha na autenticação do Token" // Mensagem explicando o erro
            });
        }
        req.userId = decoded.id;
        next();
    });
}
module.exports = verifyJWT;
