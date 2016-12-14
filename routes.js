module.exports = app => {

  let repoCtrl = app.controllers

  app.get('/repositorios', repoCtrl.listAllRepo)
     .post('/repositorios', repoCtrl.saveRepo)
     .get('/repositorios/dados/:pk', repoCtrl.getInfoByPk)
     .get('/repositorios/:pk/commits', repoCtrl.getCommitsByPk)
     .get('/repositorios/:pk/commit/:hash', repoCtrl.getCommitByHash)
     .get('/repositorios/:pk/periodo/:inicio/:fim', repoCtrl.getCommitsByDate)
     .get('/repositorios/:pk/periodo/:inicio/:fim/planilha', repoCtrl.getSheetByDateAndPk)
     .get('/repositorios/periodo/:inicio/:fim/planilha', repoCtrl.getSheetByDateFromAllRepos)

}
