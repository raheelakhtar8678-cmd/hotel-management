import InteractiveCalendar from "@/components/interactive-calendar";

export default function CalendarPage() {
    return (
        <div className="flex-1 p-8 pt-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight gradient-text">
                        Booking Calendar
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Click any date to see bookings and revenue for that day
                    </p>
                </div>

                <InteractiveCalendar />
            </div>
        </div>
    );
}
