import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {BrowserRouter} from "react-router-dom";
import axios from "axios";
import { Provider } from 'react-redux';
import { store } from "./store";
// import { store } from '@reduxjs/toolkit';
axios.defaults.baseURL = "https://museum-ticket-booking.onrender.com/"

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
<React.StrictMode>
    <BrowserRouter>
        <Provider store={store}>
        <App />
        </Provider>
        
      
    </BrowserRouter>
  </React.StrictMode>
);

