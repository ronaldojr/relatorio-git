require('../relatorio-git')
var banco = require('../banco')
var app = require('../app')
var client = require('supertest')(app)
var expect = require('chai').expect

describe('Relatorio', () => {
	before(done => { // need to be refactored to DAO pattern!
		let repo = {
			nome: 'minhas-financas-java-rest-api',
			endereco: 'https://github.com/RobHawk90/minhas-financas-java-rest-api.git'
		}

		let connection = banco.conectar()

		connection.query('INSERT INTO repositorios SET ?', repo, (exception, result) => {
			if(exception) console.log(exception)
			done()
		})
	})

	it('GET list of repositories', done => {
		client.get('/repositorios')
			.end((err, res) => {
				let repositorios = res.body

				expect(repositorios.length).to.equal(1)
				expect(repositorios[0].nome).to.contains('java-rest-api')
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

	after(done => {
		let connection = banco.conectar()

		connection.query('TRUNCATE repositorios', (exception, result) => {
			if(exception) console.log(exception)
			done()
		})
	})
})