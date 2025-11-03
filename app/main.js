const net = require("net");
const path = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// TODO: Uncomment the code below to pass the first stage
const server = net.createServer((socket) => {
  socket.on("connect", () => {
  });
  const urlPath = window.location.protocol + "//" + window.location.host + window.location.pathname;
  console.log(urlPath);
  if(urlPath.includes('index.html')|| urlPath.endsWith('/')){
    socket.write("HTTP/1.1 200 OK\r\n\r\n")
  }
  else{
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n")
  }
  
});



server.listen(4221, "localhost");
