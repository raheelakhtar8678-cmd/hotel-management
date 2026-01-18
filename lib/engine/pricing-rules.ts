import { adminClient } from '@/lib/supabase/admin';

interface PricingRule {
    id: string;
    property_id: string;
    name: string;
    rule_type: string;
    priority: number;
    is_active: boolean;
    conditions: any;
    action: any;
    date_from?: string;
    date_to?: string;
    days_of_week?: number[];
    min_nights?: number;
    max_nights?: number;
}

interface Room {
    id: string;
    property_id: string;
    type: string;
    status: string;
    current_price: number;
}

/**
 * Pricing Rule Execution Engine
 * Applies active pricing rules to rooms and calculates adjusted prices
 */
export class PricingEngine {

    /**
     * Apply all active rules to rooms and update prices
     */
    static async executeRulesForProperty(propertyId: string): Promise<{
        success: boolean;
        updatedRooms: number;
        appliedRules: string[];
        evaluatedRulesCount?: number;
    }> {
        try {
            // Fetch active rules for this property, ordered by priority
            const { data: rules, error: rulesError } = await adminClient
                .from('pricing_rules')
                .select('*')
                .eq('property_id', propertyId)
                .eq('is_active', true)
                .order('priority', { ascending: false });

            if (rulesError) throw rulesError;

            // Fetch rooms for this property
            const { data: rooms, error: roomsError } = await adminClient
                .from('rooms')
                .select('*')
                .eq('property_id', propertyId);

            if (roomsError) throw roomsError;

            // Fetch property base price
            const { data: property, error: propertyError } = await adminClient
                .from('properties')
                .select('base_price')
                .eq('id', propertyId)
                .single();

            if (propertyError) throw propertyError;

            const basePrice = property.base_price || 100;
            const appliedRuleNames: string[] = [];
            let updatedCount = 0;

            // Process each room
            for (const room of rooms || []) {
                let finalPrice = basePrice;
                let appliedRules: string[] = [];

                // Apply rules in priority order
                for (const rule of rules || []) {
                    const adjustment = this.evaluateRule(rule, room, basePrice);

                    if (adjustment !== null) {
                        finalPrice = adjustment;
                        appliedRules.push(rule.name);

                        if (!appliedRuleNames.includes(rule.name)) {
                            appliedRuleNames.push(rule.name);
                        }
                    }
                }

                // Update room price if changed
                if (finalPrice !== room.current_price) {
                    await adminClient
                        .from('rooms')
                        .update({
                            current_price: Math.round(finalPrice),
                            last_logic_reason: appliedRules.length > 0
                                ? `Rules applied: ${appliedRules.join(', ')}`
                                : 'Base price (no rules matched)'
                        })
                        .eq('id', room.id);

                    updatedCount++;
                }
            }

            return {
                success: true,
                updatedRooms: updatedCount,
                appliedRules: appliedRuleNames,
                evaluatedRulesCount: rules?.length || 0
            };

        } catch (error) {
            console.error('Error executing pricing rules:', error);
            return {
                success: false,
                updatedRooms: 0,
                appliedRules: []
            };
        }
    }

    /**
     * Evaluate a single rule against a room
     * Returns the adjusted price or null if rule doesn't apply
     */
    private static evaluateRule(rule: PricingRule, room: Room, basePrice: number): number | null {
        // Normalize today to midnight for date comparisons
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const conditions = rule.conditions || {};
        const action = rule.action || {};

        console.log(`Evaluating rule ${rule.name} (ID: ${rule.id}) for room ${room.id}`);

        // Check date range if specified
        if (rule.date_from && rule.date_to) {
            const from = new Date(rule.date_from);
            from.setHours(0, 0, 0, 0);

            const to = new Date(rule.date_to);
            to.setHours(23, 59, 59, 999); // Include the entire end date

            console.log(`  Date check: Today ${today.toISOString()} vs Range ${from.toISOString()} - ${to.toISOString()}`);

            if (today < from || today > to) {
                console.log('  -> Failed date range');
                return null; // Outside date range
            }
        }

        // Check day of week if specified
        if (rule.days_of_week && rule.days_of_week.length > 0) {
            const dayOfWeek = today.getDay();
            if (!rule.days_of_week.includes(dayOfWeek)) {
                console.log(`  -> Failed day of week: Today ${dayOfWeek} vs Allowed [${rule.days_of_week.join(',')}]`);
                return null; // Wrong day of week
            }
        }

        // Apply rule based on type
        switch (rule.rule_type) {
            case 'last_minute':
                // Last-minute rules always apply (would need booking date to be more specific)
                return this.applyAction(basePrice, action);

            case 'length_of_stay':
                // Length of stay rules always apply (would need booking details)
                return this.applyAction(basePrice, action);

            case 'weekend':
                // Weekend rules check day of week (already checked above)
                return this.applyAction(basePrice, action);

            case 'seasonal':
                // Seasonal rules check date range (already checked above)
                return this.applyAction(basePrice, action);

            case 'gap_night':
                // Gap night detection would require calendar analysis
                // For now, apply to available rooms
                if (room.status === 'available') {
                    return this.applyAction(basePrice, action);
                }
                return null;

            case 'event_based':
                // Event-based rules check date range
                return this.applyAction(basePrice, action);

            default:
                return null;
        }
    }

    /**
     * Apply pricing action (discount or surge)
     */
    private static applyAction(basePrice: number, action: any): number {
        const actionType = action.type || 'discount';
        const value = action.value || 0;

        if (actionType === 'discount') {
            return basePrice * (1 - value / 100);
        } else if (actionType === 'surge') {
            return basePrice * (1 + value / 100);
        }

        return basePrice;
    }

    /**
     * Execute rules for all properties
     */
    static async executeAllRules(): Promise<{
        success: boolean;
        propertiesProcessed: number;
        totalUpdated: number;
    }> {
        try {
            const { data: properties } = await adminClient
                .from('properties')
                .select('id');

            let totalUpdated = 0;

            for (const property of properties || []) {
                const result = await this.executeRulesForProperty(property.id);
                if (result.success) {
                    totalUpdated += result.updatedRooms;
                }
            }

            return {
                success: true,
                propertiesProcessed: properties?.length || 0,
                totalUpdated
            };

        } catch (error) {
            console.error('Error executing all rules:', error);
            return {
                success: false,
                propertiesProcessed: 0,
                totalUpdated: 0
            };
        }
    }
}
