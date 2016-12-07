var mysql = require('mysql');

var banco = {
  host: "localhost",
  user: "gitlog",
  password: "gitlog*",
  database: 'gitlog'
};

function conectar() {
    var connection = mysql.createConnection(banco);
    return connection; 
}


module.exports = {
    conectar
}

