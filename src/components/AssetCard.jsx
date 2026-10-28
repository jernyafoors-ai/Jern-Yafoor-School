import { Tag, MapPin, Package } from 'lucide-react'

export default function AssetCard({ asset, catalogItem, onAction, actionLabel }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ok':
        return <span className="badge success">OK</span>
      case 'damaged':
        return <span className="badge warning">Damaged</span>
      case 'in_repair':
        return <span className="badge info">In Repair</span>
      case 'written_off':
        return <span className="badge danger">Written Off</span>
      case 'out':
        return <span className="badge dark">Transferred Out</span>
      default:
        return <span className="badge neutral">{status || 'OK'}</span>
    }
  }

  const photoUrl = asset.photo || catalogItem?.photo

  return (
    <div className="asset-card card flex-row">
      {photoUrl ? (
        <img src={photoUrl} alt="Asset" className="asset-thumb" />
      ) : (
        <div className="asset-thumb-placeholder">
          <Package size={24} />
        </div>
      )}

      <div className="asset-info flex-grow">
        <div className="flex-between">
          <span className="asset-tag">
            <Tag size={14} /> #{asset.tag}
          </span>
          {getStatusBadge(asset.status)}
        </div>

        <h4 className="asset-title">{catalogItem?.name || asset.catalogName || 'Unknown Item'}</h4>

        <div className="asset-meta">
          <span className="meta-item">
            <MapPin size={12} /> {asset.roomCode || 'Unassigned'}
          </span>
          {catalogItem?.category && <span className="meta-category">• {catalogItem.category}</span>}
        </div>

        {asset.note && <p className="asset-note">Note: {asset.note}</p>}
      </div>

      {actionLabel && onAction && (
        <button className="btn sm outline" onClick={() => onAction(asset)}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
