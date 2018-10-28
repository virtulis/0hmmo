import { Server } from 'http';
import { randomBytes } from 'crypto';
import * as WebSocket from 'ws';
import { Ball, InitParams, Player } from '../../common/data';
import uuid = require('uuid');

const ballId = (ball: Ball) => ball.x + ',' + ball.y;

export function startGameServer(server: Server) {

	const wss = new WebSocket.Server({ server });

	wss.on('connection', (socket, request) => addClient(socket))

}

class Client {

	socket: WebSocket;
	player?: Player;
	lastMove = 0;

	constructor(socket: WebSocket) {
		this.socket = socket;
		socket.on('message', data => this.handle(data as string))
	}

	send(cmd: string, params: Record<string, any>) {
		this.sendString(JSON.stringify([cmd, params]));
	}

	sendString(s: string) {
		try {
			this.socket.send(s);
		}
		catch (e) {
			console.log(e);
			clients.delete(this.socket);
		}
	}

	private handle(data: string) {
		try {
			console.log(data);
			const [cmd, params] = JSON.parse(data);
			if (cmd == 'click') this.click(params);
		}
		catch (e) {
			console.log(e);
			clients.delete(this.socket);
		}
	}

	click({ x, y }: { x: number, y: number }) {

		const dirs: [number, number][] = [
			[-1, -1],
			[0, -1],
			[1, -1],
			[1, 0],
			[1, 1],
			[0, 1],
			[-1, 1],
			[-1, 0],
		];


		const ball = { x, y, player: this.player!.id };
		balls.set(ballId(ball), ball);
		broadcast('ball', ball);

	}

}

const clients = new Map<WebSocket, Client>();
const players = new Map<string, Player>();
const balls = new Map<string, Ball>();

function addClient(socket: WebSocket) {
	const client = new Client(socket);
	greet(client);
	clients.set(socket, client);
	broadcast('player', client.player!);
}

function broadcast(cmd: string, params: Record<string, any>) {
	const str = JSON.stringify([cmd, params]);
	for (let client of clients.values()) client.sendString(str);
}

function greet(client: Client) {

	const pid = uuid.v4();
	const player: Player = {
		id: pid,
		name: pid,
		color: Array.from(randomBytes(3))
	};
	players.set(pid, player);
	client.player = player;

	const init: InitParams = {
		you: client.player,
		players: Array.from(players.values()),
		balls: Array.from(balls.values()),
	};

	client.send('hi', init);

}
