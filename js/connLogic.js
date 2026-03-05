//Use <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

const peer = new Peer();

var gameName = "Battleships";
var maxConns = 1;
var connections = [];
var isHost = false;

//Peer is initialized
peer.on('open', function (id) {
	dispatchEvent(new CustomEvent("peerInit", {detail: {peerId: id}}));
});

//Incoming connect request
peer.on('connection', function (conn) {
	//Return incase of peer not being host or max connections have been reached
	if (connections.length >= maxConns || (!isHost && connections.length > 0)) 
	{ 
		let errCode = isHost ? 1 : 2;
		let msg = isHost ? "Lobby is full." : "Peer is not designated as a host.";
		conn.send({
			type: "error",
			msg: msg,
			code: errCode
		});
		conn.close(); 
		return; 
	}

	//Declare peer as host
	isHost = true;

	SetupConn(conn);

	dispatchEvent(new CustomEvent("peerRecieveConn", {detail: {conn: conn}}));
});

function connect(connCode){
	disconnect();
	SetupConn(peer.connect(connCode, { label: gameName }));
}

function disconnect(){
	isHost = false;

	connections.forEach(connection => {
		if (connection != undefined && connection.open) {
			connection.close();
		}
	});

	connections = [];
}

function kick(connCode){
	if(!isHost){return}
	connections.forEach(connection => {
		if(connection.peer == connCode){
			connection.close()
			connections.splice(connections.indexOf(connection), 1);
		}
	});
}

function SetupConn(conn) {
	connections.push(conn);
	
	conn.on("open", () => {
		dispatchEvent(new CustomEvent("connOpen", {detail: {conn}}));
	});

	conn.on("data", function (data) {
		if(isHost){
			dispatchEvent(new CustomEvent("dataRecievedHost", {detail: {data, conn}}));
		}
		else{
			dispatchEvent(new CustomEvent("dataRecievedClient", {detail: {data, conn}}));
		}
		dispatchEvent(new CustomEvent("dataRecieved", {detail: {data, conn}}));
	});

	conn.on('close', () => {
		if(isHost) {
			connections.splice(connections.indexOf(conn), 1);
			dispatchEvent(new CustomEvent("connClosed", conn));
			return;
		}

		dispatchEvent(new Event("connClosed"));
		connections = [];
	});
}

//Send data to connections.
//if idList is empty, sends data to all connections.
//if idList contains id, sends data to only specified id's unless exclude mode is on.
function sendData(data, idList = [], exclude = false) {
	connections.forEach(connection => {
		if(idList.length > 0){
			if(idList.some(e => e.peer == connection.peer)){
				if(exclude){
					return;
				}
			}
			else if(!exclude){
				return;
			}
		}
		connection.send(data);
	});
}
