const { url } = require("inspector");
const net = require("net");
const fs = require('fs');
const path = require("path");
const { get, METHODS } = require("http");
const { CompressionStream } = require("stream/web");
const args = process.argv;
const zlib = require('zlib')


let directory = '';

const dirIndex = args.indexOf('--directory');
if (dirIndex > -1 && args[dirIndex + 1]) {
  directory = args[dirIndex + 1];
  console.log(`using the directory: ${directory}`)
}

console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.setKeepAlive(true);
  let requestBuffer = '';

  socket.on("data", (data) => {
    // Add incoming data to our buffer
    requestBuffer += data.toString();

    // Start a loop to process one or more requests that might be in the buffer
    while (true) {
      // Check if we have the end of the headers yet
      const endOfHeadersIndex = requestBuffer.indexOf('\r\n\r\n');
      if (endOfHeadersIndex === -1) {
        break;
      }

      // --- We have headers, now check for Content-Length to see if we need a body ---
      const headersString = requestBuffer.substring(0, endOfHeadersIndex);
      let contentLength = 0;
      const contentLengthMatch = headersString.match(/Content-Length:\s*(\d+)/i);

      if (contentLengthMatch) {
        contentLength = parseInt(contentLengthMatch[1], 10);
      }

      // Check if the full request (headers + body) has arrived
      const totalRequestLength = endOfHeadersIndex + 4 + contentLength;
      if (requestBuffer.length < totalRequestLength) {
        break;
      }

      // --- We have a full request! ---
      // Extract the complete request string
      const requestString = requestBuffer.substring(0, totalRequestLength);

      requestBuffer = requestBuffer.substring(totalRequestLength);

      console.log("Processing request: \n", requestString);

      const lines = requestString.split("\r\n");
      const requestLine = lines[0];

      if (!requestLine) {
        continue;
      }

      const parts = requestLine.split(" ");

      if (parts.length < 2) {
        socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
        continue;
      }

      let urlPath = parts[1];
      const headers = {};

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line === "") {
          break;
        }
        const [headerName, headerValue] = line.split(": ");
        if (headerName && headerValue) {
          headers[headerName.toLowerCase()] = headerValue;
        }
      }

      const closeConnection = (headers['connection']&&headers['connection'].toLowerCase === 'close')
      
      if (urlPath === '/' || urlPath === '/index.html') {
        console.log("sending 200 OK");
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
      }
      else if (urlPath.startsWith('/echo/')) {
        const echoString = urlPath.substring(6);
        console.log(echoString);

        const encodingHeader = headers['accept-encoding'] || '';
        const clientEncodings = encodingHeader.split(",").map(s => s.trim());
        console.log(clientEncodings);
        const zipEncoding = clientEncodings.includes('gzip');

        if (zipEncoding) {
          const compressedBody = zlib.gzipSync(echoString);
          socket.write(`HTTP/1.1 200 OK\r\nContent-Encoding: gzip\r\nContent-Type: text/plain\r\nContent-Length: ${compressedBody.length}\r\n\r\n`);
          socket.write(compressedBody);
        } else {
          const contentLength = Buffer.byteLength(echoString);
          socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${echoString}`);
        }
      }
      else if (urlPath.startsWith('/files/')) {
        const fileString = urlPath.substring(7);
        const fullPath = path.join(directory, fileString);
        console.log(`this is the fullpath: ${fullPath}`);

        try {
          if (parts[0] === "GET") {
            const stats = fs.statSync(fullPath);
            const byteSize = stats.size;
            const fileContents = fs.readFileSync(fullPath);
            let content_type = 'application/octet-stream';
            let content_Length = byteSize;
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type:${content_type}\r\nContent-Length:${content_Length}\r\n\r\n`);
            socket.write(fileContents);

          } else if (parts[0] === "POST") {
            // Find the body part of this specific request
            const bodyContent = requestString.substring(endOfHeadersIndex + 4);
            fs.writeFileSync(fullPath, bodyContent);
            socket.write(`HTTP/1.1 201 Created\r\n\r\n`);
          }
        } catch (error) {
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
      }
      else if (urlPath === '/user-agent') {
        const agentString = headers['user-agent'] || '';
        console.log(agentString);
        let content_type = 'text/plain';
        let content_Length = Buffer.byteLength(agentString);
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: ${content_type}\r\nContent-Length: ${content_Length}\r\n\r\n${agentString}`);
      }
      
      else {
        console.log("sending 404 Not Found");
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
      if(closeConnection){
        socket.end();
        break;
      }
    } 

  });

  socket.on("close", () => {
    console.log("connection closed");
  });

  socket.on("error", (err) => {
    console.log("socket error: ", err.message);
  });
});

server.listen(4221, "localhost", () => {
  console.log("Server listening on http://localhost:4221");
});