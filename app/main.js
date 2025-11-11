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


// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const requestString = data.toString();
    console.log("Received request: \n", requestString);

    // Split the request into lines
    const lines = requestString.split("\r\n");

    // The first line is the request line
    const requestLine = lines[0];
    const parts = requestLine.split(" ");

    if (parts.length < 2) {
      socket.end();
      return;
    }

    let urlPath = parts[1];

    // Parse Headers
    // Create an object to store headers
    const headers = {};
    // Loop through lines starting from the second line (index 1)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Stop when we reach the empty line
      if (line === "") {
        break;
      }

      // Split the line into name and value
      const [headerName, headerValue] = line.split(": ");
      if (headerName && headerValue) {
        // Store in our object (lowercase for easy access)
        headers[headerName.toLowerCase()] = headerValue;
      }
    }

    if (urlPath === '/' || urlPath === '/index.html') {
      console.log("sending 200 OK")
      socket.write("HTTP/1.1 200 OK\r\n\r\n")
    }

    else if (urlPath.startsWith('/echo/')) {
      //let thirdPart = urlPath.split('/');
      const echoString = urlPath.substring(6);//gives everything from the 6th character to the end of the string
      console.log(echoString);
      const encodingHeader = headers['accept-encoding'] || '';
      const clientEncodings = encodingHeader.split(",").map(s => s.trim());
      console.log(clientEncodings);
      const zipEncoding = clientEncodings.includes('gzip');
      if (zipEncoding) {
        const compressedReadableStream = zlib.gzipSync(echoString)
        content_type = 'text/plain';
        content_Length = compressedReadableStream.length;
        //content_encoding = compressedReadableStream;
        socket.write(`HTTP/1.1 200 OK\r\nContent-Encoding:gzip\r\nContent-Type:${content_type}\r\nContent-Length:${content_Length}\r\n\r\n${echoString}`
        )
      }
      else {
        content_type = 'text/plain';
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: 
        ${content_type}\r\n`
        )
      }
      // content_type = 'text/plain';
      // content_Length = echoString.length;
      // socket.write(`HTTP/1.1 200 OK\r\nContent-Type: 
      //   ${content_type}\r\nContent-Length: 
      //   ${content_Length}\r\n\r\n${echoString}`
      // )
    }

    else if (urlPath.startsWith('/files/')) {
      const fileString = urlPath.substring(7);
      console.log(fileString);
      const fullPath = path.join(directory, fileString)
      console.log(`this is the fullpath: ${fullPath}`)
      try {
        if (parts[0] === "GET") {
          const stats = fs.statSync(fullPath);
          const byteSize = stats.size;
          const fileContents = fs.readFileSync(fullPath);
          content_type = 'application/octet-stream';
          content_Length = byteSize;
          socket.write(`HTTP/1.1 200 OK\r\nContent-Type:${content_type}\r\nContent-Length:${content_Length}\r\n\r\n${fileContents}`
          )
        }
        else if (parts[0] === "POST") {
          const splitedRequestLine = requestString.split('\r\n\r\n');
          bodyContent = splitedRequestLine[1];
          fs.writeFileSync(fullPath, bodyContent);
          socket.write(`HTTP/1.1 201 Created\r\n\r\n`
            /*Content-Type:${content_type}\r\nContent-Length:${content_Length}\r\n\r\n${fileContents}*/
          )
        }
      }
      catch (error) {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
    }

    else if (urlPath === '/user-agent') {
      const agentString = headers['user-agent'];
      console.log(agentString);
      content_type = 'text/plain';
      content_Length = agentString.length;
      socket.write(`HTTP/1.1 200 OK\r\nContent-Type: 
        ${content_type}\r\nContent-Length: 
        ${content_Length}\r\n\r\n${agentString}`
      )
    }

    else {
      console.log("sending 404 Not Found");
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n")
    }

    socket.end() // closing the connection after sending the response
  });
  socket.on("close", () => {
    console.log("connection closed");
  });

  socket.on("error", (err) => {
    console.log("socket error: ", err.message)
  })
});



server.listen(4221, "localhost", () => {
  console.log("Server listening on http://localhost:4221")
});
