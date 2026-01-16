'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';

interface SearchResult {
    type: 'property' | 'room' | 'booking';
    id: string;
    title: string;
    subtitle?: string;
    href: string;
}

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (searchQuery: string) => {
        setQuery(searchQuery);

        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            // Search properties
            const propsRes = await fetch('/api/properties');
            const propsData = await propsRes.json();
            const properties = (propsData.properties || [])
                .filter((p: any) =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.city?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((p: any) => ({
                    type: 'property' as const,
                    id: p.id,
                    title: p.name,
                    subtitle: `${p.city}, ${p.country}`,
                    href: `/properties/${p.id}`
                }));

            // Search bookings
            const bookingsRes = await fetch('/api/bookings');
            const bookingsData = await bookingsRes.json();
            const bookings = (bookingsData.bookings || [])
                .filter((b: any) =>
                    b.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    b.id.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 5)
                .map((b: any) => ({
                    type: 'booking' as const,
                    id: b.id,
                    title: b.guest_name,
                    subtitle: `${b.property_name} - ${new Date(b.check_in).toLocaleDateString()}`,
                    href: `/receipts/${b.id}`
                }));

            setResults([...properties.slice(0, 5), ...bookings]);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Keyboard shortcut
    if (typeof window !== 'undefined') {
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(true);
            }
        });
    }

    return (
        <>
            <Button
                variant="outline"
                className="relative w-64 justify-start text-sm text-muted-foreground"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                Search... <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex"><span className="text-xs">⌘</span>K</kbd>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Search</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search properties, bookings..."
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                                autoFocus
                            />
                            {query && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                                    onClick={() => {
                                        setQuery('');
                                        setResults([]);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {loading && (
                            <div className="text-center py-8 text-muted-foreground">
                                Searching...
                            </div>
                        )}

                        {!loading && results.length > 0 && (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {results.map((result) => (
                                    <a
                                        key={result.id}
                                        href={result.href}
                                        className="block p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
                                        onClick={() => setOpen(false)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">{result.title}</p>
                                                {result.subtitle && (
                                                    <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground capitalize">{result.type}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}

                        {!loading && query && results.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No results found for "{query}"
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
