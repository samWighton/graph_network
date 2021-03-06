const dgram = require('dgram');
const message = Buffer.from('get_all_edges hiive_hiive staff 1000 manages');
const socket = dgram.createSocket('udp4');

var PORT = 33333; // port that the node server is listening on
var RUST_PORT = 34254; // port that the rust server is listening on
var HOST = '127.0.0.1';

let allSockets = [];

socket.on('listening', function () {
	var address = socket.address();
	console.log('Node Server listening on ' + address.address + ":" + address.port);
});

socket.on('message', function (message, remote) {
	console.log(remote.address + ':' + remote.port +' - ' + message);
	allSockets.forEach(function(socket){
		console.log('sending to ' + socket);
		socket.send(JSON.stringify({new_data : JSON.parse(message, 'utf8')}));
	});
});

socket.bind(PORT, HOST);

function send_request(request_string) {
	console.log('sending request: ', request_string)
	var request_buffer = Buffer.from(request_string);
	socket.send(request_buffer, RUST_PORT, 'localhost', (err) => {
		//socket.close();
	});
}

// send_request('get_all_edges staff 1000');
// send_request('get_edges staff 1000 manages');

const WebSocketServer = require('ws').Server;
const express = require('express');
const app = express();
const fs = require('fs');
const md5 = require('md5');
var server = require('http').createServer();
app.use(express.static('public'));

const wss = new WebSocketServer({server: server});
wss.on('connection', function (ws) {
	allSockets.push(ws);
	console.log('connection from client');
	const data = JSON.parse(fs.readFileSync('resources/objects.json', 'utf8'));
	Object.keys(data).forEach((table) => {
		const objectsForTable = data[table];
		Object.keys(objectsForTable).forEach((objectID) => {
			let object = objectsForTable[objectID];
			if (object.email) {
				object.md5 = md5(object.email);
			}
		});
	});
	ws.send(JSON.stringify({ init_data: data }));
	send_request('get_all_edges staff 1000');
});

server.on('request', app);
server.listen(3000, () => {
	console.log('Listening http://localhost:3000');
});
