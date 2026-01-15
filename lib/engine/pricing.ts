import { adminClient } from '@/lib/supabase/admin';
import { differenceInDays } from 'date-fns';

// Constants (These could be fetched from DB system_settings but we fallback to defaults)
const DEFAULT_MIN_PRICE = 50;
const DEFAULT_BASE_PRICE = 100;
const DEFAULT_SURGE_MULTIPLIER = 1.2;

interface PricingContext {
    propertyId: string;
    basePrice: number;
    minPrice: number;
    maxPrice: number;
}

export async function calculateOccupancy(propertyId: string, date: Date): Promise<number> {
    // Count total rooms for property
    const { count: totalRooms, error: roomError } = await adminClient
        .from('rooms')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', propertyId)
        .neq('status', 'maintenance'); // Exclude maintenance rooms?

    if (roomError || totalRooms === null || totalRooms === 0) return 0;

    // Count booked rooms for this date
    // Booking covers the night of 'date'. Check-in <= date < check-out.
    const dateStr = date.toISOString().split('T')[0];

    const { count: bookedRooms, error: bookingError } = await adminClient
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .filter('room_id', 'in', (
            await adminClient.from('rooms').select('id').eq('property_id', propertyId)
        ).data?.map(r => r.id) || []
        )
        .lte('check_in', dateStr)
        .gt('check_out', dateStr)
        .neq('status', 'cancelled');

    if (bookingError || bookedRooms === null) return 0;

    return (bookedRooms / totalRooms); // Returns 0.0 to 1.0
}

export async function determinePrice(
    propertyId: string,
    basePrice: number,
    minPrice: number,
    maxPrice: number,
    targetDate: Date = new Date() // Default to pricing for 'today' (or tomorrow?)
): Promise<{ price: number; reason: string }> {

    // Fetch settings for dynamic multipliers if needed
    const { data: settings } = await adminClient.from('system_settings').select('*');
    const surgeMultiplier = parseFloat(settings?.find(s => s.key === 'SURGE_MULTIPLIER')?.value || String(DEFAULT_SURGE_MULTIPLIER));

    const occupancy = await calculateOccupancy(propertyId, targetDate);
    const daysUntil = differenceInDays(targetDate, new Date());

    let price = basePrice;
    let reason = 'Standard Demand';

    const occupancyPct = occupancy * 100;

    // 1. Low Demand (<40%)
    if (occupancyPct < 40) {
        price = minPrice;
        reason = `Low Demand (<40% occ): Set to Min Price`;
    }
    // 2. Standard Demand (40-70%)
    else if (occupancyPct >= 40 && occupancyPct <= 70) {
        price = basePrice;
        reason = `Standard Demand (40-70% occ): Set to Base Price`;
    }
    // 3. High Demand (>70%)
    else if (occupancyPct > 70) {
        // Increase price by 15% for every 10% increase in occupancy
        // E.g. 71-80% -> +15%, 81-90% -> +30%? 
        // "Increase price by 15% for every 10% increase in occupancy" -> this usually means above the threshold?
        // Let's assume: (occupancy - 0.70) / 0.10 * 0.15
        const steps = Math.floor((occupancyPct - 70) / 10) + 1; // 75% -> 0 steps? No "increase in occupancy". 
        // "High Demand (>70%)"
        // Let's say 75% -> 1 step of 10% bracket? 
        // 70-80 -> 1x 15%? 
        // Let's implement: For every 10% over 70%.
        // 71-80: +15%
        // 81-90: +30%
        // 91-100: +45%
        const increaseSteps = Math.ceil((occupancyPct - 70) / 10);
        const increase = basePrice * (0.15 * increaseSteps);
        price = basePrice + increase;
        reason = `High Demand (${occupancyPct.toFixed(1)}% occ): +${(increaseSteps * 15)}%`;
    }

    // 4. Last Minute Spike
    // If booking date is within 48 hours (0-2 days) and occupancy > 80%
    // logic: "booking date is within 48 hours" refer to 'daysUntilBooking'
    if (daysUntil <= 2 && occupancyPct > 80) {
        price = price + (price * (surgeMultiplier - 1)); // Add 20% premium logic (surgeMultiplier default 1.2)
        reason += ` + Last Minute Surge (>80% occ, <48h)`;
    }

    // Cap at Max Price
    if (price > maxPrice) {
        price = maxPrice;
        reason += ` (Capped at Max)`;
    }

    return { price: Math.round(price), reason };
}
