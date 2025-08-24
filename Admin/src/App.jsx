// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx'; // Your existing Login page
import NotFound from './pages/NotFound.jsx'; // We'll create this next
import Dashboard from './pages/Dashboard.jsx';

function App() {
  return (
    <Routes>
      {/* Example routes */}
      <Route path="/" element={<Login />} />
      <Route path="/Dashboard" element={<Dashboard />} />

      {/* Catch-all for 404 / non-matching routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
