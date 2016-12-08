const gitlog = require('gitlog');
const Excel = require('exceljs');

module.exports = app => {
  
   var fields = [ 
      'hash'
      , 'abbrevHash'
      , 'subject'
      , 'authorName'
      , 'authorDate'
      , 'body'
      ] 


//deve retornar lista de commits de um repositório específico
app.get('/repositorios/:pk/commits', (req, res) => {
  req.checkParams('pk', 'Parâmetro pk obrigatório').notEmpty()
  error = req.validationErrors()
  if (error) { res.status(404).send(error); return }
  var dados = getDadosRepoFromPk(req.params.pk, dados => {
    if (!dados[0]) { res.status(404).send({msg: 'Repositório não encontrado'}); return }
    var repositorio = { repo: dados[0]['endereco'] 
        , fields 
      }
    gitlog(repositorio, (error, commits) => {
      if (error) console.log(error)
      res.json(commits)
    });
  })
});

//deve retornar um commit específico de um repositório específico
app.get('/repositorios/:pk/commit/:hash', (req, res) => {
  req.checkParams('pk', 'Parâmetro pk é obrigatório').notEmpty()
  req.checkParams('hash', 'Parâmetro hash é obrigatório').notEmpty()
  error = req.validationErrors()
  if (error) { res.status(400).send(error); return }
  var dados = getDadosRepoFromPk(req.params.pk, dados => {
    if (!dados[0]) { res.status(404).send({msg: 'Repositório não encontrado'}); return }
    var repositorio = { repo: dados[0]['endereco']
      , fields 
    }
    gitlog(repositorio, (error, commits) => {
      if (error) console.log(error)
      var dados_commit = false
      commits.forEach(commit => {
        dados_commit = (commit.hash == req.params.hash || commit.abbrevHash == req.params.hash) ? commit : false 
      })
      if (dados_commit) {
        res.json(dados_commit)
      } else {
        res.status(404).send({msg: 'Hash não encontrada'}).end()
      }
      
    })
  })
})

function getDadosRepoFromPk(pk, callback) {
  var connection = app.banco.conectar()
  var query_endereco_repositorio = "SELECT nome, endereco FROM repositorios WHERE pk=?"
  connection.query(query_endereco_repositorio, [pk],function(err, dados, fields) {
      if (err) console.log(error)
      connection.destroy()
      callback(dados)
  });
}

//repositorios/:pk/periodo/:inicio/:fim
app.post('/pesquisar', (req, res) => {
  var pk = req.body.pk;
  var inicio = req.body.inicio;
  var fim = req.body.fim;
  var query_endereco_repositorio = "SELECT nome, endereco FROM repositorios WHERE pk="+pk;
  var connection = app.banco.conectar();

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
 
 //lista todos os repositórios'
app.get('/repositorios', (req, res) => {
  var query_repositorios = "SELECT pk, nome, endereco FROM repositorios";
  var connection = app.banco.conectar();
  connection.query(query_repositorios, function(err, repositorios, fields) {
      if (err) console.log(err);
      res.json(repositorios);
      connection.destroy();
  });
});

//cadastra um repositorio no banco (nome, endereço')
app.post('/repositorios', (req, res) => {
  req.checkBody('nome','O campo nome não pode ser vazio.').notEmpty()
  req.checkBody('endereco','O campo endereço não pode ser vazio.').notEmpty()
  var error = req.validationErrors();
  if (error) {
    res.status(400).send(error);
    return;
  }
  var connection = app.banco.conectar();
  var query_insert_repositorios = "INSERT INTO repositorios (nome, endereco) values (?,?)";  
  connection.query(query_insert_repositorios, [req.body.nome, req.body.endereco], (exception, result) => {
    if(exception) console.log(exception)
    res.status(201).json({'pk': result.insertId});
    connection.destroy();
  })

});

//deve ser get, listar dados de um repositório específico
//repositorios/:pk
app.post('/nomeRepositorio', (req, res) => {
  req.checkBody('pk','O campo pk não pode ser vazio.').notEmpty()
  var error = req.validationErrors();
  if (error) {
    res.status(400).send(error);
    return;
  }
  var connection = app.banco.conectar();
  var query_nome_repositorio = "SELECT nome,endereco FROM repositorios where pk = ?";
  connection.query(query_nome_repositorio, [req.body.pk] ,function(err, dados, fields){
      if (err) console.log(err);
      res.json(dados);
      connection.destroy();
  });
});


//gera relatório excel de um repositório
//repositorios/:pk/periodo/:inicio/:fim/planilha
//repositorios/periodo/:inicio/:fim/planilha
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
  var connection = app.banco.conectar();
  var query_nome_repositorio = "SELECT nome,endereco FROM repositorios where pk=?";
  connection.query(query_nome_repositorio, [pk],function(err, data, fields){
      if (err) console.log(err);
      commitsEntreDatas(data[0], inicio, fim, worksheet);
      setTimeout(function() {
        gravarPlanilha(worksheet,workbook, res);
      }, 5000);
      connection.destroy();
  });
}

function getDadosAllRepositorios(inicio, fim, workbook, worksheet, res) {
   var connection = app.banco.conectar();
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
}

