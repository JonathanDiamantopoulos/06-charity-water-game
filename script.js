const roundLength = 30;
const titleScreen = document.querySelector('#menu');
const gameScreen = document.querySelector('#game');
const resultsScreen = document.querySelector('#results');
const timerElement = document.querySelector('#timer');
const timerBar = document.querySelector('#timer-bar');
const scoreElement = document.querySelector('#score');
const finalScoreElement = document.querySelector('#final-score');
const dropField = document.querySelector('#drop-field');
const sortMessage = document.querySelector('#sort-message');
const scoreFeedback = document.querySelector('#score-feedback');
const basinButtons = document.querySelectorAll('.basin-button');
const confettiLayer = document.querySelector('#confetti-layer');

const dropFallDuration = 4000;
const dropSpawnDelay = 1450;
const missPenalty = 15;
const confettiColors = ['#2e9df7', '#ffc907', '#4fcb53', '#f16061', '#172326'];

let secondsRemaining = roundLength;
let score = 0;
let activeDrops = [];
let timerInterval;
let dropSpawnInterval;
let confettiRemovalTimeout;

// Show one screen at a time and move focus to its heading.
function showScreen(screenToShow) {
	titleScreen.hidden = true;
	gameScreen.hidden = true;
	resultsScreen.hidden = true;
	screenToShow.hidden = false;
	screenToShow.querySelector('h1, h2').focus();
}

// Stop every timer and remove any drops from the previous round.
function stopRound() {
	clearInterval(timerInterval);
	clearInterval(dropSpawnInterval);
	activeDrops.forEach((drop) => {
		clearTimeout(drop.missTimeout);
		drop.element.remove();
	});
	activeDrops = [];
	dropField.replaceChildren(scoreFeedback);
}

// Reset all round values so a restart always begins fresh.
function startGame() {
	stopRound();
	clearConfetti();

	secondsRemaining = roundLength;
	score = 0;
	scoreElement.textContent = score;
	timerElement.textContent = secondsRemaining;
	timerBar.style.width = '100%';
	timerBar.style.backgroundColor = '';
	sortMessage.textContent = 'The oldest drop has a yellow outline. Sort it first.';
	sortMessage.className = 'sort-message';
	scoreFeedback.className = 'score-feedback';
	scoreFeedback.textContent = '';
	basinButtons.forEach((button) => {
		button.disabled = false;
	});

	showScreen(gameScreen);
	spawnDrop();
	dropSpawnInterval = setInterval(spawnDrop, dropSpawnDelay);

	timerInterval = setInterval(() => {
		secondsRemaining -= 1;
		timerElement.textContent = secondsRemaining;
		timerBar.style.width = `${(secondsRemaining / roundLength) * 100}%`;

		if (secondsRemaining <= 10) {
			timerBar.style.backgroundColor = '#f16061';
		}

		if (secondsRemaining === 0) {
			finishGame();
		}
	}, 1000);
}

// Add a new falling drop and start its miss timer.
function spawnDrop() {
	const type = Math.random() < 0.5 ? 'clean' : 'dirty';
	const element = document.createElement('span');
	element.className = `falling-drop drop-${type}`;
	element.style.left = `${12 + Math.random() * 76}%`;
	element.style.animationDuration = `${dropFallDuration}ms`;
	element.setAttribute('role', 'img');
	element.setAttribute('aria-label', `${type} water drop`);
	dropField.append(element);

	const drop = { type, element, missTimeout: null };
	drop.missTimeout = setTimeout(() => {
		missDrop(drop);
	}, dropFallDuration);
	activeDrops.push(drop);
	updateDropPriority();
}

// Mark the oldest drop so players know which one to sort first.
function updateDropPriority() {
	activeDrops.forEach((drop, index) => {
		const isNext = index === 0;
		drop.element.classList.toggle('is-next', isNext);
		drop.element.setAttribute(
			'aria-label',
			`${drop.type} water drop${isNext ? ', sort this one next' : ''}`
		);
	});
}

function removeDrop(drop) {
	const dropIndex = activeDrops.indexOf(drop);
	if (dropIndex === -1) {
		return;
	}

	clearTimeout(drop.missTimeout);
	drop.element.remove();
	activeDrops.splice(dropIndex, 1);
	updateDropPriority();
}

// Show a large color-coded points change for each sort or missed drop.
function showScoreFeedback(points) {
	const pointsText = points > 0 ? `+${points}` : `${points}`;
	scoreFeedback.textContent = pointsText;
	scoreFeedback.className = 'score-feedback';
	void scoreFeedback.offsetWidth;
	scoreFeedback.classList.add(points > 0 ? 'is-positive' : 'is-negative');
}

// Apply the selected basin to the oldest drop in the field.
function sortDrop(chosenType) {
	const oldestDrop = activeDrops[0];
	if (!oldestDrop) {
		return;
	}

	const isCorrect = chosenType === oldestDrop.type;
	const points = isCorrect ? 10 : -5;
	removeDrop(oldestDrop);
	score = Math.max(0, score + points);
	sortMessage.textContent = isCorrect ? 'Correct sort!' : 'Wrong basin!';
	sortMessage.className = `sort-message ${isCorrect ? 'message-correct' : 'message-wrong'}`;
	showScoreFeedback(points);

	scoreElement.textContent = score;
}

// A drop that reaches the waterline without being sorted costs more points.
function missDrop(drop) {
	if (!activeDrops.includes(drop)) {
		return;
	}

	removeDrop(drop);
	score = Math.max(0, score - missPenalty);
	scoreElement.textContent = score;
	sortMessage.textContent = 'A drop was missed!';
	sortMessage.className = 'sort-message message-wrong';
	showScoreFeedback(-missPenalty);
}

function createConfetti() {
	clearConfetti();
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}

	confettiLayer.hidden = false;
	for (let index = 0; index < 64; index += 1) {
		const piece = document.createElement('span');
		piece.className = index % 3 === 0 ? 'confetti-piece is-round' : 'confetti-piece';
		piece.style.left = `${Math.random() * 100}%`;
		piece.style.backgroundColor = confettiColors[index % confettiColors.length];
		piece.style.animationDelay = `${Math.random() * 450}ms`;
		piece.style.animationDuration = `${1800 + Math.random() * 1200}ms`;
		piece.style.setProperty('--confetti-drift', `${Math.random() * 180 - 90}px`);
		confettiLayer.append(piece);
	}

	confettiRemovalTimeout = setTimeout(clearConfetti, 3400);
}

function clearConfetti() {
	clearTimeout(confettiRemovalTimeout);
	confettiLayer.replaceChildren();
	confettiLayer.hidden = true;
}

function finishGame() {
	stopRound();
	finalScoreElement.textContent = score;
	showScreen(resultsScreen);
	createConfetti();
}

document.querySelector('#play-button').addEventListener('click', startGame);
document.querySelector('#restart-button').addEventListener('click', startGame);

document.querySelector('#menu-button').addEventListener('click', () => {
	stopRound();
	clearConfetti();
	showScreen(titleScreen);
});

document.querySelector('#home-link').addEventListener('click', (event) => {
	event.preventDefault();
	stopRound();
	clearConfetti();
	showScreen(titleScreen);
});

basinButtons.forEach((button) => {
	button.addEventListener('click', () => {
		sortDrop(button.dataset.sort);
	});
});

// Let players sort with the arrow keys or A and D, too.
document.addEventListener('keydown', (event) => {
	if (gameScreen.hidden) {
		return;
	}

	if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
		event.preventDefault();
		sortDrop('clean');
	} else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
		event.preventDefault();
		sortDrop('dirty');
	}
});
