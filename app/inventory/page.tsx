import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { adminClient } from "@/lib/supabase/admin";
import { Plus } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function InventoryPage() {
    let properties = [];
    let rooms = [];
    let propertyMap = new Map();

    try {
        const { data: pData, error: pError } = await adminClient.from('properties').select('*');
        if (pError) throw pError;
        properties = pData || [];

        const { data: rData, error: rError } = await adminClient.from('rooms').select('*');
        if (rError) throw rError;
        rooms = rData || [];

        propertyMap = new Map(properties?.map(p => [p.id, p]));
    } catch (e) {
        console.warn("Using Mock Data for Inventory");
        properties = [{ id: 'prop-1', name: 'Grand Hotel', base_price: 150 }];
        propertyMap = new Map([['prop-1', properties[0]]]);
        rooms = [
            { id: '101', property_id: 'prop-1', type: 'Suite', status: 'available', current_price: 150, last_logic_reason: 'Standard Demand' },
            { id: '102', property_id: 'prop-1', type: 'Deluxe', status: 'occupied', current_price: 180, last_logic_reason: 'High Demand: +20%' },
            { id: '103', property_id: 'prop-1', type: 'Standard', status: 'available', current_price: 110, last_logic_reason: 'Low Demand: Min Price applied' },
        ];
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight gradient-text">
                        Inventory
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage rooms and pricing across all properties
                    </p>
                </div>
                <Link href="/inventory/add-room">
                    <Button className="bg-gradient-primary hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Room
                    </Button>
                </Link>
            </div>

            <div className="border rounded-md border-primary/20">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Room ID</TableHead>
                            <TableHead>Property</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Base Price</TableHead>
                            <TableHead>Live Price</TableHead>
                            <TableHead>Logic Breakdown</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rooms?.map((room) => {
                            const property = propertyMap.get(room.property_id);
                            return (
                                <TableRow key={room.id}>
                                    <TableCell className="font-medium">{room.id.slice(0, 8)}...</TableCell>
                                    <TableCell>{property?.name}</TableCell>
                                    <TableCell>{room.type}</TableCell>
                                    <TableCell>
                                        <Badge variant={room.status === 'available' ? 'default' : 'secondary'}>
                                            {room.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>${property?.base_price}</TableCell>
                                    <TableCell className="font-bold text-emerald-600">
                                        ${room.current_price ?? property?.base_price}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {room.last_logic_reason || 'Standard Demand'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {rooms.length === 0 && (
                <div className="border rounded-md border-primary/20 p-12 text-center">
                    <Plus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Rooms Yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Add rooms to your properties to start managing inventory
                    </p>
                    <Link href="/inventory/add-room">
                        <Button className="bg-gradient-primary">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Room
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
