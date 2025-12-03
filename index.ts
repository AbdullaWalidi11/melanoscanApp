// index.ts
import "./global.css"; 
import { registerRootComponent } from 'expo';

// ✅ ADD THIS LINE AT THE TOP
import "./src/services/Firebase"; 

import App from './App';

registerRootComponent(App);