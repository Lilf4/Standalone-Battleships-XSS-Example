const chat = $('#chatBox');
const input = $('#chatInput');

let otherUsername;

$(input).keypress(function (e) {
	if (e.which == 13) {
		//Send chat package
		if ($(input).val() != "") {
			addMessageToChat($(input).val(), 'You')
			sendMessageToPeer($(input).val())
			$(input.val(""))
		}
	}
});

function sendMessageToPeer(msg){
    sendData({
		type: 'chatMessage',
		msg: msg
	})
}

function addMessageToChat(msg, user, color) {
	var date = new Date();
	$(chat).html($(chat).html() + `<span class="chatItem">${color != undefined ? '<span class="chatItem" style="color:' + color + ';">' : ''}${date.getHours() + ':' + date.getMinutes()} - ${user}: ${msg}${color != undefined ? '</span>' : ''}</span>` + "<br>");
	$(chat).scrollTop($(chat)[0].scrollHeight);
}

function clearChat() {
	$(chat).html("");
}
