/* 
	TODO
	- Clean up repeating code blocks
	- Refactoring function variables
	- Fix chat
*/

const actionHeader = $("#gameStateHeader");

let localRe = false;
let onlineRe = false;

function join() {
	let code = window.prompt("Please enter the connect code");
	if (code != "" && code != null) {
		guestUser();
		connecting();
		connect(code);
	}
}

function host() {
	console.log("host");
	hostUser();
	connecting();
	gameOngoing = false;
}

function checkUsername() {
	if ($("#UsernameInput").val() == "") {
		$("#joinBtn").prop('disabled', true);
		$("#hostBtn").prop('disabled', true);
	}
	else {
		$("#joinBtn").prop('disabled', false);
		$("#hostBtn").prop('disabled', false);
	}
}

function disc() {
	disconnect();
	reset();
	resetGame();
	disconnected();
}

function connecting() {
	$("#UsernameInput").attr("readonly", true);
	$("#joinBtn").addClass("hidden");
	$("#hostBtn").addClass("hidden");
	$("#discBtn").removeClass("hidden");
	$("#readyBtn").removeClass("hidden");
	$("#playerJoined").removeClass("hidden");
}

function disconnected() {
	$("#UsernameInput").attr("readonly", false);
	$("#joinBtn").removeClass("hidden");
	$("#hostBtn").removeClass("hidden");
	$("#discBtn").addClass("hidden");
	$("#idText").addClass("hidden");
	$("#readyBtn").addClass("hidden");
	$("#playerJoined").addClass("hidden");
}

function hostUser() {
	$("#idText").removeClass("hidden");
	$("#idText").removeClass("hidden");
	$("#playerJoined").removeClass("hidden");
}

function guestUser() {
	$("#playerJoined").removeClass("hidden");
	$("#playerJoined").text("Connecting");
}

addEventListener("peerInit", (id) => {
	$('#idText').text("Share this connect code:\r\n" + id.detail.peerId);
})

addEventListener("connOpen", () => {
	console.log("connected");
	clearChat();
	if (isHost) {
		$("#playerJoined").text("Player connected.");
		$("#idText").addClass("hidden");
		sendData({
			type: 'init',
			username: $("#UsernameInput").val()
		});
	}
	else {
		$("#playerJoined").text("Connected to player.");
	}
	
	if(isHost && !gameHasStarted && phase == 'wait') {StartGame();}
})

addEventListener("connClosed", () => {
	if (isHost) {
		$("#idText").removeClass("hidden");
		$("#playerJoined").text("Waiting for player..");
		otherUsername = undefined;
		reset();
		return;
	}
	disc();
})

addEventListener("dataRecievedHost", (data) => {
	switch (data.detail.data.type) {
		case "init":
			otherUsername = data.detail.data.username;
			addMessageToChat(`${otherUsername} has joined your game`, "Info", 'Lightgrey')
			break;
		case "readyState":
			onlineReady = data.detail.data.value;
			addMessageToChat(`${otherUsername} is ${onlineReady ? 'ready' : 'no longer ready'}.`, 'Game', 'Lightgrey')
			//if(phase == 'wait'){tryStartGame();}
			if(phase == 'build'){tryBattlePhase();}
			break;
	}
})

addEventListener("dataRecievedClient", (data) => {
	switch (data.detail.data.type) {
		case "init":
			otherUsername = data.detail.data.username;
			sendData({
				type: 'init',
				username: $("#UsernameInput").val()
			});
			addMessageToChat(`You have joined ${otherUsername}'s game`, "Info", 'Lightgrey')
			break;
		case "readyState":
			onlineReady = data.detail.data.value;
			addMessageToChat(`${otherUsername} is ${onlineReady ? 'ready' : 'no longer ready'}.`, 'Game', 'Lightgrey')
			break;
		case "rematch":
			reset();
			runBuildSetup();
			break;
	}
})


