"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropertySelector } from "./property-selector";
import { GlobalSearch } from "./global-search";
import { Building2, LayoutDashboard, Package, Settings, Calendar, FileText, Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export function MainNav() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/properties", label: "Properties", icon: Building2 },
        { href: "/inventory", label: "Inventory", icon: Package },
        { href: "/pricing-rules", label: "Pricing Rules", icon: Zap },
        { href: "/calendar", label: "Calendar", icon: Calendar },
        { href: "/reports", label: "Reports", icon: FileText },
        { href: "/settings", label: "Settings", icon: Settings },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="bg-gradient-primary rounded-lg p-2">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold gradient-text">
                                YieldVibe
                            </span>
                            <span className="px-1.5 py-0.5 text-[10px] font-bold text-primary bg-primary/10 border border-primary/30 rounded">
                                PRO
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                                        transition-all duration-200
                                        ${isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                        }
                                    `}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Search (Desktop) */}
                    <div className="hidden lg:flex items-center gap-3">
                        <GlobalSearch />
                        <PropertySelector />
                    </div>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="lg:hidden py-4 border-t border-primary/20">
                        <div className="mb-4">
                            <PropertySelector />
                        </div>
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                                            transition-all duration-200
                                            ${isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                            }
                                        `}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}

