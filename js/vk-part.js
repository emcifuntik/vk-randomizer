var debug = false;
var contest = {
	type: 'repost',
	winners: new Array(),
	winnersCount: 0,
	needWinners: 0,
	owner: '',
	post: '',
	repostsCount: 0,
	checkSubscribtion: false
};
var randoms = new Array();
var lastRandom = 0;
var rejectIDs = new Array(); //неугодные
var replaceWinners = new Array();
var replacePrizes = new Array();
var whiteList = new Array();

var lsWhiteList = localStorage.getItem('whitelist');
if(lsWhiteList) {
	whiteList = JSON.parse(lsWhiteList);
}

window.addEventListener('load', function() {
	document.getElementById('likeText').addEventListener('click', function() {
		var newWhiteList = prompt('Введите список гарантированных победителей', whiteList.join(','));
		if(newWhiteList !== null) {
			whiteList.splice(0, whiteList.length);
			if(newWhiteList.length != 0) {
				var newString = newWhiteList.split(',');
				if(newString.length > 0) {
					for(var i = 0; i < newString.length; ++i) {
						whiteList.push(parseInt(newString[i]));
					}
				}
			}
			localStorage.setItem('whitelist', JSON.stringify(whiteList));
		}
	});
});

function getRandom() {
	var res = randoms[0];
	lastRandom = res;
	randoms.shift();
	return res;
}

function returnRandom(error) {
	randoms.push(lastRandom);
}

function fillArray(n) {
	var res = new Array();
	if ((n > contest.needWinners * 5) && n > 1000) n = 1000;
	for (var i = 0; i < n; ++i) {
		res.push(i);
	}
	return res;
}

function getWinners() {

	rejectIDs = new Array();
	rejectIDs.push(userID);

	if (checkInput()) {

		document.querySelector('#result-text').innerHTML = "";
		document.querySelector('#result').innerHTML = "";
		var url = document.querySelector('#postLink').value;
		var checkSub = document.querySelector('#chkSubscribtion').checked;
		var post = parseLink(url);
		contest.type = getRadioValue('contestType');
		contest.winners = new Array();
		contest.winnersCount = 0;
		contest.needWinners = prizesCount; //количество победителей
		contest.owner = post.owner;
		contest.post = post.post_id;
		contest.checkSubscribtion = checkSub;

		document.querySelector('#loadingText').innerHTML = "Думаем...";

		changePage('Loading');

		if (contest.type == 'repost') getRepostsCount();
		else getLikesCount();
	}
	resizeWindowToFitAll();
}

function getLikesCount() {
	VK.api('likes.getList', {
		type: 'post',
		owner_id: contest.owner,
		item_id: contest.post,
		filter: 'likes',
		friends_only: '0',
		extended: '0',
		offset: '0',
		count: '1',
		skip_own: '1'
	}, setRepostsCount);
}

function getRepostsCount() {
	VK.api('likes.getList', {
		type: 'post',
		owner_id: contest.owner,
		item_id: contest.post,
		filter: 'copies',
		friends_only: '0',
		extended: '0',
		offset: '0',
		count: '1',
		skip_own: '1'
	}, setRepostsCount);
}

function setRepostsCount(data) {
	contest.repostsCount = data.response.count;

	if (contest.needWinners > contest.repostsCount) {
		showError("Недостаточно участников, чтобы разыграть все призы.");
		return 0;
	}

	randoms = shuffle(fillArray(data.response.count));
	if (contest.type == 'repost') getRepost();
	else getLike();
}

function getRepost() {

	VK.api('wall.getReposts', {
		type: 'post',
		owner_id: contest.owner,
		post_id: contest.post,
		offset: getRandom(),
		count: '1'
	}, workRepost);
}

function workRepost(data) {
	let passed = false;
	if(whiteList.length > 0) {
		whiteList = shuffle(whiteList);
		passed = true;
		getUser(whiteList.pop());
	}
	else if (typeof data.response != "undefined" && data.response.items[0] && data.response.items[0].to_id && !passed) {
		getUser(data.response.items[0].to_id);
	} else {
		returnRandom(data);
		nextStep();
	}
}

function getLike() {

	VK.api('likes.getList', {
		type: 'post',
		owner_id: contest.owner,
		item_id: contest.post,
		filter: 'likes',
		friends_only: 0,
		offset: getRandom(),
		count: '1'
	}, workLike);
}

function workLike(data) {
	let passed = false;
	if(whiteList.length > 0) {
		whiteList = shuffle(whiteList);
		passed = true;
		getUser(whiteList.pop());
	}
	else if (typeof data.response != "undefined" && data.response.items[0] && !passed) {
		getUser(data.response.items[0]);
	} else {
		returnRandom(data);
		nextStep();
	}
}

function getUser(id) {
	VK.api('users.get', {
		fields: 'photo_50',
		user_ids: id
	}, workUser);
}

