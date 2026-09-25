import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { VistaListaEventos } from './pages/VistaListaEventos';
import { VistaDetalleEvento } from './pages/VistaDetalleEvento';
import { FormularioEvento } from './components/FormularioEvento';

export function App() {
  return (
    <Router>
      <header>
        <h1>Gestión de Eventos y Logística</h1>
        <nav>
          <Link to="/">Lista de eventos</Link>
          <Link to="/eventos/nuevo" className="btn btn-primary">+ Crear evento</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<VistaListaEventos />} />
          <Route path="/eventos/nuevo" element={<FormularioEvento isEdit={false} />} />
          <Route path="/eventos/editar/:id" element={<FormularioEvento isEdit={true} />} />
          <Route path="/eventos/:id" element={<VistaDetalleEvento />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;