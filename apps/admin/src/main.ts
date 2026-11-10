import './style.css';
import { AdminApp } from './AdminApp';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app ontbreekt');

new AdminApp(app);
