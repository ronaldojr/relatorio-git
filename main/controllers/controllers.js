const gitlog = require('gitlog')
const Excel = require('exceljs')
const tempfile = require('tempfile')


module.exports = app => {
  let dao = new app.main.models.RepoDao()

  let fields =
    [ 'hash'
    , 'abbrevHash'
    , 'subject'
    , 'authorName'
    , 'authorDate'
    , 'body'
    ]

  let controller = {}


  controller.listAllRepo = (req, res) => {
    dao.listAll()
      .then( repos => res.json(repos) )
      .catch( err => console.log(err) )
  }


  controller.saveRepo = (req, res) => {
    req.checkBody('nome','O campo nome não pode ser vazio.').notEmpty()
    req.checkBody('endereco','O campo endereço não pode ser vazio.').notEmpty()

    let error = req.validationErrors()

    if (error) {
      res.status(400).send(error)
      return
    }

    dao.insert(req.body)
      .then( result => res.status(201).json({'pk': result.insertId}) )
      .catch( err => console.log(err) )
  }


  controller.getInfoByPk = (req, res) => {
    dao.getDadosRepoFromPk(req.params.pk)
      .then( dados => {
        if (!dados[0]) {
          res.status(404).send({msg: 'Repositório não encontrado'})
          return
        }
        else res.json(dados)
      })
      .catch( err => console.log(err) )
  }


  controller.getCommitsByPk = (req, res) => {
    dao.getDadosRepoFromPk(req.params.pk)
      .then(dados => {

        if (!dados[0]) {
          res.status(404).send({msg: 'Repositório não encontrado'})
          return
        }

        let repositorio =
          { number: 10000
          ,repo: dados[0]['endereco']
          , fields
          }

        return Promise.all([dados,getCommits(repositorio)])

      })
      .then(promiseArray => res.json(promiseArray[1]))
      .catch( err => {

        if (res.statusCode != 404) {
          res.status(404).send({msg: 'Repo location does not exist'})
        }

      })
  }


  controller.getCommitByHash = (req, res) => {
    dao.getDadosRepoFromPk(req.params.pk)
      .then( dados => {

        if (!dados[0]) {
          res.status(404).send({msg: 'Repositório não encontrado'})
          return
        }

        let repositorio =
          { number: 10000
          , repo: dados[0]['endereco']
          , fields
          }

        return Promise.all([dados, getCommits(repositorio)])

      })
      .then(promiseArray => {return promiseArray[1]})
      .then(commits => {

        let hashNotFound = true

        commits.forEach( commit => {

          let hash = commit.hash == req.params.hash
          let abbrevHash = commit.abbrevHash == req.params.hash

          if ( ( hash || abbrevHash ) && hashNotFound == true) {
            hashNotFound = false
            res.json(commit)
          }

        })

        if (hashNotFound) {
          res.status(404).send({msg: 'Hash não encontrada'}).end()
        }

      })
      .catch( err => {

        if (res.statusCode != 404) {
          res.status(404).send({msg: 'Repo location does not exist'})
        }

      })
  }


  controller.getCommitsByDate = (req, res) => {
    dao.getDadosRepoFromPk(req.params.pk)
      .then( dados => {

        if (!dados[0]) {
          res.status(404).send( {msg: 'Repositório não encontrado'} )
          return
        }

        let repositorio =
          { number: 10000
          , repo: dados[0]['endereco']
          , after: req.params.inicio + ' 00:00'
          , before: req.params.fim + ' 23:59'
          , fields
          }

        return Promise.all([dados, getCommits(repositorio)])

      })
      .then(promiseArray => res.json(promiseArray[1]))
      .catch(err => {

        if (res.statusCode != 404) {
          res.status(404).send({msg: 'Repo location does not exist'})
        }

      })
  }


  controller.getSheetByDateAndPk = (req, res) => {
    let workbook = new Excel.Workbook()
    makeSheet(workbook)
      .then( worksheet => {
        createSheetOneRepo( req.params.pk
                          , req.params.inicio
                          , req.params.fim
                          , workbook
                          , worksheet
                          , res
                          )
      })
  }


  controller.getSheetByDateFromAllRepos = (req, res) => {
    let workbook = new Excel.Workbook()
    makeSheet(workbook)
      .then( worksheet => {
        createSheetAllRepo( req.params.inicio
                          , req.params.fim
                          , workbook
                          , worksheet
                          , res
                          )
      })
  }


  function makeSheet (workbook) {
    return new Promise( (fulfill,reject) => {
      let worksheet = workbook.addWorksheet('Repositorios')
      worksheet.columns =
        [ { header: 'Sistema', key: 'sistema', width: 32 }
        , { header: 'Hash', key: 'hash', width: 10 }
        , { header: 'Data', key: 'data', width: 15}
        , { header: 'Hora', key: 'hora', width: 15}
        , { header: 'Autor', key: 'autor', width: 20}
        , { header: 'Mensagem', key: 'mensagem', width: 100}
        , { header: 'arquivos', key: 'arquivos', width: 100}
        ]
      if (!worksheet) reject('create sheet error')
      else fulfill(worksheet)
    })
  }


  function getCommits (repositorio) {
    return new Promise( (fulfill, reject) => {
      gitlog(repositorio, (error, commits) => {
        if (error) reject(error)
        else fulfill(commits)
      })
    })
  }


  function createSheetOneRepo (pk, inicio, fim, workbook, worksheet, res) {
    dao.getDadosRepoFromPk(pk)
      .then( dados => {

        if (!dados[0]) {
          res.status(404).send({msg: 'Repositório não encontrado'})
          return
        }

        return Promise.all([ dados, insertRowSheetByDate( dados[0], inicio, fim, worksheet)])

      })
      .then(arrayPromise => {return arrayPromise[1]})
      .then(worksheet => saveSheetAndDownload(worksheet,workbook, res))
      .catch( err => {

        if (res.codeStatus != 404) {
          res.status(404).send( {msg: 'Repo location does not exist'} )
        }

      })
  }


  function createSheetAllRepo (inicio, fim, workbook, worksheet, res) {
    dao.listAll()
      .then( repos => {

        let rows = repos.map( repo => { return insertRowSheetByDate( repo, inicio, fim, worksheet ) })
        
        return Promise.all(rows)  
      })
      .then(() => {

        saveSheetAndDownload(worksheet, workbook, res)

      })
      .catch( err => {

        if (res.statusCode != 404) {
          res.status(404).send( {msg: 'Repo location does not exist'} )
        }

      })
  }


  function insertRowSheetByDate (reposit, inicio, fim, worksheet) {
    return new Promise ( (fulfill, reject) => {
      let after = inicio + ' 00:00'
      let before = fim + ' 23:59'
      let repositorio =
        { number: 10000
        , repo: reposit.endereco
        , after: after
        , before: before
        , fields
        }
      gitlog(repositorio, (error, commits) => {
        if (error) reject(error)
        commits.forEach( commit => {
          let explodeData = (commit.authorDate).split(' ')
          let data = new Date(explodeData[0])
          let hora = explodeData[1]
          if (commit.files) {
            commit.files.forEach( file => {
              worksheet.addRow(
                { sistema: reposit.nome
                , hash: commit.abbrevHash
                , data: data
                , hora: hora
                , autor: commit.authorName
                , mensagem: commit.subject
                , arquivos: file
                })
            })
          } else {
            worksheet.addRow(
              { sistema: reposit.nome
              , hash: commit.abbrevHash
              , data: data
              , hora: hora
              , autor: commit.authorName
              , mensagem: commit.subject
              , arquivos: commit.files
              })
          }
        })
        fulfill(worksheet)
      })
    })
  }


  function saveSheetAndDownload (worksheet, workbook, res) {
    worksheet.getColumn(1).alignment = { vertical: 'middle', horizontal: 'center'}
    worksheet.getColumn(2).alignment = { vertical: 'middle', horizontal: 'center'}
    worksheet.getColumn(3).alignment = { vertical: 'middle', horizontal: 'center'}
    worksheet.getColumn(4).alignment = { vertical: 'middle', horizontal: 'center'}
    worksheet.getColumn(5).alignment = { vertical: 'middle', horizontal: 'center'}
    worksheet.getColumn(6).alignment = { wrapText: true,  vertical: 'middle', horizontal: 'left'}
    worksheet.getColumn(7).alignment = { wrapText: true,  vertical: 'middle', horizontal: 'left' }
    worksheet.eachRow( (row, rowNumber) => {
      row.eachCell( (cell, colNumber) => {
        cell.border =
          { top: {style:'thin'}
          , left: {style:'thin'}
          , bottom: {style:'thin'}
          , right: {style:'thin'}
          }
      })
    })
    let tempFilePath = tempfile('.xlsx')
    workbook.xlsx.writeFile(tempFilePath)
      .then( () => {
        res.sendFile(tempFilePath, err => {
          if (err) console.log('error on downloading .xlsx file')
        })
      })
  }

  return controller

}
