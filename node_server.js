var express = require('express')
  , routes = require('./routes')

var app = express()

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(function(req, res, next) {
    next()
  });
  app.use(app.router);
  app.use(express.static(__dirname + '/'));
});

app.get('/', routes.index);

app.listen(3000);