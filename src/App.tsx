import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import ListPage from './pages/ListPage'
import MapPage from './pages/MapPage'
import BarDetailPage from './pages/BarDetailPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/bar/:id" element={<BarDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
