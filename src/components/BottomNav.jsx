import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home,
  ArrowRightLeft,
  ListOrdered,
  AlertTriangle,
  Truck,
  Menu,
  X,
  DoorOpen,
  Boxes,
  Warehouse,
  ClipboardCheck,
  BarChart3,
  History,
  Users
} from 'lucide-react'

export default function BottomNav({ role }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => setMenuOpen(!menuOpen)
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      {/* Slide-up extra menu for admin & additional tools */}
      {menuOpen && (
        <div className="menu-overlay" onClick={closeMenu}>
          <div className="menu-drawer card" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header flex-between">
              <h3>All Management Tools</h3>
              <button className="btn ghost icon-only" onClick={closeMenu}>
                <X size={20} />
              </button>
            </div>
            <nav className="menu-grid">
              <NavLink to="/rooms" onClick={closeMenu} className="menu-item">
                <DoorOpen size={22} />
                <span>Rooms & Labels</span>
              </NavLink>
              <NavLink to="/catalog" onClick={closeMenu} className="menu-item">
                <Boxes size={22} />
                <span>Catalog</span>
              </NavLink>
              <NavLink to="/store" onClick={closeMenu} className="menu-item">
                <Warehouse size={22} />
                <span>Store & Stock</span>
              </NavLink>
              <NavLink to="/transfers-history" onClick={closeMenu} className="menu-item">
                <Truck size={22} />
                <span>Transfer History</span>
              </NavLink>

              {role === 'admin' && (
                <>
                  <NavLink to="/audit" onClick={closeMenu} className="menu-item">
                    <ClipboardCheck size={22} />
                    <span>Audit Mode</span>
                  </NavLink>
                  <NavLink to="/reports" onClick={closeMenu} className="menu-item">
                    <BarChart3 size={22} />
                    <span>Reports & Export</span>
                  </NavLink>
                  <NavLink to="/activity" onClick={closeMenu} className="menu-item">
                    <History size={22} />
                    <span>Activity Log</span>
                  </NavLink>
                  <NavLink to="/users" onClick={closeMenu} className="menu-item">
                    <Users size={22} />
                    <span>User Roles</span>
                  </NavLink>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Primary Bottom Navigation Bar */}
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-tab active' : 'nav-tab')}>
          <Home size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/move" className={({ isActive }) => (isActive ? 'nav-tab active' : 'nav-tab')}>
          <ArrowRightLeft size={20} />
          <span>Move</span>
        </NavLink>
        <NavLink to="/count" className={({ isActive }) => (isActive ? 'nav-tab active' : 'nav-tab')}>
          <ListOrdered size={20} />
          <span>Count</span>
        </NavLink>
        <NavLink to="/damage" className={({ isActive }) => (isActive ? 'nav-tab active' : 'nav-tab')}>
          <AlertTriangle size={20} />
          <span>Damage</span>
        </NavLink>
        <NavLink to="/transfer" className={({ isActive }) => (isActive ? 'nav-tab active' : 'nav-tab')}>
          <Truck size={20} />
          <span>Transfer</span>
        </NavLink>
        <button className={menuOpen ? 'nav-tab active' : 'nav-tab'} onClick={toggleMenu}>
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
