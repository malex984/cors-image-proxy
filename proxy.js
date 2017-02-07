#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http'), httpProxy = require('http-proxy'), url = require('url'), request = require('request');

function processRequest(req, res, proxy, new_req){ //  console.log(new_req);
  req.url = new_req.path;
  req.headers.host = new_req.host;
  res.oldWriteHead = res.writeHead;
  res.writeHead = function(statusCode, headers) {
    res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Credentials', true); res.oldWriteHead(statusCode, headers);
  }
  try{
    proxy.proxyRequest(req, res, { host: req.headers.host.split(":")[0], port: parseInt(req.headers.host.split(":")[1]) || 80 });
  }catch(err){
    console.log(err);
  }
}

httpProxy.createServer(function (req, res, proxy) {
  var url_path = req.url.slice(1);
  if(url_path == "crossdomain.xml"){ proxy.proxyRequest(req, res, { host: '127.0.0.1', port: 9000 }); }
  else{
   new_req = url.parse("http://" + url_path); // NOTE: main limitation!!!
   processRequest(req, res, proxy, new_req);
  }
}).listen(9999, function() { console.log((new Date()) + ' CORS Proxy is listening on port 9999'); });

http.createServer(function (req, res) { 
  res.writeHead(200, { 'Content-Type': 'text/xml' }); res.write('<?xml version="1.0"?>\n<!DOCTYPE cross-domain-policy SYSTEM "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">\n<cross-domain-policy>\n<allow-access-from domain="*" />\n</cross-domain-policy>\n');  res.end();
}).listen(9000, function() { console.log((new Date()) + ' HTTP Server is listening on port 9000'); });

process.on('uncaughtException', function(e){  console.log(e); });

var server = http.createServer(function(request, response) { 
  console.log((new Date()) + ' Received request for ' + request.url); 
  response.writeHead(404); response.end();
}); server.listen(7070, function() { console.log((new Date()) + ' (dumb) HTTP Server is listening on port 7070'); });

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' WS Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' WS Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
//            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
//            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' WS Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