addEventListener("dataRecieved", (data) => {
	switch (data.detail.data.type) {
		case "chatMessage":
			addMessageToChat(data.detail.data.msg, otherUsername)
			break;
		case "gameOver":
			board = data.detail.data.board;
			currPlayer = data.detail.data.currPlayer;
			gameOngoing = data.detail.data.gameOngoing;
			winner = data.detail.data.winner;
			drawScreen();
			break;
		case "startGame":
			runBuildSetup();
			break;
		case "battlePhase":
			myTurn = data.detail.data.myTurn;
			runBattleSetup();
			break;
		case "shot":
			if(!myTurn){
				didHit(data.detail.data.x, data.detail.data.y);
			}
			drawScreen();
			break;
		case "hitResult":
			var shot = {
				x: data.detail.data.shot.x,
				y: data.detail.data.shot.y,
				hit: data.detail.data.shot.hit
			}
			if(shot.hit){
				addMessageToChat(`You shot at ${shot.x}${Abc[shot.y - 1]} and hit ${otherUsername}'s ship`, 'Game', 'Lightgrey');
				myTurn = true;
				if(data.detail.data.shot.sunk){
					addMessageToChat(`You have sunk ${otherUsername}'s ${data.detail.data.shot.shipName} ship`, 'Game', 'Lightgrey');
				}
			}
			else{
				addMessageToChat(`You shot at ${shot.x}${Abc[shot.y - 1]} and didn't hit anything`, 'Game', 'Lightgrey');
			}
			myShots.push(shot);
			drawScreen();
			break;
		case 'gameover':
			addMessageToChat(`Winner!<br>You have shot all of ${otherUsername}'s ships and won the game.`, 'Game', 'LightGreen')
			gameOver();
			break;
		case "error":
			$("joinError").text((data.detail.data.code == 1 ? "Failed to join lobby, " : "There was an error trying to connect to peer, ") + data.detail.data.msg);
			$("joinError").removeClass("hidden");
			break;
		case "rematchState":
			onlineRe = data.detail.data.value;
			addMessageToChat(`${otherUsername} has ${onlineRe ? 'requested a rematch' : 'cancelled their rematch request'}.`, 'Game', 'Lightgrey')
			if(isHost){
				tryRematch();
			}
			break;
	}
})

function changeGrid(gridToShow) {
	switch (gridToShow) {
		case 'ocean':
			$('#oceanBtn').prop("disabled", true).addClass("clicked");
			$('#targetBtn').prop("disabled", false).removeClass("clicked");
			currGrid = 'ocean';
			break;
		case 'target':
			$('#oceanBtn').prop('disabled', false).removeClass('clicked');
			$('#targetBtn').prop('disabled', true).addClass('clicked');
			currGrid = 'target';
			break;
	}
	drawScreen();
}

function ready(forcedChange) {
	if(otherUsername == undefined) {return;}
	localReady = !localReady;
	$('#readyBtn').text((localReady ? 'Unready': 'Ready'))
	if(!forcedChange){
		sendData({
			type: 'readyState',
			value: localReady
		});
		addMessageToChat(`You are now ${localReady ? 'ready' : 'no longer ready'}.`, 'Game', 'lightgrey');
	}
	
	if(isHost && gameHasStarted && !forcedChange && phase == 'build') {
		tryBattlePhase();
	}
}

function tryBattlePhase(){
	if(localReady && onlineReady){
		myTurn = (Math.random()>0.5)? true : false;
		runBattleSetup();
		sendData({
			type: 'battlePhase',
			myTurn: !myTurn
		})
	}
}

function StartGame() {
	runBuildSetup();
	sendData({
		type: 'startGame'
	})
}

function runBuildSetup(){
	phase = 'build';
	changeGrid('ocean');
	$(actionHeader).text("Setup Phase");
	addMessageToChat("The setup phase has now begun, setup your ships on the grid and press ready.", "Game", 'Lightgrey')
	$('#readyBtn').prop('disabled', true);
	$('#readyBtn').addClass('clicked');
	onlineReady = false;
	localReady = false;
	gameHasStarted = true;
}

function runBattleSetup(){
	phase = 'battle';
	$(actionHeader).text("Battle Phase");
	
	//Reset and hide ready button
	$('#readyBtn').prop('disabled', false);
	$('#readyBtn').removeClass('clicked');
	$('#readyBtn').addClass('hidden');
	onlineReady = false;
	localReady = true;
	ready(true);

	addMessageToChat(`The battle phase has now begun, ${myTurn ? "you" : otherUsername} will start.`, "Game", 'Lightgrey')
	drawScreen();
}

function rebtn(forcedChange){
	localRe = !localRe;
	$('#rematchBtn').text((localRe ? 'Cancel': 'Rematch'));
	if(!forcedChange){
		sendData({
			type: 'rematchState',
			value: localRe
		});
		addMessageToChat(`You have ${localRe ? 'asked for a rematch' : 'cancelled your rematch request'}.`, 'Game', 'lightgrey');
	}
	if(isHost) {tryRematch()}
}

function tryRematch(){
	if(localRe && onlineRe){
		reset();
		runBuildSetup();
		sendData({
			type: 'rematch'
		})
	}
}

function gameOver(){
	$('#rematchBtn').removeClass('hidden');
}

function reset(){
	resetGame();

	$('#rematchBtn').addClass('hidden');
	$("#readyBtn").removeClass("hidden");

	onlineReady = false;
	localReady = false;

	onlineRe = false;
	localRe = false;

	$('#rematchBtn').text('Rematch');
	$('#readyBtn').text('Ready');

	clearChat();
}

changeGrid('ocean');
checkUsername();
drawScreen();
