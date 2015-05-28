var path = require('path');
var http = require('http');
var express = require('express');
var logger = require('morgan');
var serveStatic = require('serve-static');
var ImapQuery = require('imap-query');
var config = require('../config');

var imap_query = new ImapQuery(config.imap, [
    ['SUBJECT', 'received'],
    'ALL'
]);

var emails = [];
var checkEmails = function(){
    imap_query.check(function(error, updated){
        console.log('paypal-envelopes: imap_query.check(error, updated)', error, updated);
        if (error){handleError(error); return;}
        if (!updated){return;}
        emails = imap_query.messages().map(function(message){
            return message;
        });
    });
};
checkEmails();
setInterval(checkEmails, 1000*60*config.interval);

var app = express();
app.use(logger('dev'));
app.use(serveStatic(path.join(__dirname, '../client/build')));
app.get('/api/emails', function(req, res){
    res.send(emails);
});

var server = http.createServer(app);
var port = parseInt(process.env.PORT, 10) || 3000;
server.listen(port);

server.on('error', handleError);

server.on('listening', function(){
    console.log('Listening on port ' + server.address().port);
});

function handleError(error){
    console.error(error);
}