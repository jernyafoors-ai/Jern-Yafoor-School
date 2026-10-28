import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { exportToExcel } from '../lib/excel'
import { BarChart3, Download, FileSpreadsheet, Package } from 'lucide-react'

export default function Reports() {
  const [assets, setAssets] = useState([])
  const [rooms, setRooms] = useState([])
  const [catalog, setCatalog] = useState([])

  useEffect(() => {
    const unsubAssets = onSnapshot(collection(db, 'assets'), (snap) => {
      const list = []
      snap.forEach((d) => list.push({ tag: d.id, ...d.data() }))
      setAssets(list)
    })

    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snap) => {
      const list = []
      snap.forEach((d) => list.push({ code: d.id, ...d.data() }))
      setRooms(list)
    })

    const unsubCat = onSnapshot(collection(db, 'catalog'), (snap) => {
      const list = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setCatalog(list)
    })

    return () => {
      unsubAssets()
      unsubRooms()
      unsubCat()
    }
  }, [])

  // Export Full Master Inventory to Excel
  const handleExportFullExcel = () => {
    const data = assets.map((a) => ({
      BarcodeTag: a.tag,
      CatalogItem: a.catalogName || '',
      RoomCode: a.roomCode || '',
      Status: a.status || 'ok',
      Note: a.note || '',
      CreatedAt: a.createdAt || '',
      LastUpdated: a.updatedAt || ''
    }))

    exportToExcel(data, `JernYafoor-Master-Assets-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // Export Room Summary to Excel
  const handleExportRoomSummaryExcel = () => {
    const roomSummaryMap = {}
    assets.forEach((a) => {
      const r = a.roomCode || 'Unassigned'
      roomSummaryMap[r] = (roomSummaryMap[r] || 0) + 1
    })

    const data = rooms.map((r) => ({
      RoomCode: r.code,
      RoomName: r.name,
      Building: r.building,
      Floor: r.floor,
      Type: r.type,
      AssetCount: roomSummaryMap[r.code] || 0
    }))

    exportToExcel(data, `JernYafoor-Room-Summary-${new Date().toISOString().slice(0, 10)}.xlsx`, 'RoomSummary')
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>Reports & Excel Export</h2>
          <p className="sub-text">Export master asset register and room breakdowns to Excel (.xlsx)</p>
        </div>

        <div className="flex-gap">
          <button className="btn primary sm" onClick={handleExportFullExcel}>
            <FileSpreadsheet size={16} />
            <span>Export Master Register (.xlsx)</span>
          </button>
          <button className="btn outline sm" onClick={handleExportRoomSummaryExcel}>
            <Download size={16} />
            <span>Export Room Summary</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-value">{assets.length}</div>
          <div className="stat-label">Total Assets</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">{rooms.length}</div>
          <div className="stat-label">Total Rooms</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">{catalog.length}</div>
          <div className="stat-label">Catalog Types</div>
        </div>
      </div>

      {/* Breakdown Tables */}
      <div className="reports-tables-grid mt-1">
        <div className="card">
          <h3>Asset Count by Room</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Code</th>
                <th>Room Name</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => {
                const count = assets.filter((a) => a.roomCode === r.code).length
                return (
                  <tr key={r.code}>
                    <td>
                      <strong>{r.code}</strong>
                    </td>
                    <td>{r.name}</td>
                    <td>{count}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
