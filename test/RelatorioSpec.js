var app = require('../main/app')
var client = require('supertest')(app)
var expect = require('chai').expect

var dirname = process.cwd()

describe('Controllers', () => {
  before(done => {
    let repos = [
      { pk: 1, nome: 'relatorio-git', endereco: dirname },
      { pk: 2, nome: 'fake-git', endereco: 'fake-error' }
    ]

    var dao = new app.main.models.RepoDao()

    let promises = repos.map(repo => { return dao.insert(repo) })

    Promise.all(promises).then(() => done()).catch(done)
  })

  it('GET commits list from repo', done => {
    client.get('/repositorios/1/commits')
      .end((err, res) => {
        let repositorio = res.body
        repositorio.reverse()
        expect(repositorio[0].subject).to.contains('start here')
        expect(res.status).to.equal(200)
        done(err)
      })
  })

  it('GET commits list from repo with out folder', done => {
    client.get('/repositorios/2/commits')
      .end((err, res) => {
        let repositorio = res.body
        expect(repositorio.msg).to.contains('Repo location does not exist')
        expect(res.status).to.equal(404)
        done(err)
      })
  })


  it('GET commits list from invalid repo', done => {
    client.get('/repositorios/3/commits')
      .end((err, res) => {
        expect(res.status).to.equal(404)
        expect(res.body.msg).to.equal('Repositório não encontrado')
        done(err)
      })
  })

  it('GET commit from repo by hash', done => {
    client.get('/repositorios/1/commit/ef07dc4')
      .end((err, res) => {
        let repositorio = res.body
        expect(repositorio.abbrevHash).to.contains('ef07dc4')
        expect(res.status).to.equal(200)
        done(err)
      })
  })

  it('GET commits list from invalid repo with invalid hash', done => {
    client.get('/repositorios/3/commit/1234')
      .end((err, res) => {
        expect(res.status).to.equal(404)
        expect(res.body.msg).to.equal('Repositório não encontrado')
        done(err)
      })
  })

  it('GET commits list from valid repo with invalid hash', done => {
    client.get('/repositorios/1/commit/1234')
      .end((err, res) => {
        expect(res.status).to.equal(404)
        expect(res.body.msg).to.equal('Hash não encontrada')
        done(err)
      })
  })

  it('GET list of repositories', done => {
    client.get('/repositorios')
      .end((err, res) => {
        let repositorios = res.body

        expect(repositorios.length).to.equal(2)
        expect(repositorios[0].nome).to.contains('relatorio-git')
        expect(res.status).to.equal(200)

        done(err)
      })
  })

  it('POST new repo', done => {
    client.post('/repositorios')
      .send({
        nome: 'MySQL-JDBC-Helper',
        endereco: 'https://github.com/RobHawk90/MySQL-JDBC-Helper.git'
      })
      .end((err, res) => {
        let repo = res.body

        expect(res.status).to.equal(201)
        expect(repo.pk).to.exists

        done(err)
      })
  })

  it('recuse POST invalid repo', done => {
    client.post('/repositorios').send({}).expect(400, done)
  })

  it('should validate repos name', done => {
    client.post('/repositorios')
      .send({
        nome: '',
        endereco: 'C:/foo-bar.git'
      })
      .end((err, res) => {
        let validation = res.body[0]

        expect(res.status).to.equal(400)
        expect(validation.msg).to.equal('O campo nome não pode ser vazio.')

        done(err)
      })
  })

  it('should validate repos address', done => {
    client.post('/repositorios')
      .send({
        nome: 'foo-bar',
        endereco: ''
      })
      .end((err, res) => {
        let validation = res.body[0]

        expect(res.status).to.equal(400)
        expect(validation.msg).to.equal('O campo endereço não pode ser vazio.')

        done(err)
      })
  })

  it('GET commits list from repo by pk', done => {
    client.get('/repositorios/dados/1')
    .end((err, res) => {
      expect(res.status).to.equal(200)
      expect(res.body[0].nome).to.equal('relatorio-git')
      expect(res.body[0].endereco).to.equal(dirname)
      done(err)
    })
  })

  it('GET commits list from invalid repo by pk', done => {
    client.get('/repositorios/dados/8')
    .end((err, res) => {
      expect(res.status).to.equal(404)
      expect(res.body.msg).to.equal('Repositório não encontrado')
      done(err)
    })
  })


  it('GET commits list with date interval from repo', done => {
    client.get('/repositorios/1/periodo/2016-12-07/2016-12-07')
    .end((err, res) => {
      expect(res.status).to.equal(200)
      done(err)
    })
  })

  it('GET commits list with date interval from inexistent repo ', done => {
    client.get('/repositorios/8/periodo/2016-12-07/2016-12-07')
    .end((err, res) => {
      let repositorio = res.body
      expect(repositorio.msg).to.contains('Repositório não encontrado')
      expect(res.status).to.equal(404)
      done(err)
    })
  })

  it('GET commits list with date interval from repo with out folder', done => {
    client.get('/repositorios/2/periodo/2016-12-07/2016-12-07')
    .end((err, res) => {
      let repositorio = res.body
      expect(repositorio.msg).to.contains('Repo location does not exist')
      expect(res.status).to.equal(404)
      done(err)
    })
  })

  after(done => {
    let connection = app.config.banco.conectar()

    connection.query('TRUNCATE repositorios', (exception, result) => {
      if(exception) console.log(exception)
      done()
    })
  })
})


