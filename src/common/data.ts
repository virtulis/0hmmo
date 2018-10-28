export interface Player {
	id: string;
	name: string;
	color: number[];
}

export interface Ball {
	x: number;
	y: number;
	player: string;
}

export interface InitParams {
	you: Player;
	players: Player[];
	balls: Ball[];
}

export interface Dimensions {
	x0: number;
	y0: number;
	x1: number;
	y1: number;
}
