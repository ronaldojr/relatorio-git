module.exports = app => {

class RepoDao {

  listAll() {
    return this.createPromise('SELECT pk, nome, endereco FROM repositorios')
  }

  getDadosRepoFromPk (pk) {
    return this.createPromise('SELECT nome, endereco FROM repositorios WHERE pk = ?', pk)
  }

  insert(repo) {
    return this.createPromise('INSERT INTO repositorios (nome, endereco) values (?, ?)', [repo.nome, repo.endereco])
  }

  // It would seems cleary if in another file...
  createPromise(query, params) {
    var connection = app.banco.conectar()
    return new Promise( (fulfill, rejection) => {
      connection.query(query, params, (err, result) => {
        if(err) rejection(err)
        else fulfill(result)
        connection.destroy()
      })
    })
  }

}

  return RepoDao
}
