const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const requestString = data.toString();
    console.log("Received request: \n", requestString);

    const requestLine = requestString.split("\r\n")[0];
    const parts = requestLine.split(" ");

    if (parts.length < 2) {// to make sure the request line is valid if not close the connection
      socket.end()
      return;
    }

    let urlPath = parts[1];


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

    else if(urlPath.startsWith('/user-agent')){
      const agentString = urlPath.substring(11);
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