describe('Only Sheet', () => {

	before(done => {
    let repos = [
      { pk: 1, nome: 'relatorio-git', endereco: dirname },
      { pk: 2, nome: 'relatorio-git', endereco: dirname }
    ]

    var dao = new app.main.models.RepoDao()

    let promises = repos.map(repo => { return dao.insert(repo) })

    Promise.all(promises).then(() => done()).catch(done)
  })

  it('Get sheet by date from all repos', done => {
    client.get('/repositorios/periodo/2016-01-01/2016-12-13/planilha')
  	  .end( (err, res) => {
  	  	expect(res.status).to.equal(200)
  	  	expect(res.headers['content-type']).to.equal('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  	  	done(err)
  	  })
  })

  it('Get sheet by date from pk', done => {
  	client.get('/repositorios/1/periodo/2016-01-01/2016-12-16/planilha')
  	  .end( (err, res) => {
  	  	expect(res.status).to.equal(200)
  	  	expect(res.headers['content-type']).to.equal('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  	  	done(err)
  	  })
  })

  after(done => {
    let connection = app.config.banco.conectar()

    connection.query('TRUNCATE repositorios', (exception, result) => {
      if(exception) console.log(exception)
      done()
    })
  })

})


describe('Error, Sheet!', () => {

  before(done => {
    let repos = [
      { pk: 1, nome: 'relatorio-git', endereco: dirname },
      { pk: 2, nome: 'relatorio-git', endereco: "fake-error" }
    ]

    var dao = new app.main.models.RepoDao()

    let promises = repos.map(repo => { return dao.insert(repo) })

    Promise.all(promises).then(() => done()).catch(done)
  })

  it('Error on get sheet by date from all repos', done => {
    client.get('/repositorios/periodo/2016-01-01/2016-12-13/planilha')
  	  .end( (err, res) => {
  	  	expect(res.status).to.equal(404)
  	  	expect(res.body.msg).to.equal('Repo location does not exist')
  	  	done(err)
  	  })
  })

  it('Error on Get sheet by date from pk', done => {
    client.get('/repositorios/2/periodo/2016-01-01/2016-12-13/planilha')
  	  .end( (err, res) => {
  	  	expect(res.status).to.equal(404)
  	  	expect(res.body.msg).to.equal('Repo location does not exist')
  	  	done(err)
  	  })
  })

  after(done => {
    let connection = app.config.banco.conectar()

    connection.query('TRUNCATE repositorios', (exception, result) => {
      if(exception) console.log(exception)
      done()
    })
  })

})
/*
describe('Delete repo', () => {

  before(done => {
    let repos = [
      { pk: 1, nome: 'relatorio-git', endereco: dirname },
      { pk: 2, nome: 'relatorio-git', endereco: dirname }
    ]

    var dao = new app.main.models.RepoDao()

    let promises = repos.map(repo => { return dao.insert(repo) })

    Promise.all(promises).then(() => done()).catch(done)
  })

  it('Delete repo from pk', done => {
    client.delete('/repositorios/1')
  	  .end( (err, res) => {
  	  	expect(res.status).to.equal(202)
        expect(res.body.msg).to.equal('Accepted')
  	  	done(err)
  	  })
  })

  it('204 on delete invalid repo from pk ', done => {
    client.delete('/repositorios/3')
  	  .end( (err, res) => {
  	  	expect(res.status).to.equal(204)
  	  	done(err)
  	  })
  })



  after(done => {
    let connection = app.config.banco.conectar()

    connection.query('TRUNCATE repositorios', (exception, result) => {
      if(exception) console.log(exception)
      done()
    })
  })

})


describe('Update repo', () => {

  before(done => {
    let repos = [ { pk: 1, nome: 'relatorio', endereco: dirname }
                , { pk: 2, nome: 'relatorio-git-2', endereco: dirname }
                ]

    var dao = new app.main.models.RepoDao()

    let promises = repos.map(repo => { return dao.insert(repo) })

    Promise.all(promises).then(() => done()).catch(done)
  })

  it('Update repo from pk', done => {
    client.put('/repositorios/1')
      .send({ pk: 1
            , nome: 'relatorio-git'
            , endereco: dirname
            })
  	  .end( (err, res) => {
  	  	expect(res.status).to.equal(200)
        expect(res.body.msg).to.equal('OK')
  	  	done(err)
  	  })
  })


  it('204 on update invalid repo from pk ', done => {
    client.put('/repositorios')
  	  .end( (err, res) => {
  	  	expect(res.status).to.equal(404)
  	  	done(err)
  	  })
  })


  after(done => {
    let connection = app.config.banco.conectar()

    connection.query('TRUNCATE repositorios', (exception, result) => {
      if(exception) console.log(exception)
      done()
    })
  })

}) */
