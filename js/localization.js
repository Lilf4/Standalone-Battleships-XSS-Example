const changeEvent = new Event('langChanged');

//global variabel
var lang = getLang();


//Function that substitutes keys in a text with key value pairs
function subKeys(template, keys) {
	for(let keyset of keys){
		for (let key of Object.keys(keyset)) {
			template = template.replaceAll(`{${key}}`, keyset[key]);
		}
	}
	return template;
}


//Function that takes in a document and list of keysets and then fills the value property at nodes with the attribute 'localize'
//looks for key in the 'localize' attribute
function subKeysAtr(doc, keys){
	let nodes = doc.querySelectorAll('[localize]');
	for(let keyset of keys){
		for (let key of Object.keys(keyset)) {
			for(let node of nodes){
				if(node.getAttribute('localize') != key) continue;
				node.innerHTML = keyset[key];
			}
		}
	}
}

//localize page using a json file
function localizePage(path){
	fetch(path)
	.then((response) => response.json()
	.then((json) => 
	{
		subKeysAtr(document.getElementsByTagName('html')[0], [json[lang], json['GENERAL']]);
	}));
}

//localize element using a json file
function localizeElem(path, elem){
	fetch(path)
	.then((response) => response.json()
	.then((json) => 
	{
		subKeysAtr(elem, [json[lang], json['GENERAL']]);
	}));
}


//Tries to get lang string from website localStorage
//incase lang string wasn't found return 'EN'
function getLang(){
	if(localStorage.getItem('lang') != undefined){
		return localStorage.getItem('lang');
	}
	return 'EN';
}

//Change lang and dispatch langChanged event
function changeLang(nLang){
	if(nLang == lang) return;
	localStorage.setItem('lang', nLang);

	document.getElementById(lang + '-FLAG').classList.remove('selected');
	document.getElementById(nLang + '-FLAG').classList.add('selected');
	
	lang = nLang;
	this.dispatchEvent(changeEvent);
}

//Load language change templates
function loadLangElement(){
	document.getElementById('langElement').insertAdjacentHTML("afterend", langElement);
	document.getElementById(lang + '-FLAG').classList.add('selected');
}
