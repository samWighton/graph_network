const dgram = require('dgram');
const message = Buffer.from('hiive_hiive collection 345');
const client = dgram.createSocket('udp4');
client.send(message, 34254, 'localhost', (err) => {
	  client.close();
});
