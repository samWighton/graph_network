const dgram = require('dgram');
const message = Buffer.from('get_all_edges hiive_hiive staff 1000 manages');
const client = dgram.createSocket('udp4');
client.send(message, 34254, 'localhost', (err) => {
	client.close();
});


// var WebSocketServer = require('websocket').server;
// wsServer = new WebSocketServer({
	// httpServer: server
// });
