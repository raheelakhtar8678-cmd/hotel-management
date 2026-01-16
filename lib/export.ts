// Export utilities for data
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
                // Handle values with commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportBookingsToCSV(bookings: any[]) {
    const formattedData = bookings.map(b => ({
        'Booking ID': b.id.slice(0, 8),
        'Guest Name': b.guest_name,
        'Property': b.property_name || '',
        'Room': b.room_type || '',
        'Check-in': new Date(b.check_in).toLocaleDateString(),
        'Check-out': new Date(b.check_out).toLocaleDateString(),
        'Total Paid': `$${b.total_paid.toFixed(2)}`,
        'Status': b.status,
        'Created': new Date(b.created_at).toLocaleDateString()
    }));

    exportToCSV(formattedData, `bookings_${new Date().toISOString().split('T')[0]}`);
}

export function exportPropertiesToCSV(properties: any[]) {
    const formattedData = properties.map(p => ({
        'Property ID': p.id.slice(0, 8),
        'Name': p.name,
        'Type': p.property_type,
        'City': p.city,
        'Country': p.country,
        'Base Price': `$${p.base_price}`,
        'Min Price': `$${p.min_price}`,
        'Max Price': `$${p.max_price}`,
        'Active': p.is_active ? 'Yes' : 'No'
    }));

    exportToCSV(formattedData, `properties_${new Date().toISOString().split('T')[0]}`);
}

export function exportRevenueToCSV(data: any[], dateRange: string) {
    exportToCSV(data, `revenue_report_${dateRange}_${new Date().toISOString().split('T')[0]}`);
}
