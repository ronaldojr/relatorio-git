var app = require('../app') // use consign to inject dependencies!
var client = require('supertest')(app)
var expect = require('chai').expect

var dirname = process.cwd()

describe('Relatorio', () => {
	before(done => { // need to be refactored to DAO pattern!
		let repo = {
			nome: 'relatorio-git',
			endereco: dirname
		}

		let connection = app.banco.conectar()

		connection.query('INSERT INTO repositorios SET ?', repo, (exception, result) => {
			if(exception) console.log(exception)
			done()
		})
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
	

	it('GET commits list from invalid repo', done => {
		client.get('/repositorios/2/commits')
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
		client.get('/repositorios/2/commit/1234')
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

				expect(repositorios.length).to.equal(1)
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

	// use express-validator to make it easy
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

	// use express-validator to make it easy
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

	after(done => {
		let connection = app.banco.conectar()

		connection.query('TRUNCATE repositorios', (exception, result) => {
			if(exception) console.log(exception)
			done()
		})
	})
})