import { sql } from '@vercel/postgres';

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
 * Uses Vercel Postgres for database queries
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
            console.log(`[PricingEngine] Executing rules for property: ${propertyId}`);

            // Fetch active rules for this property, ordered by priority
            const { rows: rules } = await sql`
                SELECT * FROM pricing_rules 
                WHERE property_id = ${propertyId} 
                AND is_active = true 
                ORDER BY priority DESC
            `;

            console.log(`[PricingEngine] Found ${rules.length} active rules`);

            // Fetch AVAILABLE rooms for this property only
            const { rows: rooms } = await sql`
                SELECT * FROM rooms 
                WHERE property_id = ${propertyId} 
                AND status = 'available'
            `;

            console.log(`[PricingEngine] Found ${rooms.length} available rooms`);

            // Fetch property base price
            const { rows: propertyRows } = await sql`
                SELECT base_price FROM properties WHERE id = ${propertyId} LIMIT 1
            `;

            if (propertyRows.length === 0) {
                console.log(`[PricingEngine] Property ${propertyId} not found`);
                return { success: false, updatedRooms: 0, appliedRules: [] };
            }

            const basePrice = Number(propertyRows[0].base_price) || 100;
            const appliedRuleNames: string[] = [];
            let updatedCount = 0;

            // Process each room
            for (const room of rooms) {
                let finalPrice = basePrice;
                let appliedRulesForRoom: string[] = [];

                // Apply rules in priority order
                for (const rule of rules) {
                    const adjustment = this.evaluateRule(rule as PricingRule, room as Room, basePrice);

                    if (adjustment !== null) {
                        finalPrice = adjustment;
                        appliedRulesForRoom.push(rule.name);

                        if (!appliedRuleNames.includes(rule.name)) {
                            appliedRuleNames.push(rule.name);
                        }
                    }
                }

                // Update room price if changed
                if (Math.round(finalPrice) !== Number(room.current_price)) {
                    const logicReason = appliedRulesForRoom.length > 0
                        ? `Rules applied: ${appliedRulesForRoom.join(', ')}`
                        : 'Base price (no rules matched)';

                    await sql`
                        UPDATE rooms 
                        SET current_price = ${Math.round(finalPrice)},
                            last_logic_reason = ${logicReason}
                        WHERE id = ${room.id}
                    `;

                    updatedCount++;
                    console.log(`[PricingEngine] Updated room ${room.id}: $${room.current_price} -> $${Math.round(finalPrice)}`);
                }
            }

            return {
                success: true,
                updatedRooms: updatedCount,
                appliedRules: appliedRuleNames,
                evaluatedRulesCount: rules.length
            };

        } catch (error) {
            console.error('[PricingEngine] Error executing pricing rules:', error);
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

        // Check date range if specified
        if (rule.date_from && rule.date_to) {
            const from = new Date(rule.date_from);
            from.setHours(0, 0, 0, 0);

            const to = new Date(rule.date_to);
            to.setHours(23, 59, 59, 999); // Include the entire end date

            if (today < from || today > to) {
                return null; // Outside date range
            }
        }

        // Check day of week if specified
        if (rule.days_of_week && rule.days_of_week.length > 0) {
            const dayOfWeek = today.getDay();
            if (!rule.days_of_week.includes(dayOfWeek)) {
                return null; // Wrong day of week
            }
        }

        // Apply rule based on type
        switch (rule.rule_type) {
            case 'last_minute':
                return this.applyAction(basePrice, action);

            case 'length_of_stay':
                return this.applyAction(basePrice, action);

            case 'weekend':
                return this.applyAction(basePrice, action);

            case 'seasonal':
                return this.applyAction(basePrice, action);

            case 'gap_night':
                if (room.status === 'available') {
                    return this.applyAction(basePrice, action);
                }
                return null;

            case 'event_based':
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
            const { rows: properties } = await sql`SELECT id FROM properties`;

            console.log(`[PricingEngine] Found ${properties.length} properties to process`);

            let totalUpdated = 0;

            for (const property of properties) {
                const result = await this.executeRulesForProperty(property.id);
                if (result.success) {
                    totalUpdated += result.updatedRooms;
                }
            }

            return {
                success: true,
                propertiesProcessed: properties.length,
                totalUpdated
            };

        } catch (error) {
            console.error('[PricingEngine] Error executing all rules:', error);
            return {
                success: false,
                propertiesProcessed: 0,
                totalUpdated: 0
            };
        }
    }
}
