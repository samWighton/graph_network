const dgram = require('dgram');
const message = Buffer.from('get_all_edges hiive_hiive staff 1000 manages');
const socket = dgram.createSocket('udp4');

var PORT = 33333; // port that the node server is listening on
var RUST_PORT = 34254; // port that the rust server is listening on
var HOST = '127.0.0.1';

socket.on('listening', function () {
	var address = socket.address();
	console.log('Node Server listening on ' + address.address + ":" + address.port);
});

socket.on('message', function (message, remote) {
	// response received
	// TODO call a function here to send to the web layer
	console.log(remote.address + ':' + remote.port +' - ' + message);
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

