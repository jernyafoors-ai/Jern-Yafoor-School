import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import AssetCard from '../components/AssetCard'
import { ArrowLeft, DoorOpen, Package, Printer } from 'lucide-react'
import { generateRoomLabelPDF } from '../lib/pdf'

export default function RoomDetail() {
  const { roomCode } = useParams()
  const [room, setRoom] = useState(null)
  const [assets, setAssets] = useState([])
  const [catalogMap, setCatalogMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch Room info
    getDoc(doc(db, 'rooms', roomCode)).then((snap) => {
      if (snap.exists()) {
        setRoom({ code: snap.id, ...snap.data() })
      }
    })

    // Fetch Catalog Map
    const unsubCat = onSnapshot(collection(db, 'catalog'), (snap) => {
      const map = {}
      snap.forEach((d) => (map[d.id] = { id: d.id, ...d.data() }))
      setCatalogMap(map)
    })

    // Fetch Assets currently in this room
    const q = query(collection(db, 'assets'), where('roomCode', '==', roomCode))
    const unsubAssets = onSnapshot(q, (snap) => {
      const list = []
      snap.forEach((d) => list.push({ tag: d.id, ...d.data() }))
      setAssets(list)
      setLoading(false)
    })

    return () => {
      unsubCat()
      unsubAssets()
    }
  }, [roomCode])

  // Group assets by Catalog Type
  const groupedAssets = {}
  assets.forEach((asset) => {
    const catId = asset.catalogId || 'unknown'
    if (!groupedAssets[catId]) {
      groupedAssets[catId] = {
        catalog: catalogMap[catId] || { name: asset.catalogName || 'Unregistered Type' },
        items: []
      }
    }
    groupedAssets[catId].items.push(asset)
  })

  return (
    <div className="page-container">
      <div className="back-bar">
        <Link to="/rooms" className="btn ghost sm">
          <ArrowLeft size={16} />
          <span>Back to Rooms</span>
        </Link>
      </div>

      <div className="room-detail-header card flex-between">
        <div>
          <span className="room-code-tag lg">{roomCode}</span>
          <h2>{room?.name || 'Room Details'}</h2>
          <p className="sub-text">
            {room?.building} • {room?.floor} • Total Assets: {assets.length}
          </p>
        </div>

        {room && (
          <button className="btn outline sm" onClick={() => generateRoomLabelPDF(room)}>
            <Printer size={16} />
            <span>Label PDF</span>
          </button>
        )}
      </div>

      <h3 className="section-title">Assets in Room ({assets.length})</h3>

      {loading ? (
        <p className="center">Loading room assets…</p>
      ) : assets.length === 0 ? (
        <div className="empty-card card center">
          <Package size={36} className="icon-muted" />
          <p>No assets currently registered in this room.</p>
        </div>
      ) : (
        <div className="grouped-assets-list">
          {Object.entries(groupedAssets).map(([catId, group]) => (
            <div key={catId} className="catalog-group-card card">
              <div className="group-header flex-between">
                <div className="flex-row">
                  {group.catalog?.photo ? (
                    <img src={group.catalog.photo} alt="Cat" className="asset-thumb sm" />
                  ) : (
                    <div className="asset-thumb-placeholder sm">
                      <Package size={18} />
                    </div>
                  )}
                  <div>
                    <h4>{group.catalog?.name || 'Item Group'}</h4>
                    <span className="sub-text">Category: {group.catalog?.category || 'General'}</span>
                  </div>
                </div>

                <span className="badge count-badge">Quantity: {group.items.length}</span>
              </div>

              <div className="group-items-list">
                {group.items.map((asset) => (
                  <AssetCard
                    key={asset.tag}
                    asset={asset}
                    catalogItem={catalogMap[asset.catalogId]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
