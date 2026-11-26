import { Navigate, Route, Routes } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import Demandas from './pages/Demandas'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route path="/inicio" element={<Home />} />
        <Route path="/demandas" element={<Demandas />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}