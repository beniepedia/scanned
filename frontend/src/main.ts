import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');

if (target === null) {
  throw new Error('Elemen #app tidak ditemukan pada shell CodeIgniter.');
}

export default mount(App, { target });
