import { useState } from 'react'
import './App.css'
import { Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FaceId from './pages/FaceId'
import ErrorBoundary from './components/ErrorBoundary'
// import 'antd/dist/reset.css'

function App() {
  const token = localStorage.getItem('token');

  return (
    <ErrorBoundary>
      <Routes >
        <Route path='/' element={token ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path='/dashboard' element={token ? <Dashboard /> : <Navigate to="/" />} />
        <Route path='/faceid' element={<FaceId />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
