const express = require('express');
const app = express();
const configRoutes = require('./routes');
const routeNum = '8080'
//Loads the handlebars module
const session = require('express-session');
const cors = require('cors');
var uuid = require('uuid');
app.use(cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
});
app.use(session({secret: uuid.v4()}));
app.use(express.json());

//-------------------------------------------------------------//
configRoutes(app)
//-------------------------------------------------------------//

app.listen(process.env.PORT || '8888', function () {
    console.log(`TC-API is listening on port ${routeNum}.`);
  });