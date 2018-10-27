import { ujsx } from 'ujsx';
import { resourceLink } from '../lib/config';

export function createOuter() {

	return <html>
		<head>

			<title>Idk</title>

			<meta charSet="utf-8"/>
			<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
			<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1"/>

			<link rel="stylesheet" href={resourceLink('game.css')} type="text/css" />

		</head>
		<body>

			<script type="text/javascript" src={resourceLink('game.js')} />

		</body>
	</html>;

}