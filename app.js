const http = require('http');

http.createServer(function (req, res) {
	res.write('otw to becoming a fullstack engineer');
	res.end();
}).listen(3000);

console.log('Server is running on port 3000');
