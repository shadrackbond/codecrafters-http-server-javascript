const { url } = require("inspector");
const net = require("net");
const fs = require('fs');


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

    //what if I have a variable which equals /echo/{str} then i can pass the abc as the string

    else if (urlPath.startsWith('/echo/')) {
      //let thirdPart = urlPath.split('/');
      const echoString = urlPath.substring(6);//gives everything from the 6th character to the end of the string
      console.log(echoString);
      content_type = 'text/plain';
      content_Length = echoString.length;
      socket.write(`HTTP/1.1 200 OK\r\nContent-Type: 
        ${content_type}\r\nContent-Length: 
        ${content_Length}\r\n\r\n${echoString}`
      )
    }

    else if(urlPath.startsWith('/files/')){
      const fileString = urlPath.substring(7);
      console.log(fileString);
      try{
        const stats = fs.statSync(fileString);
        const byteSize =stats.size;
        const fileContents = fs.readFileSync(fileString);
        content_type = 'application/octet-stream';
        content_Length = byteSize;
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type:${content_type}\r\nContent-Length:${content_Length}\r\n\r\n${fileContents}`
        )
        socket.end()
      }
      catch(error){
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        socket.end();
      }
    }
      // if(byteSize== ""){
      //   socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      // }
      // else{
      //   content_type = 'application/octet-stream';
      //   content_Length = byteSize;
      //   socket.write(`HTTP/1.1 200 OK\r\nContent-Type: 
      //   ${content_type}\r\nContent-Length: 
      //   ${content_Length}\r\n\r\n${byteSize}`
      //   )
      

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

    socket.end()// closing the connection after sending the response
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
