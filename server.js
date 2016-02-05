var tivo = require('tivo'),
	http = require('http'),
	express = require('express'),
	WebSocketServer = require('ws').Server;

var app = express(),
	server = http.createServer(app),
	wss = new WebSocketServer({ server: server }),
	filename = 'testEvents.json',
	conString = 'postgres://beaucronin:Mfw1bas1@events-test.cmusm4olucdj.us-west-2.rds.amazonaws.com/events';

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname+'/static/'));
app.listen(app.get('port'), function() { console.log('listening dude')});

server.listen(8080);

wss.on('connection', function(ws) {
	var reader = new tivo.readers.FileReader(filename),
	// var reader = new tivo.readers.PGReader(conString, 'enron_events'),
		writer = new tivo.writers.WebSocketWriter(ws),
		controller = new tivo.Controller(reader, writer);

	ws.on('close', function() {
		console.log('websocket closed');
	});

	ws.on('message', function(data, flags) {
		obj = JSON.parse(data);
		console.log(obj);
		if ('command' in obj)
			controller.executeCommand(obj);
	});

	ws.on('error', function(err) {
		console.log(err);
	});
});

