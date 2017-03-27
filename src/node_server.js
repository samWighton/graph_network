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
	allSockets.forEach(function(socket){
		socket.send(JSON.stringify({new_data : message}));
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
		let objectTable = data[table];
		Object.keys(objectTable).forEach((objectID) => {
			let object = objectTable[objectID];
			if (object.email) {
				object.md5 = md5(object.email);
			}
		});
	});
	ws.send(JSON.stringify({ init_data: data }));
});

server.on('request', app);
server.listen(3000, () => {
	console.log('Listening http://localhost:3000');
});