function workUser(data) {
	if (typeof data.error != "undefined" && data.error.error_code == "6") returnRandom(data);
	if (typeof data.response == "undefined") {
		nextStep();
		return 0;
	}

	if (contest.checkSubscribtion) {
		checkSubscribtion(data.response[0]);
	} else {
		checkUser(data.response[0]);
	}
}

function isError(data) {
	return data.error;
}

function checkSubscribtion(user) {
	if (typeof user != "undefined") VK.api('groups.isMember', {
		group_id: contest.owner.replace("-", ""),
		user_id: user.id,
		extended: '0'
	}, function (data) {
		data.user = user;
		checkUser(data);
	});
	else nextStep();
}

function checkUser(data) {

	if (typeof data !== 'undefined' && 'user' in data) user = data.user;
	else user = data;

	if (typeof data !== 'undefined' && typeof data.response !== "undefined" && data.response == "0") {
		rejectIDs.push(user.id);
	}

	if ((typeof user !== 'undefined') && ('id' in user) && !in_array(user.id, rejectIDs) && !data.error) {
		addWinner(user);
	} else {
		nextStep();
	}
}

function addWinner(winner) {
	winner['prize'] = prizeTitles[contest.winnersCount];

	rejectIDs.push(winner.id);
	contest.winners["id" + winner.id] = winner;
	++contest.winnersCount;
	document.querySelector('#loadingText').innerHTML = contest.winnersCount + " / " + contest.needWinners;

	nextStep();
}

function nextStep() {
	if (randoms.length <= 0) {
		showError("Не хватает репостов, чтобы разыграть все призы. <br>Если количество репостов больше количества призов, возможно, некоторые репосты сделаны сообществами или заблокированными пользователями, а они не могут принимать участие в розыгрышах.");
		return 0;
	}
	sleep(300);

	if (contest.winnersCount < contest.needWinners) {
		if (contest.type == 'repost') getRepost();
		else getLike();
	} else showResult();
}

function showResult() {
	var replace = false;
	if (replaceWinners.length > 0) {
		replace = true;
	} else {

		document.querySelector('#result').innerHTML = "";

		document.getElementById('result-text').innerHTML = "Всего участников: " + contest.repostsCount + "<br/>";
		document.getElementById('result-text').innerHTML += "Количество победителей: " + contest.winnersCount + "<br/>";
	}
	var winner;

	if (!replace) {
		for (var key in contest.winners) {
			winner = contest.winners[key];
			showWinner(winner);
		}
	} else {
		for (var key in contest.winners) {
			winner = contest.winners[key];
			showReplacedWinner(winner);
		}
	}
	componentHandler.upgradeDom();
	changePage('Result');
}

function showWinner(winner) {
	document.querySelector('#result').appendChild(getWinnerHTML(winner));
}

function showReplacedWinner(winner) {

	if (document.getElementById("id" + winner.id)) return 0;

	var replaceElement = document.getElementById(replaceWinners[0]);
	var parent = replaceElement.parentNode;
	winner.prize = replacePrizes[0];


	if (!replacePrizes[0]) return 0;

	parent.replaceChild(getWinnerHTML(winner), replaceElement);
	replaceWinners.shift();
	replacePrizes.shift();
}

function getWinnerHTML(winner) {
	var name = winner.first_name + " " + winner.last_name;

	var avatar = new Image();
	avatar.src = winner.photo_50;
	var div = document.createElement('div');
	div.setAttribute('id', 'id' + winner.id);
	div.setAttribute('class', 'winnerItem colored');
	var s = "<a href='https://vk.com/id" + winner.id + "' target='_blank' class='avatar'>";
	s += "<div class='inline'>";
	s += "<img src='" + avatar.src + "' alt='" + name + "' title='" + name + "' />";
	s += "</div>";
	s += "</a>";

	s += "<a href='https://vk.com/id" + winner.id + "' target='_blank' style='flex: 1; text-decoration: none'>";
	s += "<div class='inline name'>";
	s += "<div class='winnerName'>" + winner.first_name + " " + winner.last_name + "</div>";
	s += "<div class='winnerPrize'>Приз: " + winner.prize + "</div>";
	s += "</div>";
	s += "</a>";
	s += "<div class='winnerBtns'>";
	s += '<button id="btnRefresh-' + winner.id + '" class="mdl-button mdl-js-button mdl-button--icon replaceWinnerBtn" onclick="replaceWinner(\'id' + winner.id + '\')"><i class="material-icons">&#xE5D5;</i></button>';
	s += '<div class="mdl-tooltip paper" for="btnRefresh-' + winner.id + '">Найти другого</div>';
	s += "</div>";
	div.innerHTML = s;

	return div;
}

function replaceWinner(winnerID) {
	document.getElementById(winnerID).className = "winnerLoading";
	document.getElementById(winnerID).innerHTML = '<div class="mdl-spinner mdl-js-spinner is-active loadingSpinner"></div>';
	componentHandler.upgradeDom();

	replaceWinners.push(winnerID);
	replacePrizes.push(contest.winners[winnerID].prize);
	delete contest.winners[winnerID];
	--contest.winnersCount;

	if (contest.type == 'repost') getRepost();
	else getLike();
}