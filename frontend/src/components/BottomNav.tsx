import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? '#2563eb' : '#555',
    textDecoration: 'none',
    padding: 12,
  })

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #ddd' }}>
      <NavLink to="/inicio" style={linkStyle}>Início</NavLink>
      <NavLink to="/demandas" style={linkStyle}>Demandas</NavLink>
    </nav>
  )
}