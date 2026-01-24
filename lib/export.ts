'use client';

/**
 * Data Export Utilities
 * Exports data to CSV and XLSX formats without heavy dependencies
 */

// ============================================
// Core Export Functions
// ============================================

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
        console.error('No data to export');
        return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Handle null/undefined
                if (value === null || value === undefined) return '';
                // Handle values with commas, quotes, or newlines
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    // Create blob and download
    downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export to XLSX format (Excel-compatible HTML table)
 * Works without external dependencies
 */
export function exportToXLSX(data: any[], filename: string, sheetName: string = 'Sheet1') {
    if (!data || data.length === 0) {
        console.error('No data to export');
        return;
    }

    const headers = Object.keys(data[0]);

    // Create HTML table with Excel styling
    let tableHtml = '<table>';

    // Headers
    tableHtml += '<tr>';
    headers.forEach(header => {
        tableHtml += `<th style="background-color:#0066cc;color:white;font-weight:bold;padding:8px;border:1px solid #ccc;">${escapeHtml(header)}</th>`;
    });
    tableHtml += '</tr>';

    // Data rows
    data.forEach((row, index) => {
        const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
        tableHtml += '<tr>';
        headers.forEach(header => {
            const value = row[header];
            const displayValue = value === null || value === undefined ? '' : String(value);
            tableHtml += `<td style="background-color:${bgColor};padding:6px;border:1px solid #e2e8f0;">${escapeHtml(displayValue)}</td>`;
        });
        tableHtml += '</tr>';
    });

    tableHtml += '</table>';

    // Create Excel-compatible HTML file
    const excelContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:x="urn:schemas-microsoft-com:office:excel" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>${sheetName}</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
        </head>
        <body>
            ${tableHtml}
        </body>
        </html>
    `;

    downloadFile(excelContent, `${filename}.xls`, 'application/vnd.ms-excel');
}

/**
 * Download content as a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m] || m);
}

// ============================================
// Pre-configured Export Functions
// ============================================

export function exportBookingsToCSV(bookings: any[]) {
    const formattedData = bookings.map(b => ({
        'Booking ID': b.id?.slice(0, 8) || '',
        'Guest Name': b.guest_name || '',
        'Email': b.guest_email || '',
        'Property': b.property_name || '',
        'Room': b.room_type || '',
        'Check-in': b.check_in ? new Date(b.check_in).toLocaleDateString() : '',
        'Check-out': b.check_out ? new Date(b.check_out).toLocaleDateString() : '',
        'Total Paid': b.total_paid ? `$${Number(b.total_paid).toFixed(2)}` : '$0.00',
        'Refund': b.refund_amount ? `$${Number(b.refund_amount).toFixed(2)}` : '',
        'Status': b.status || '',
        'Channel': b.channel || '',
        'Created': b.created_at ? new Date(b.created_at).toLocaleDateString() : ''
    }));

    exportToCSV(formattedData, `bookings_${new Date().toISOString().split('T')[0]}`);
}

export function exportBookingsToXLSX(bookings: any[]) {
    const formattedData = bookings.map(b => ({
        'Booking ID': b.id?.slice(0, 8) || '',
        'Guest Name': b.guest_name || '',
        'Email': b.guest_email || '',
        'Property': b.property_name || '',
        'Room': b.room_type || '',
        'Check-in': b.check_in ? new Date(b.check_in).toLocaleDateString() : '',
        'Check-out': b.check_out ? new Date(b.check_out).toLocaleDateString() : '',
        'Total Paid': b.total_paid ? `$${Number(b.total_paid).toFixed(2)}` : '$0.00',
        'Refund': b.refund_amount ? `$${Number(b.refund_amount).toFixed(2)}` : '',
        'Status': b.status || '',
        'Channel': b.channel || '',
        'Created': b.created_at ? new Date(b.created_at).toLocaleDateString() : ''
    }));

    exportToXLSX(formattedData, `bookings_${new Date().toISOString().split('T')[0]}`, 'Bookings');
}

export function exportPropertiesToCSV(properties: any[]) {
    const formattedData = properties.map(p => ({
        'Property ID': p.id?.slice(0, 8) || '',
        'Name': p.name || '',
        'Type': p.property_type || '',
        'City': p.city || '',
        'Country': p.country || '',
        'Base Price': p.base_price ? `$${p.base_price}` : '',
        'Min Price': p.min_price ? `$${p.min_price}` : '',
        'Max Price': p.max_price ? `$${p.max_price}` : '',
        'Active': p.is_active ? 'Yes' : 'No'
    }));

    exportToCSV(formattedData, `properties_${new Date().toISOString().split('T')[0]}`);
}

export function exportPropertiesToXLSX(properties: any[]) {
    const formattedData = properties.map(p => ({
        'Property ID': p.id?.slice(0, 8) || '',
        'Name': p.name || '',
        'Type': p.property_type || '',
        'City': p.city || '',
        'Country': p.country || '',
        'Base Price': p.base_price ? `$${p.base_price}` : '',
        'Min Price': p.min_price ? `$${p.min_price}` : '',
        'Max Price': p.max_price ? `$${p.max_price}` : '',
        'Active': p.is_active ? 'Yes' : 'No'
    }));

    exportToXLSX(formattedData, `properties_${new Date().toISOString().split('T')[0]}`, 'Properties');
}

export function exportRevenueToCSV(data: any[], dateRange: string) {
    exportToCSV(data, `revenue_report_${dateRange}_${new Date().toISOString().split('T')[0]}`);
}

export function exportRevenueToXLSX(data: any[], dateRange: string) {
    exportToXLSX(data, `revenue_report_${dateRange}_${new Date().toISOString().split('T')[0]}`, 'Revenue');
}
