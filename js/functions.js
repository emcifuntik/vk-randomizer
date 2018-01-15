function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  while (0 !== currentIndex) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function resizeWindowToFitAll() {
   let offset = document.body.offsetHeight;
   if (offset > 2050) offset = 2050;
   VK.callMethod("resizeWindow", 800, offset);
   }

function animate() {
    var colored = $('.colored');
    var p1 = pos1, p2 = pos2;
    while ( Math.abs(p1 - pos1) < 20) {
      p1 = rnd(0, 100);
    }
    pos1 = p1;
    while ( Math.abs(p2 - pos2) < 20) {
      p2 = rnd(0, 100);
    }
    pos2 = p2;
    colored.css('transition','0.4s');
    colored.css('-webkit-transition','0.4s');
    colored.css('background-position',p1 + '% ' + p2 + '%');
    repaint();
  }

function rnd(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
	}


function in_array(needle, haystack, strict) {
	var found = false, key, strict = !!strict;

	for (key in haystack) {
		if ((strict && haystack[key] === needle) || (!strict && haystack[key] == needle)) {
			found = true;
			break;
		}
	}

	return found;
}

function sleep(ms) {
	ms += new Date().getTime();
	while (new Date() < ms){}
	}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function deleteAll(remClass) {
	var elements = document.getElementsByClassName(remClass);

	while(elements[0]) { elements[0].parentNode.removeChild(elements[0]); }
	}

function downloadCanvas() {
	var link = document.createElement('a');
	link.href = document.querySelector("canvas").toDataURL();
	link.setAttribute("download", "winners.png");
	link.style.display = "none";
	document.body.appendChild(link);
	link.click();
	link.outerHTML = "";
	}

function saveScreen() {
	var label = document.querySelector("#content").innerHTML;
	deleteAll("mdl-button");
	document.querySelector("#resultButtons").outerHTML = "";

	html2canvas(document.querySelector("#content"), {
		letterRendering: true,
		useCORS: true,
	  onrendered: function(canvas) {
		canvas.id = "canvas";
		canvas.style.display = "none";
		document.body.appendChild(canvas);
		downloadCanvas();
	  }
	});

	document.querySelector("#content").innerHTML = label;
}

function makeTextFile(text) {
	var textFile = null;
   text = text.replace(/\n/g, "\r\n");
	var data = new Blob([text], {type: 'text/plain'});

	// If we are replacing a previously generated file we need to
	// manually revoke the object URL to avoid memory leaks.
	if (textFile !== null) {
		window.URL.revokeObjectURL(textFile);
		}

	textFile = window.URL.createObjectURL(data);
	return textFile;
	}

function saveList() {
	var text = "Поздравляем победителей!" + "\r\n\r\n";
	var winners = contest.winners;
	for (key in winners) {
		text += "[id" + winners[key].id + "|" + winners[key].first_name + " " + winners[key].last_name + "] - " + winners[key].prize + "\r\n";
		}

	text += "\r\nПобедители выбраны с помощью приложения Рандомайзер (https://vk.com/app4938347_17300765)";

	var link = document.createElement('a');
	link.href = makeTextFile(text);
	link.setAttribute("download", "winners.txt");
	link.style.display = "none";
	document.body.appendChild(link);
	link.click();
	link.outerHTML = "";
}

function getStringBetween(str, start, end) {
	return str.substring(str.lastIndexOf(start)+start.length,str.lastIndexOf(end));
	}

function getRadioValue(name) {
	var radios = document.getElementsByName(name);

	for (var i = 0, length = radios.length; i < length; i++) {
		if (radios[i].checked) {
			return radios[i].value;
			break;
			}
		}
	}
