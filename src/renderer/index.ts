import './App';
import './css/index.css';
import {ipcRenderer} from "electron";

ipcRenderer.send('ready');
