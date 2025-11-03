const net = require("net");
const path = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const requestString = data.toString();
    console.log("Received request: \n", requestString);

    const requestLine = requestString.split("\r\n"[0]);
    const parts = requestLine.split(" ");

    if(parts.length < 2){// to make sure the request line is valid if not close the connection
      socket.end()
      return;
    }

    const urlPath = parts[1];

    if(urlPath === '/' || urlPath === '/index.html'){
      console.log("sending 200 OK")
      socket.write("HTTP/1.1 200 OK\r\n\r\n")
    }
    else{
      console.log("sending 404 Not Found");
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n")
    }

    socket.end()// closing the connection after sending the response
  });
  socket.on("close", () =>{
    console.log("connection closed");
  });

  socket.on("error", (err) =>{
    console.log("socket error: ", err.message)
  })
});



server.listen(4221, "localhost", ()=>{
  console.log("Server listening on http://localhost:4221")
});
