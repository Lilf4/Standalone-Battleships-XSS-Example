//Drawing
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const Abc = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
let squareSize;

function drawScreen() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	let padding = 15;
	squareSize = canvas.width / 11;
	
	for (let x = 0; x < 11; x++) {
		for (let y = 0; y < 11; y++) {
			ctx.strokeStyle = "white";
			ctx.beginPath();
			ctx.rect(squareSize * x, squareSize * y, squareSize, squareSize);
			ctx.font = "65px Arial";
			ctx.fillStyle = "white";
			ctx.textAlign = "center";
			if(y == 0 && x != 0){
				ctx.fillText(x, x * squareSize + squareSize / 2, (y + 1) * squareSize - squareSize / 5);
			}
			if(x == 0 && y != 0){
				ctx.fillText(Abc[y - 1], x * squareSize + squareSize / 2, (y + 1) * squareSize - squareSize / 5);
			}
			ctx.closePath();
			ctx.stroke();
		}
	}

	if(phase === 'build' && currGrid === 'ocean' && selShipLen != -1 && !isPointInShip({x: hoverX, y: hoverY})){
		//Placement mode
		drawShip(selShipLen, hoverX, hoverY, selShipRot, 'grey');
	}
	
	if(currGrid == 'ocean'){
		ships.forEach(ship => {
			let color = 'white';
			//CHECK IF IN BUILD MODE
			if(phase === 'build')
			{
				color = intersects([{x: hoverX, y: hoverY}], ship.spaces) && !localReady ? 'red' : 'white'; 
			}
			else if(phase === 'battle'){
				color = ship.health == 0 ? 'grey' : 'white'
			}
			drawShip(ship.len, ship.startX, ship.startY, ship.rot, color);
		});
	}

	if(currGrid == 'ocean'){
		takenShots.forEach(shot => {
			drawShot(shot.x, shot.y, shot.hit ? 'red' : 'white');
		});
	}
	else if(currGrid == 'target'){
		myShots.forEach(shot => {
			drawShot(shot.x, shot.y, shot.hit ? 'red' : 'white');
		});
	}

	if(phase === 'battle' && myTurn && currGrid === 'target'){
		drawShot(hoverX, hoverY, 'grey')
	}

	function drawShip(l, x, y, hv, color){
		x *= squareSize;
		y *= squareSize;
		ctx.beginPath();
		ctx.fillStyle = color;
		if(l == 1){
			ctx.arc(x + squareSize / 2, y + squareSize / 2, (squareSize / 2) - padding, 0, 2 * Math.PI, false);
			ctx.closePath();
			ctx.fill();
			return;
		}

		if(!hv){
			//Horizontal
			ctx.arc(x + squareSize / 2, y + squareSize / 2, (squareSize / 2) - padding, 0, 2 * Math.PI, false);

			ctx.fillRect(
				x + squareSize / 2, 
				(y + squareSize / 2) - squareSize / 2 + padding, 
				(l - 1) * squareSize, 
				(squareSize / 2 - padding) * 2
				);
			
			ctx.arc(x + (l - 1) * squareSize + squareSize / 2, y + squareSize / 2, (squareSize / 2) - padding, 0, 2 * Math.PI, false);
		}
		else{
			//Vertical
			ctx.arc(x + squareSize / 2, y + squareSize / 2, (squareSize / 2) - padding, 0, 2 * Math.PI, false);

			ctx.fillRect((x + squareSize / 2) - squareSize / 2 + padding, y + squareSize / 2, ((squareSize / 2) - padding) * 2, (l - 1) * squareSize);
			
			ctx.arc(x + squareSize / 2, y + (l - 1) * squareSize + squareSize / 2, (squareSize / 2) - padding, 0, 2 * Math.PI, false);
		}

		ctx.closePath();
		ctx.fill();
	}

	function drawShot(x, y, color){
		x *= squareSize;
		y *= squareSize;
		ctx.beginPath();
		ctx.fillStyle = color != undefined ? color : "white";
		ctx.arc(x + squareSize / 2, y + squareSize / 2, (squareSize / 2) - padding - 10, 0, 2 * Math.PI, false);

		ctx.closePath();
		ctx.fill();
	}
}
