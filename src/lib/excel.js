import * as XLSX from 'xlsx'

/**
 * Export array of objects to Excel file (.xlsx)
 */
export function exportToExcel(data, fileName = 'asset-report.xlsx', sheetName = 'Assets') {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, fileName)
}
