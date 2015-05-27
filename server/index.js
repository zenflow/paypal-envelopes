var path = require('path');
var http = require('http');
var express = require('express');
var logger = require('morgan');
var serveStatic = require('serve-static');

var app = express();
app.use(logger('dev'));
app.use(serveStatic(path.join(__dirname, '../client/build')));

var server = http.createServer(app);
var port = parseInt(process.env.PORT, 10) || 3000;
server.listen(port);

server.on('error', function(error){
    throw error;
});

server.on('listening', function(){
    console.log('Listening on port ' + server.address().port);
});