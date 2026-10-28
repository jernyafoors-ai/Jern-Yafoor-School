import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Truck,
  ArrowRightLeft,
  ListOrdered,
  DoorOpen,
  Boxes,
  Warehouse,
  ChevronRight
} from 'lucide-react'

export default function Home({ user, role }) {
  const [stats, setStats] = useState({
    total: 0,
    ok: 0,
    damaged: 0,
    inRepair: 0,
    out: 0
  })
  const [roomCount, setRoomCount] = useState(0)
  const [catalogCount, setCatalogCount] = useState(0)

  useEffect(() => {
    // Assets Real-Time Subscription
    const unsubAssets = onSnapshot(collection(db, 'assets'), (snap) => {
      let total = 0,
        ok = 0,
        damaged = 0,
        inRepair = 0,
        out = 0

      snap.forEach((doc) => {
        const data = doc.data()
        total++
        if (data.status === 'ok' || !data.status) ok++
        else if (data.status === 'damaged') damaged++
        else if (data.status === 'in_repair') inRepair++
        else if (data.status === 'out') out++
      })

      setStats({ total, ok, damaged, inRepair, out })
    })

    // Rooms Subscription
    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snap) => {
      setRoomCount(snap.size)
    })

    // Catalog Subscription
    const unsubCatalog = onSnapshot(collection(db, 'catalog'), (snap) => {
      setCatalogCount(snap.size)
    })

    return () => {
      unsubAssets()
      unsubRooms()
      unsubCatalog()
    }
  }, [])

  return (
    <div className="page-container">
      <div className="welcome-banner card">
        <h2>Welcome, {user?.email?.split('@')[0] || 'Staff'}</h2>
        <p className="sub-text">
          Role: <strong>{role === 'admin' ? 'Operations Manager (Admin)' : 'Staff Member'}</strong>
        </p>
      </div>

      {/* Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon primary">
            <Package size={22} />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Registered Assets</div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon success">
            <CheckCircle size={22} />
          </div>
          <div className="stat-value">{stats.ok}</div>
          <div className="stat-label">Assets OK</div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon warning">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-value">{stats.damaged}</div>
          <div className="stat-label">Damaged</div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon info">
            <Wrench size={22} />
          </div>
          <div className="stat-value">{stats.inRepair}</div>
          <div className="stat-label">In Repair</div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon dark">
            <Truck size={22} />
          </div>
          <div className="stat-value">{stats.out}</div>
          <div className="stat-label">Transferred Out</div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <h3 className="section-title">Quick Actions</h3>
      <div className="quick-actions-grid">
        <Link to="/count" className="action-card card">
          <ListOrdered size={28} className="icon-accent" />
          <div className="action-text">
            <h4>First-Time Count</h4>
            <p>Scan room QR & register ADEC tags</p>
          </div>
          <ChevronRight size={20} className="chevron" />
        </Link>

        <Link to="/move" className="action-card card">
          <ArrowRightLeft size={28} className="icon-accent" />
          <div className="action-text">
            <h4>Shifting Mode</h4>
            <p>Move assets from room to room</p>
          </div>
          <ChevronRight size={20} className="chevron" />
        </Link>

        <Link to="/damage" className="action-card card">
          <AlertTriangle size={28} className="icon-accent" />
          <div className="action-text">
            <h4>Damage Report</h4>
            <p>Report damaged item or repair update</p>
          </div>
          <ChevronRight size={20} className="chevron" />
        </Link>

        <Link to="/transfer" className="action-card card">
          <Truck size={28} className="icon-accent" />
          <div className="action-text">
            <h4>Transfer Out</h4>
            <p>Generate asset removal form & PDF</p>
          </div>
          <ChevronRight size={20} className="chevron" />
        </Link>

        <Link to="/rooms" className="action-card card">
          <DoorOpen size={28} className="icon-accent" />
          <div className="action-text">
            <h4>Rooms & Labels ({roomCount})</h4>
            <p>View rooms, print QR code labels</p>
          </div>
          <ChevronRight size={20} className="chevron" />
        </Link>

        <Link to="/catalog" className="action-card card">
          <Boxes size={28} className="icon-accent" />
          <div className="action-text">
            <h4>Asset Catalog ({catalogCount})</h4>
            <p>Catalog item types and photos</p>
          </div>
          <ChevronRight size={20} className="chevron" />
        </Link>
      </div>
    </div>
  )
}
