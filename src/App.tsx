import { Routes, Route } from 'react-router-dom'
import Game from './pages/Game'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Game />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}
