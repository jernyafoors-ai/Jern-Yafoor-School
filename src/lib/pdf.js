import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'

/**
 * Generate QR Data URL for a string
 */
export async function generateQRDataUrl(text) {
  try {
    return await QRCode.toDataURL(text, { margin: 1, width: 250 })
  } catch {
    return null
  }
}

/**
 * Generate single printable room label PDF
 */
export async function generateRoomLabelPDF(room) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 120] // 100mm x 120mm label size
  })

  const qrUrl = await generateQRDataUrl(room.code)

  // Title / School Header
  doc.setFillColor(20, 52, 43) // #14342b
  doc.rect(0, 0, 100, 15, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('JERN YAFOOR SCHOOL', 50, 9, { align: 'center' })

  // QR Code
  if (qrUrl) {
    doc.addImage(qrUrl, 'PNG', 20, 20, 60, 60)
  }

  // Room Code Text
  doc.setTextColor(20, 52, 43)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(room.code, 50, 88, { align: 'center' })

  // Room Name
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(room.name || 'Room', 50, 97, { align: 'center' })

  // Building & Floor
  doc.setFontSize(9)
  doc.text(`${room.building} • ${room.floor}`, 50, 104, { align: 'center' })

  doc.save(`Room-Label-${room.code}.pdf`)
}

/**
 * Generate PDF with grid of all room labels (6 per A4 page)
 */
export async function generateAllRoomLabelsPDF(rooms) {
  const doc = new jsPDF('portrait', 'mm', 'a4')
  const pageWidth = 210
  const pageHeight = 297

  const labelWidth = 85
  const labelHeight = 80
  const cols = 2
  const rows = 3
  const marginX = (pageWidth - cols * labelWidth) / 3 // ~13.3mm
  const marginY = (pageHeight - rows * labelHeight) / 4 // ~14.2mm

  let count = 0

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i]
    if (count > 0 && count % (cols * rows) === 0) {
      doc.addPage()
    }

    const indexOnPage = count % (cols * rows)
    const col = indexOnPage % cols
    const row = Math.floor(indexOnPage / cols)

    const x = marginX + col * (labelWidth + marginX)
    const y = marginY + row * (labelHeight + marginY)

    // Border
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.rect(x, y, labelWidth, labelHeight)

    // Header Bar
    doc.setFillColor(20, 52, 43)
    doc.rect(x, y, labelWidth, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('JERN YAFOOR SCHOOL', x + labelWidth / 2, y + 6.5, { align: 'center' })

    // QR Code
    const qrUrl = await generateQRDataUrl(room.code)
    if (qrUrl) {
      doc.addImage(qrUrl, 'PNG', x + (labelWidth - 38) / 2, y + 13, 38, 38)
    }

    // Code & Name
    doc.setTextColor(20, 52, 43)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(room.code, x + labelWidth / 2, y + 57, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(room.name || 'Room', x + labelWidth / 2, y + 64, { align: 'center' })

    doc.setFontSize(8)
    doc.text(`${room.building} | ${room.floor}`, x + labelWidth / 2, y + 71, { align: 'center' })

    count++
  }

  doc.save('All-Room-Labels.pdf')
}

/**
 * Generate Transfer Out Form PDF
 */
export async function generateTransferPDF(transfer, items = [], catalogMap = {}) {
  const doc = new jsPDF('portrait', 'mm', 'a4')

  // Top Header: School Name & Logos
  doc.setFillColor(20, 52, 43)
  doc.rect(0, 0, 210, 24, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('JERN YAFOOR SCHOOL', 15, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Asset Transfer & Removal Form', 15, 18)

  doc.setFontSize(8)
  doc.text('NCE LOGICAL SYSTEM', 195, 15, { align: 'right' })

  // Document Details Box
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')

  doc.text(`Transfer ID: ${transfer.id || 'N/A'}`, 15, 33)
  doc.text(`Date & Time: ${transfer.createdAt || new Date().toLocaleString()}`, 110, 33)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Destination Site: ${transfer.destinationSite || 'N/A'}`, 15, 40)
  doc.text(`Vehicle Number: ${transfer.vehicleNo || 'N/A'}`, 110, 40)

  doc.text(`Carried By: ${transfer.carriedBy || 'N/A'}`, 15, 46)
  doc.text(`Authorized By: ${transfer.authorizedBy || 'N/A'}`, 110, 46)
  doc.text(`Received By: ${transfer.receivedBy || 'N/A'}`, 15, 52)
  doc.text(`Total Items: ${items.length}`, 110, 52)

  // Summary Table by Catalog Item Type
  const summaryMap = {}
  items.forEach((item) => {
    const catName = item.catalogName || catalogMap[item.catalogId]?.name || 'Uncategorized'
    summaryMap[catName] = (summaryMap[catName] || 0) + 1
  })

  const summaryRows = Object.entries(summaryMap).map(([type, count]) => [type, count])

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Items Summary', 15, 60)

  autoTable(doc, {
    startY: 63,
    head: [['Asset Type / Catalog Name', 'Quantity']],
    body: summaryRows,
    theme: 'grid',
    headStyles: { fillColor: [20, 52, 43], textColor: [255, 255, 255] },
    styles: { fontSize: 8 }
  })

  // Full Item List Table
  const finalY = doc.lastAutoTable.finalY + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Detailed Asset List', 15, finalY)

  const tableBody = items.map((item, index) => {
    const cat = catalogMap[item.catalogId] || {}
    return [
      index + 1,
      item.tag || 'N/A',
      item.catalogName || cat.name || 'N/A',
      cat.category || 'General',
      item.fromRoom || item.roomCode || 'N/A'
    ]
  })

  autoTable(doc, {
    startY: finalY + 3,
    head: [['#', 'Barcode Tag', 'Catalog Name', 'Category', 'Source Room']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [31, 122, 92], textColor: [255, 255, 255] },
    styles: { fontSize: 8 }
  })

  // Signature Block
  const sigY = doc.lastAutoTable.finalY + 25

  // Ensure signatures fit on page
  if (sigY > 260) {
    doc.addPage()
  }

  const currentSigY = sigY > 260 ? 40 : sigY

  doc.setDrawColor(100, 100, 100)
  doc.line(15, currentSigY, 65, currentSigY)
  doc.line(80, currentSigY, 130, currentSigY)
  doc.line(145, currentSigY, 195, currentSigY)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(50, 50, 50)
  doc.text('Carried By (Signature)', 40, currentSigY + 5, { align: 'center' })
  doc.text('Authorized By (Signature)', 105, currentSigY + 5, { align: 'center' })
  doc.text('Received By (Signature)', 170, currentSigY + 5, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.text(transfer.carriedBy || '', 40, currentSigY + 10, { align: 'center' })
  doc.text(transfer.authorizedBy || '', 105, currentSigY + 10, { align: 'center' })
  doc.text(transfer.receivedBy || '', 170, currentSigY + 10, { align: 'center' })

  doc.save(`Transfer-${transfer.id || 'Form'}.pdf`)
}
