import './style.css';
import { Game } from './game/Game';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app ontbreekt');

new Game(app);
