var express = require('express')
  , routes = require('./routes')
  , bodyParser = require('body-parser')

var app = express();

  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded());
  app.use(express.static(__dirname + '/'));

app.use('/', routes.index);

app.listen(3000);
