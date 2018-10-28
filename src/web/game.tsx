import { Ball, Dimensions, InitParams, Player } from '../common/data';
import { ujsx } from 'ujsx';
import { append, create } from 'dtk';

console.warn('Who dis');

const players = new Map<string, Player>();
const balls = new Map<string, Ball>();

const ws = new WebSocket('ws' + location.protocol.substr(4) + '//' + location.host);

const ballId = (ball: Ball) => ball.x + ',' + ball.y;

ws.onmessage = ev => {

	console.log(ev.data);

	const [cmd, params] = JSON.parse(ev.data);

	if (cmd == 'hi') init(params);
	else if (cmd == 'player') setPlayer(params);
	else if (cmd == 'ball') setBall(params);

};

ws.onerror = ev => {
	console.log(ev);
	alert('Game broke. Idk, see devtools.');
};

let me: Player | null = null;
let dim: Dimensions = {
	x0: -10,
	y0: -10,
	x1: 10,
	y1: 10,
};

function send(cmd: string, params: any) {
	ws.send(JSON.stringify([cmd, params]));
}

const width = window.innerWidth;
const height = window.innerHeight;
const canvas = create('canvas', { width, height });
append(document.body, canvas);
const ctx = canvas.getContext('2d')!;

function init(params: InitParams) {

	me = params.you;

	for (let player of params.players) players.set(player.id, player);
	for (let ball of params.balls) balls.set(ballId(ball), ball);

	requestAnimationFrame(draw);

	canvas.onclick = click;

}

function draw() {

	ctx.clearRect(0, 0, width, height);

	const sw = width / (dim.x1 - dim.x0);
	const sxm = sw / 10;
	const sh = height / (dim.y1 - dim.y0);
	const sym = sh / 10;

	for (let ball of balls.values()) {
		ctx.fillStyle = 'rgb(' + players.get(ball.player)!.color.join(',') + ')';
		ctx.fillRect(
			sw * (ball.x - dim.x0) + sxm,
			sh * (ball.y - dim.y0) + sym,
			sw - sxm * 2,
			sh - sym * 2
		);
	}

	requestAnimationFrame(draw);

}

function click(e: MouseEvent) {

	console.log(e.pageX, e.pageY);

	ctx.strokeStyle = 'black';
	ctx.strokeRect(e.pageX - 5, e.pageY - 5, 10, 10);
	
	const x = dim.x0 + Math.floor((dim.x1 - dim.x0) * (e.pageX / width));
	const y = dim.y0 + Math.floor((dim.y1 - dim.y0) * (e.pageY / height));

	console.log({ x, y });
	send('click', { x, y });
	
}

function setPlayer(player: Player) {
	players.set(player.id, player);
}

function setBall(ball: Ball) {
	balls.set(ballId(ball), ball);
}
