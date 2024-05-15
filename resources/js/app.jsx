import './bootstrap.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { createRoot } from 'react-dom/client'; 
import Home from './components/Home.jsx'; 

const container = document.getElementById('app');
const root = createRoot(container); 
root.render(<Home />); 
