let availableShips = [
	{ len: 2, name: 'Destroyer' },
	{ len: 3, name: 'Submarine' },
	{ len: 3, name: 'Cruiser' },
	{ len: 4, name: 'Battleship' },
	{ len: 5, name: 'Carrier' }
]
let ships = [];

let myShots = [];
let takenShots = [];

let currGrid = 'ocean';

let shipsLeft = 5;

let selShipLen = 2;
let selShipRot = false;

let hoverX;
let hoverY;

let localReady = false;
let onlineReady = false;

let gameHasStarted = false;

let myTurn = false;

let phase = 'wait';

canvas.addEventListener("mousemove", function (e) {
	if (phase != 'wait') {
		let rect = canvas.getBoundingClientRect();

		hoverX = Math.max(1, Math.floor((e.clientX - rect.left) / squareSize));
		hoverY = Math.max(1, Math.floor((e.clientY - rect.top) / squareSize));

		drawScreen();
	}
})

canvas.addEventListener("mousedown", function (e) {
	if (e.button === 0) {
		if (phase === 'build' && availableShips.find(o => o.len == selShipLen)) {
			let endX = selShipRot ? hoverX : hoverX + selShipLen - 1;
			let endY = selShipRot ? hoverY + selShipLen - 1 : hoverY;
			let allowPlace = true;
			let spaces = [];
			for (let i = 0; i < selShipLen; i++) {
				spaces.push({
					x: selShipRot ? hoverX : hoverX + i,
					y: !selShipRot ? hoverY : hoverY + i
				});
			}

			if (selShipRot ? (hoverY + selShipLen - 1) > 10 : (hoverX + selShipLen - 1) > 10) {
				allowPlace = false;
			}

			for (let i = 0; i < ships.length; i++) {
				let ship = ships[i];

				if (intersects(spaces, ship.spaces)) {
					allowPlace = false;
					break;
				}
			};
			if (allowPlace) {
				ships.push({
					len: selShipLen,
					name: availableShips.find(o => o.len == selShipLen).name,
					health: selShipLen,
					rot: selShipRot,
					startX: hoverX,
					endX: endX,
					startY: hoverY,
					endY: endY,
					spaces: spaces
				})
				availableShips.splice(availableShips.indexOf(availableShips.find(o => o.len == selShipLen)), 1);
			}
		}
		else if(phase === 'battle' && myTurn && currGrid === 'target'){
			if(myShots.find(o => o.x == hoverX && o.y == hoverY)){return;}
			sendData({
				type: 'shot',
				x: hoverX,
				y: hoverY
			})
			myTurn = false;
		}
	}
	else if (e.button === 2) {
		if(phase === 'build' && !localReady){
			let ship;
			for (let i = 0; i < ships.length; i++) {
				ship = intersects([{ x: hoverX, y: hoverY }], ships[i].spaces);
				if (ship) {
					ship = ships[i];
					break;
				}
			}
			if (ship) {
				availableShips.push({ len: ship.len, name: ship.name });
				availableShips.sort(function (a, b) {
					return a.len - b.len;
				});
				ships.splice(ships.indexOf(ship), 1);
			}
		}
	}
	if (availableShips.length > 0) {
		selShipLen = availableShips[0].len;
	}
	else {
		selShipLen = -1;
	}

	if(phase == 'build' && availableShips.length <= 0){
		$('#readyBtn').prop('disabled', false);
		$('#readyBtn').removeClass('clicked');
	}
	else if(phase == 'build'){
		$('#readyBtn').prop('disabled', true);
		$('#readyBtn').addClass('clicked');
	}

	drawScreen();
})

canvas.oncontextmenu = function (e) {
	if (e.preventDefault != undefined)
		e.preventDefault();
	if (e.stopPropagation != undefined)
		e.stopPropagation();
}

document.addEventListener("keypress", function onEvent(event) {
	if (phase === 'build' && selShipLen != -1 && event.key === "r") {
		selShipRot = !selShipRot;
		drawScreen();
	}
});

//Check if two lists of x/y coordinates have intersections
function intersects(spaces1, spaces2) {
	for (let i = 0; i < spaces1.length; i++) {
		let found = spaces2.find(o => o.x == spaces1[i].x && o.y == spaces1[i].y);
		if (found) {
			return found;
		}
	}
};

function isPointInShip(xy) {
	if (ships.length <= 0) { return false; }
	for (let i = 0; i < ships.length; i++) {
		let found = ships[i].spaces.find(o => o.x == xy.x && o.y == xy.y);
		if (found) {
			return ships[i];
		}
	}
}

function didHit(x, y){
	let hit = isPointInShip({x: x, y: y});
	console.log(hit);
	let shot = {
		x: x,
		y: y,
		hit: false,
		shipName: undefined,
		sunk: false
	}
	if(hit){
		shot.shipName = hit.name;
		shot.hit = true;
		hit.health--;
		shot.sunk = hit.health <= 0 ? true : false;
	}
	
	takenShots.push(shot);
	sendData({
		type: 'hitResult',
		shot: shot
	})

	if(!shot.hit){
		myTurn = true;
		addMessageToChat(`${otherUsername} shot at ${x}${Abc[y - 1]} which was a miss, It is now your turn.`, 'Game', 'lightgrey');
	}
	else{
		addMessageToChat(`${otherUsername} shot at ${x}${Abc[y - 1]} which hit your ${shot.shipName} ship, It is ${otherUsername}'s turn again.`, 'Game', 'lightgrey');
	}

	if(shot.sunk){
		addMessageToChat(`${otherUsername} has sunk your ${shot.shipName} ship.`, 'Game', 'lightgrey');
		shipsLeft--;
	}

	if(shipsLeft <= 0){
		sendData({
			type: 'gameover'
		});
		addMessageToChat(`GameOver ${otherUsername} has sunk all your ships.`, 'Game', 'Red')
		gameOver();
	}
}

function resetGame(){
	availableShips = [
		{ len: 2, name: 'Destroyer' },
		{ len: 3, name: 'Submarine' },
		{ len: 3, name: 'Cruiser' },
		{ len: 4, name: 'Battleship' },
		{ len: 5, name: 'Carrier' }
	]
	ships = [];

	myShots = [];
	takenShots = [];

	currGrid = 'ocean';

	shipsLeft = 5;

	selShipLen = 2;
	selShipRot = false;

	localReady = false;
	onlineReady = false;

	gameHasStarted = false;

	myTurn = false;

	phase = 'wait';

	drawScreen();
}

//Game loop
//1. Join/Host a game
//2. When two players are in a game enter build phase
//3. When both players have put down their ships and pressed ready go to game phase
//4. Flip a coin to see who goes first
//5. When a game is over announce the winner, and let players choose to have a rematch
//6. On confirm of rematch go to 2.

// While in game phase allow players to look back and forth between their own 'ocean' map and their marking map
// When a move has been made the result of this will be written to a chat log
// 
