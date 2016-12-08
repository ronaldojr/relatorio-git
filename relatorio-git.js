const app = require('./app');
const gitlog = require('gitlog');
const bodyParser = require('body-parser');
const Excel = require('exceljs');
const banco = require('./banco.js');

var fields = [ 
      'hash'
      , 'abbrevHash'
      , 'subject'
      , 'authorName'
      , 'authorDate'
      , 'body'
      ] 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("*",  (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.post('/get', (req, res) => {
  if (req.body.tipo == 0) {
    var repositorio = { repo: req.body.endereco
    , fields 
    }
    gitlog(repositorio, (error, commits) => {
      if (error) console.log(error);
      res.json(commits);
      res.end();
    });
  } 

  if (req.body.tipo == 1) {
    var commit;
    var hash = req.body.hash;
    var repositorio = { repo: req.body.endereco
      , fields
    }
    gitlog(repositorio, (error, commits) => {
      if (error) console.log(error);
      for (var i in commits) {
        if (commits[i].hash == hash || commits[i].abbrevHash == hash) {
          res.json(commits[i]);
          res.end();
        }
      } 
    }); 
  }
});

app.post('/pesquisar', (req, res) => {
  var pk = req.body.pk;
  var inicio = req.body.inicio;
  var fim = req.body.fim;
  var query_endereco_repositorio = "SELECT nome, endereco FROM repositorios WHERE pk="+pk;
  var connection = banco.conectar();

  if (pk !== "0") {
    connection.query(query_endereco_repositorio, function(err, repo, fields) {
        if (err) console.log(err);
        getRepositorio(repo[0]['endereco'], inicio, fim, res);
        connection.destroy();
    });
  } 

});

function getRepositorio(endereco, inicio, fim, res){
  var after = inicio + " 00:00";
  var before = fim + " 23:59";
  var repositorio = { repo: endereco, after: after, before: before
    , fields 
    }
    gitlog(repositorio, (error, commits) => {
      if (error) console.log(error);
      res.json(commits)
    });
    
}
 
app.get('/repositorios', (req, res) => {
  var query_repositorios = "SELECT pk, nome, endereco FROM repositorios";
  var connection = banco.conectar();
  connection.query(query_repositorios, function(err, repositorios, fields) {
      if (err) console.log(err);
      res.json(repositorios);
      res.end();
      connection.destroy();
  });
});


app.post('/nomeRepositorio', (req, res) => {
  var connection = banco.conectar();
  var query_nome_repositorio = "SELECT nome,endereco FROM repositorios where pk =";
  query_nome_repositorio += req.body.pk;
  connection.query(query_nome_repositorio, function(err, dados, fields){
      if (err) console.log(err);
      res.json(dados);
      res.end();
      connection.destroy();
  });
});

app.post('/planilha', (req, res) => {

  var workbook = new Excel.Workbook();
  var worksheet = workbook.addWorksheet('Repositorios');
  worksheet.columns = [
      { header: 'Sistema', key: 'sistema', width: 32 },
      { header: 'Hash', key: 'hash', width: 10 },
      { header: 'Data', key: 'data', width: 15},
      { header: 'Hora', key: 'hora', width: 15},
      { header: 'Autor', key: 'autor', width: 20},
      { header: 'Mensagem', key: 'mensagem', width: 100},
      { header: 'arquivos', key: 'arquivos', width: 100}
  ]

  var pk = req.body.pk;
  
  var inicio = req.body.inicio;
  var fim = req.body.fim;

  if ( pk != 0) {
    getDadosRepositorio(pk, inicio, fim, workbook, worksheet, res);     
  } else {
    getDadosAllRepositorios(inicio, fim, workbook, worksheet, res);
  }

});


function getDadosRepositorio(pk, inicio, fim, workbook, worksheet, res) {
  var connection = banco.conectar();
  var query_nome_repositorio = "SELECT nome,endereco FROM repositorios where pk ="+pk;
  connection.query(query_nome_repositorio, function(err, data, fields){
      if (err) console.log(err);
      commitsEntreDatas(data[0], inicio, fim, worksheet);
      setTimeout(function() {
        gravarPlanilha(worksheet,workbook, res);
      }, 5000);
      connection.destroy();
  });
}

function getDadosAllRepositorios(inicio, fim, workbook, worksheet, res) {
   var connection = banco.conectar();
  var query_nome_repositorio = "SELECT nome,endereco FROM repositorios";
  connection.query(query_nome_repositorio, function(err, data, fields){
    if (err) console.log(err);
    data.forEach(item => {
      commitsEntreDatas(item, inicio, fim, worksheet)
    });
    setTimeout(function() {
      gravarPlanilha(worksheet,workbook, res);
    }, 5000);
    connection.destroy();
  });
}

function commitsEntreDatas(reposit, inicio, fim, worksheet) {
  var after = inicio + " 00:00";
  var before = fim + " 23:59";
  var repositorio = { repo: reposit.endereco, after: after, before: before
    , fields 
  }
  gitlog(repositorio, (error, commits) => {
    if (error) console.log(error);
    commits.forEach( commit => {
      var explodeData = (commit.authorDate).split(" ");
      var data = new Date(explodeData[0]);
      var hora = explodeData[1];
      if (commit.files) {
        commit.files.forEach( file => {
          worksheet.addRow({sistema: reposit.nome, hash: commit.abbrevHash, data: data, hora: hora, autor: commit.authorName, mensagem: commit.subject, arquivos: file}); 
        });
      } else {
         worksheet.addRow({sistema: reposit.nome, hash: commit.abbrevHash, data: data, hora: hora, autor: commit.authorName, mensagem: commit.subject, arquivos: commit.files});
      }
    });
  });
}

function gravarPlanilha(worksheet, workbook, res) {
  worksheet.getColumn(1).alignment = { vertical: 'middle', horizontal: 'center'};
  worksheet.getColumn(2).alignment = { vertical: 'middle', horizontal: 'center'};
  worksheet.getColumn(3).alignment = { vertical: 'middle', horizontal: 'center'};
  worksheet.getColumn(4).alignment = { vertical: 'middle', horizontal: 'center'};
  worksheet.getColumn(5).alignment = { vertical: 'middle', horizontal: 'center'};
  worksheet.getColumn(6).alignment = { wrapText: true,  vertical: 'middle', horizontal: 'left'};
  worksheet.getColumn(7).alignment = { wrapText: true,  vertical: 'middle', horizontal: 'left' };
  worksheet.eachRow(function(row, rowNumber) {
    row.eachCell(function(cell, colNumber) {
      cell.border = {
          top: {style:'thin'},
          left: {style:'thin'},
          bottom: {style:'thin'},
          right: {style:'thin'}
      };
    });
  });
  workbook.xlsx.writeFile("C://teste//repositorios.xlsx")
  .then(function() {
      console.log("gravou")
      res.json({planilha: "ok"})
  });
}

//app.use('/', app);