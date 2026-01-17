import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sql } from '@vercel/postgres';
import { DollarSign, TrendingUp, Users, Calendar, RotateCcw } from "lucide-react";
import { RevenuePaceChart } from "@/components/charts/revenue-pace-chart";
import { DemandHeatmap } from "@/components/charts/demand-heatmap";
import { ChannelHealthChart } from "@/components/charts/channel-health-chart";
import { AIInsightsPanel } from "@/components/ai-insights-panel";
import { RecentActivityWidget } from "@/components/recent-activity-widget";

export const revalidate = 0; // Disable cache for real-time data

export default async function Dashboard() {
  let totalRevenue = 0;
  let revenueLift = 0;
  let liftPercentage = "0.0";
  let occupancyRate = "0";
  let occupiedCount = 0;
  let totalRoomCount = 0;
  let liftVal = 0;
  let totalRefunds = 0;
  let refundCount = 0;
  let netRevenue = 0;

  try {
    // Fetch bookings using Vercel Postgres
    const { rows: bookings } = await sql`
      SELECT total_paid, check_in, check_out, room_id 
      FROM bookings 
      WHERE status = 'confirmed'
    `;

    const { rows: properties } = await sql`SELECT id, base_price FROM properties`;
    const { rows: rooms } = await sql`SELECT id, property_id FROM rooms`;

    // Fetch refund data
    const { rows: refundData } = await sql`
      SELECT COALESCE(SUM(refund_amount), 0) as total_refunds,
             COUNT(CASE WHEN refund_amount > 0 THEN 1 END) as refund_count
      FROM bookings 
      WHERE refund_amount > 0
    `;
    totalRefunds = Number(refundData[0]?.total_refunds) || 0;
    refundCount = Number(refundData[0]?.refund_count) || 0;

    totalRevenue = bookings.reduce((acc: number, b: any) => acc + (Number(b.total_paid) || 0), 0);
    netRevenue = totalRevenue - totalRefunds;

    let baseRevenue = 0;
    if (bookings && rooms && properties) {
      for (const booking of bookings) {
        const room = rooms.find((r: any) => r.id === booking.room_id);
        const property = properties.find((p: any) => p.id === room?.property_id);
        if (property) {
          const start = new Date(booking.check_in);
          const end = new Date(booking.check_out);
          const nights = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 3600 * 24));
          baseRevenue += (Number(property.base_price) * nights);
        }
      }
    }
    revenueLift = totalRevenue - baseRevenue;
    liftVal = baseRevenue > 0 ? (revenueLift / baseRevenue) * 100 : 0;
    liftPercentage = liftVal.toFixed(1);

    totalRoomCount = rooms.length;
    const today = new Date().toISOString().split('T')[0];
    occupiedCount = bookings.filter((b: any) => b.check_in <= today && b.check_out > today).length;
    occupancyRate = totalRoomCount ? ((occupiedCount / totalRoomCount) * 100).toFixed(0) : "0";

  } catch (err) {
    console.warn("Using Mock Data (DB connection failed)", err);
    totalRevenue = 124500;
    revenueLift = 24500;
    liftPercentage = "24.5";
    liftVal = 24.5;
    occupancyRate = "78";
    occupiedCount = 42;
    totalRoomCount = 54;
    totalRefunds = 2500;
    refundCount = 3;
    netRevenue = totalRevenue - totalRefunds;
  }

  return (
    <div className="flex-1 p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight gradient-text">
          Dashboard
        </h2>
      </div>

      {/* Main Layout: 70% Content + 30% AI Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Main Content Area - 70% */}
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="glass-card hover-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${netRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">After {refundCount} refunds</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
                <RotateCcw className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">-${totalRefunds.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{refundCount} booking{refundCount !== 1 ? 's' : ''} refunded</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Lift</CardTitle>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">+${revenueLift.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {liftVal > 0 ? '+' : ''}{liftPercentage}% over base price
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                <Users className="h-5 w-5 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{occupancyRate}%</div>
                <p className="text-xs text-muted-foreground">{occupiedCount} / {totalRoomCount} rooms booked</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-glow transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                <Calendar className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{occupiedCount}</div>
                <p className="text-xs text-muted-foreground">Checked in right now</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Pace Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Revenue Pace</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comparing this year's performance vs. last year
              </p>
            </CardHeader>
            <CardContent>
              <RevenuePaceChart />
            </CardContent>
          </Card>

          {/* Demand Heatmap */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <DemandHeatmap />
            </CardContent>
          </Card>

          {/* Channel Health */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <ChannelHealthChart />
            </CardContent>
          </Card>
        </div>

        {/* AI Sidebar - 30% */}
        <div className="space-y-6">
          <AIInsightsPanel />
          <RecentActivityWidget />
        </div>
      </div>
    </div>
  );
}
