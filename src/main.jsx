import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider, AvisoServidor } from './componentes/ui';
import AvisoSistema from './componentes/AvisoSistema';
import { acordarServidor } from './api';
import './styles.css';

acordarServidor();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AvisoServidor />
        <AvisoSistema>
          <App />
        </AvisoSistema>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
