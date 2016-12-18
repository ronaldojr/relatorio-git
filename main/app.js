let express = require('express');
let app = express();
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const consign = require('consign');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator());

app.use("*",  (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

consign()
    .include('./config/banco.js')
    .then('./main/models')
    .then('./main/controllers')
    .then('./config/routes.js')
    .into(app)

module.exports = app;
