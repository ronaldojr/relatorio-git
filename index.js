let app = require('./main/app')
let dateFormat  = require('dateformat')

app.listen(3000, () => {
	var date = dateFormat(new Date(), "dd-mm-yyyy HH:MM:ss")
    console.log('[' + date + '] - ' + 'Servidor relatorio-git online na porta 3000')
});
