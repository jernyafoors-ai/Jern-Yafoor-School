import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { generateTransferPDF } from '../lib/pdf'
import { Truck, FileText, Calendar, MapPin, UserCheck } from 'lucide-react'

export default function TransferHistory() {
  const [transfers, setTransfers] = useState([])
  const [catalogMap, setCatalogMap] = useState({})

  useEffect(() => {
    // Fetch Transfers
    const unsubTrf = onSnapshot(collection(db, 'transfers'), (snap) => {
      const list = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
      setTransfers(list)
    })

    // Fetch Catalog Map
    const unsubCat = onSnapshot(collection(db, 'catalog'), (snap) => {
      const map = {}
      snap.forEach((d) => (map[d.id] = { id: d.id, ...d.data() }))
      setCatalogMap(map)
    })

    return () => {
      unsubTrf()
      unsubCat()
    }
  }, [])

  const handleRebuildPDF = async (transfer) => {
    try {
      const items = transfer.itemsSnapshot || []
      await generateTransferPDF(transfer, items, catalogMap)
    } catch (err) {
      alert('Error generating PDF: ' + err.message)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Transfer Out History</h2>
        <p className="sub-text">View past asset transfers and regenerate official PDF forms</p>
      </div>

      {transfers.length === 0 ? (
        <div className="empty-card card center">
          <Truck size={40} className="icon-muted" />
          <p>No transfer records found.</p>
        </div>
      ) : (
        <div className="transfers-list">
          {transfers.map((trf) => (
            <div key={trf.id} className="transfer-card card">
              <div className="flex-between border-bottom pb-1">
                <div>
                  <span className="badge dark lg">{trf.id}</span>
                  <h3 className="mt-05">To: {trf.destinationSite || 'Destination'}</h3>
                </div>

                <button className="btn outline sm" onClick={() => handleRebuildPDF(trf)}>
                  <FileText size={16} />
                  <span>Generate Form Again</span>
                </button>
              </div>

              <div className="transfer-details-grid mt-1">
                <div className="detail-item">
                  <Calendar size={14} className="icon-muted" />
                  <span>Date: {trf.createdAt || 'N/A'}</span>
                </div>

                <div className="detail-item">
                  <Truck size={14} className="icon-muted" />
                  <span>Vehicle: {trf.vehicleNo || 'N/A'}</span>
                </div>

                <div className="detail-item">
                  <UserCheck size={14} className="icon-muted" />
                  <span>Carried By: {trf.carriedBy || 'N/A'}</span>
                </div>

                <div className="detail-item">
                  <UserCheck size={14} className="icon-muted" />
                  <span>Authorized By: {trf.authorizedBy || 'N/A'}</span>
                </div>
              </div>

              <div className="items-summary-bar mt-1">
                Total Items: <strong>{trf.itemCount || trf.itemsSnapshot?.length || 0}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
