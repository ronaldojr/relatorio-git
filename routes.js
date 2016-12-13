module.exports = app => {

  app.get('/repositorios', app.controllers.listAllRepo)
     .post('/repositorios', app.controllers.saveRepo)
     .get('/repositorios/dados/:pk', app.controllers.getInfoByPk)
     .get('/repositorios/:pk/commits', app.controllers.getCommitsByPk)
     .get('/repositorios/:pk/commit/:hash', app.controllers.getCommitByHash)
     .get('/repositorios/:pk/periodo/:inicio/:fim', app.controllers.getCommitsByDate)
     .get('/repositorios/:pk/periodo/:inicio/:fim/planilha', app.controllers.getSheetByDateAndPk)
     .get('/repositorios/periodo/:inicio/:fim/planilha', app.controllers.getSheetByDateFromAllRepos)
     
}

