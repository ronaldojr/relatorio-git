module.exports = app => {

class RepoDao {

  listAll() {
    return this.createPromise('SELECT pk, nome, endereco FROM repositorios')
  }

  getDadosRepoFromPk (pk) {
    return this.createPromise('SELECT nome, endereco FROM repositorios WHERE pk = ?', pk)
  }

  insert(repo) {
    return this.createPromise('INSERT INTO repositorios (pk, nome, endereco) values (?, ?, ?)', [repo.pk, repo.nome, repo.endereco])
  }

  delete(pk) {
    return this.createPromise('DELETE FROM repositorios WHERE pk = ?', pk)
  }

  update(repo) {
    return this.createPromise('UPDATE repositorios SET nome = ?, endereco = ? WHERE pk = ?', [repo.nome, repo.endereco, repo.pk])
  }


  // It would seems cleary if in another file...
  createPromise(query, params) {
    var connection = app.config.banco.conectar()
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
