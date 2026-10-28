import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  Boxes,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardList,
  Layers3,
  Package,
  Settings2,
  Truck,
  UsersRound,
} from 'lucide-react'
import Panel from './components/Panel.jsx'
import './App.css'

const navigation = [
  { label: 'Inicio (Dashboard)', path: '/dashboard', icon: ChartNoAxesCombined },
  { label: 'Productos', path: '/productos', icon: Package },
  { label: 'Categorías', path: '/categorias', icon: Layers3 },
  { label: 'Proveedores', path: '/proveedores', icon: Truck },
  { label: 'Kardex', path: '/kardex', icon: ClipboardList },
  { label: 'Usuarios', path: '/usuarios', icon: UsersRound },
  { label: 'Configuración', path: '/configuracion', icon: Settings2 },
]

const titles = {
  '/dashboard': 'Dashboard',
  '/productos': 'Productos',
  '/categorias': 'Categorías',
  '/proveedores': 'Proveedores',
  '/kardex': 'Kardex',
  '/usuarios': 'Usuarios',
  '/configuracion': 'Configuración',
}

function Shell() {
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="brand-mark"><Boxes size={21} strokeWidth={2.2} /></span>
          <span><strong>SENATI</strong><small>SISTEMA DE INVENTARIO</small></span>
        </div>
        <div className="sidebar-label">ESPACIO DE TRABAJO</div>
        <nav className="side-nav" aria-label="Navegación principal">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon size={18} strokeWidth={1.9} />
              <span>{label}</span>
              {pathname === path && <ChevronRight className="nav-chevron" size={15} />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom"><span className="connection-dot" /><span>Panel de inventario</span><small>LOCAL</small></div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Inventario</span><ChevronRight size={14} /><strong>{titles[pathname] || 'Panel general'}</strong></div>
          <div className="topbar-meta"><span className="today-label">ADMINISTRACIÓN</span><span className="avatar">AD</span><span className="profile-name">Administrador</span></div>
        </header>
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Panel view="dashboard" />} />
            <Route path="/productos" element={<Panel view="products" />} />
            <Route path="/categorias" element={<Panel view="categories" />} />
            <Route path="/proveedores" element={<Panel view="suppliers" />} />
            <Route path="/kardex" element={<Panel view="ledger" />} />
            <Route path="/usuarios" element={<Panel view="users" />} />
            <Route path="/configuracion" element={<Panel view="settings" />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function App() {
  return <BrowserRouter><Shell /></BrowserRouter>
}

export default App
