"use client";

import React, { useState, useEffect } from "react";
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenuToggle,
    NavbarMenu,
    NavbarMenuItem,
    Button,
    Spinner,
    Avatar,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Divider,
    Input,
} from "@heroui/react";
import {
    Home,
    Package,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    ChevronLeft,
    ChevronRight,
    Grid3X3,
    Search,
    Tag,
    ScanLine,
    Barcode,
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import { ThemeSwitch } from "./ThemeSwitch";
import { usePathname, useRouter } from "next/navigation";
import { useSearch } from "@/contexts/SearchContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import StockAlertSettings from "./StockAlertSettings";
import { signOut } from "next-auth/react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useSession } from "next-auth/react"

interface SidebarProps {
    children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
    const { data: session, status } = useSession()
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { openSearchModal } = useSearch();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { clearAllNotifications } = useNotifications();

    // Enable keyboard shortcuts
    useKeyboardShortcuts();

    // Set mounted state after component mounts to prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const menuItems = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: Grid3X3,
            hasNotification: false,
        },
        {
            name: "Products",
            href: "/product",
            icon: Package,
            hasNotification: false,
        },
        {
            name: "Categories",
            href: "/category",
            icon: Tag,
            hasNotification: false,
        },
        {
            name: "Team",
            href: "/users",
            icon: User,
            hasNotification: false,
        },
        {
            name: "Scan Items",
            href: "/scanqr",
            icon: ScanLine,
            hasNotification: false,
        },
        {
            name: "Checkout",
            href: "/ScannedList",
            icon: Barcode,
            hasNotification: false,
        },
        // {
        //     name: "Analytics",
        //     href: "/analytics",
        //     icon: BarChart3,
        //     hasNotification: false,
        // },
        {
            name: "Reports",
            href: "/reports",
            icon: TrendingUp,
            hasNotification: false,
        },
    ];

    const utilityItems = [
        {
            name: "General Settings",
            icon: Settings,
            onClick: () => setIsSettingsOpen(true),
            hasNotification: false,
        },
    ];

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            // Clear remember me data from localStorage
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberedEmail');

            // Clear all notifications on logout
            clearAllNotifications();

            // Delegate redirect to Auth.js so cookies/state are fully cleared
            await signOut({ callbackUrl: '/' });
        } catch (error) {
            console.error('Logout error:', error);
            // Hard fallback
            window.location.href = '/';
        } finally {
            setIsLoading(false);
        }
    };


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        openSearchModal();
    };

    const handleSearchClick = () => {
        openSearchModal();
    };

    // Role-based filtering: hide Products, Categories, Team, and Reports for Staff
    // During SSR or before mount, show safe links to prevent hydration mismatch
    // After mount, apply role-based filtering
    const userRole = (session as any)?.user?.role;
    const baseMenuItems = !isMounted
        ? menuItems.filter((item) => ["Dashboard", "Scan Items", "Checkout"].includes(item.name))
        : userRole === 'Staff'
        ? menuItems.filter((item) => !["Products", "Categories", "Team", "Reports"].includes(item.name))
        : menuItems; // Show all links for Admin users or when session is loading

    // Filter menu items based on local search query (for sidebar filtering)
    const filteredMenuItems = baseMenuItems.filter(item =>
        item.name.toLowerCase().includes(localSearchQuery.toLowerCase())
    );

    const filteredUtilityItems = utilityItems.filter(item =>
        item.name.toLowerCase().includes(localSearchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
            {/* Desktop Sidebar */}
            <div className={`hidden md:flex md:flex-col transition-all duration-300 relative ${isCollapsed ? 'md:w-20 lg:w-20' : 'md:w-72 lg:w-72'
                }`}>
                <div className="flex flex-col flex-grow bg-gradient-to-b from-[#003366] to-[#004488] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/20 h-16">
                        <div className="flex items-center gap-3 min-w-0">
                            <img
                                src="/LogoWhite.png"
                                alt="Logo"
                                className="w-8 h-8 object-contain flex-shrink-0"
                            />
                            {!isCollapsed && (
                                <span className="ml-1 text-lg font-bold text-white whitespace-nowrap truncate">
                                    Margie CodeVenience
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Global Search Button */}
                    <div className="mx-4 mt-4 mb-2">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                            <Button
                                variant="light"
                                startContent={<Search className="h-4 w-4" />}
                                onClick={handleSearchClick}
                                className="text-white/80 hover:text-white hover:bg-white/10 text-sm w-full justify-start"
                                size="sm"
                            >
                                {!isCollapsed && "Search everything..."}
                            </Button>
                        </div>
                    </div>

                    {/* Main Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {filteredMenuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${isActive
                                        ? "bg-white/20 text-white"
                                        : "text-white/80 hover:bg-white/10 hover:text-white"
                                        } ${isCollapsed ? 'justify-center' : ''}`}
                                    title={isCollapsed ? item.name : ''}
                                >
                                    <div className="relative flex-shrink-0">
                                        <Icon className="h-5 w-5" />
                                        {item.hasNotification && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <span className="ml-3 whitespace-nowrap">{item.name}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Divider */}
                    <div className="px-4">
                        <div className="border-t border-white/20"></div>
                    </div>

                    {/* Utility Items */}
                    <nav className="p-4 space-y-2">
                        {filteredUtilityItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.name}
                                    onClick={item.onClick}
                                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-white/80 hover:bg-white/10 hover:text-white w-full ${isCollapsed ? 'justify-center' : ''
                                        }`}
                                    title={isCollapsed ? item.name : ''}
                                >
                                    <div className="relative flex-shrink-0">
                                        <Icon className="h-5 w-5" />
                                        {item.hasNotification && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <span className="ml-3 whitespace-nowrap">{item.name}</span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User Profile Section */}
                    <div className="p-4 border-t border-white/20">
                        {isCollapsed ? (
                            <div className="flex justify-center">
                                <Dropdown placement="top-start">
                                    <DropdownTrigger>
                                        <Button
                                            variant="light"
                                            isIconOnly
                                            className="w-10 h-10"
                                        >
                                            <Avatar
                                                size="sm"
                                                name="Johnathan"
                                                className="bg-yellow-100 text-yellow-800"
                                            />
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="User menu">
                                        <DropdownItem
                                            key="profile"
                                            startContent={<User className="h-4 w-4" />}
                                            onPress={() => router.push("/profile")}
                                        >
                                            Profile
                                        </DropdownItem>
                                        <DropdownItem
                                            key="logout"
                                            className="text-danger"
                                            color="danger"
                                            startContent={isLoading ? <Spinner size="sm" /> : <LogOut className="h-4 w-4" />}
                                            onPress={handleLogout}
                                        >
                                            {isLoading ? "Logging out..." : "Logout"}
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </div>
                        ) : (
                            <Dropdown placement="top-start">
                                <DropdownTrigger>
                                    <Button
                                        variant="light"
                                        className="w-full justify-start p-2 h-auto"
                                    >
                                        <Avatar
                                            size="sm"
                                            name="Johnathan"
                                            className="bg-yellow-100 text-yellow-800"
                                        />
                                        <div className="text-left ml-3">
                                            <p className="text-xs text-white flex items-center">
                                                Welcome back 👋
                                            </p>
                                            <p className="text-sm font-medium text-white">{session?.user.role}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="User menu">
                                    <DropdownItem
                                        key="profile"
                                        startContent={<User className="h-4 w-4" />}
                                        onPress={() => router.push("/profile")}
                                    >
                                        Profile
                                    </DropdownItem>
                                    <DropdownItem
                                        key="logout"
                                        className="text-danger"
                                        color="danger"
                                        startContent={isLoading ? <Spinner size="sm" /> : <LogOut className="h-4 w-4" />}
                                        onPress={handleLogout}
                                    >
                                        {isLoading ? "Logging out..." : "Logout"}
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        )}
                    </div>
                </div>

                {/* Floating Toggle Button - Positioned outside sidebar, aligned with logo */}
                <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute top-6 -right-3 z-10 bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full shadow-md w-6 h-6 min-w-0"
                >
                    {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </Button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-300"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="relative flex flex-col w-80 max-w-[85vw] h-full bg-gradient-to-b from-[#003366] to-[#004488] shadow-xl">
                        {/* Mobile Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/20">
                            <div className="flex items-center">
                                <img
                                    src="/LogoWhite.png"
                                    alt="Logo"
                                    className="w-8 h-8 object-contain flex-shrink-0"
                                />
                                <span className="ml-3 text-lg font-bold text-white">
                                    Margie CodeVenience
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ThemeSwitch />
                                <Button
                                    variant="light"
                                    isIconOnly
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Mobile Navigation */}
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {filteredMenuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${isActive
                                            ? "bg-white/20 text-white"
                                            : "text-white/80 hover:bg-white/10 hover:text-white"
                                            }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <Icon className="h-5 w-5" />
                                            {item.hasNotification && (
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                                            )}
                                        </div>
                                        <span className="ml-3 whitespace-nowrap">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Mobile Utility Items */}
                        <div className="px-4">
                            <div className="border-t border-gray-200 dark:border-gray-800"></div>
                        </div>
                        <nav className="p-4 space-y-1">
                            {utilityItems.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <button
                                        key={item.name}
                                        onClick={item.onClick}
                                        className="group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-white/80 hover:bg-white/10 hover:text-white w-full"
                                    >
                                        <div className="relative flex-shrink-0">
                                            <Icon className="h-5 w-5" />
                                            {item.hasNotification && (
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                                            )}
                                        </div>
                                        <span className="ml-3 whitespace-nowrap">{item.name}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Mobile User Profile */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                            <Dropdown placement="top-start">
                                <DropdownTrigger>
                                    <Button
                                        variant="light"
                                        className="w-full justify-start p-3 h-auto"
                                    >
                                        <Avatar
                                            size="sm"
                                            name="Johnathan"
                                            className="bg-yellow-100 text-yellow-800 flex-shrink-0"
                                        />
                                        <div className="text-left ml-3">
                                            <p className="text-xs text-white flex items-center">
                                                Welcome back 👋
                                            </p>
                                            <p className="text-sm font-medium text-white">{session?.user.role}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="User menu">
                                    <DropdownItem
                                        key="profile"
                                        startContent={<User className="h-4 w-4" />}
                                        onPress={() => router.push("/profile")}
                                    >
                                        Profile
                                    </DropdownItem>
                                    <DropdownItem
                                        key="logout"
                                        className="text-danger"
                                        color="danger"
                                        startContent={isLoading ? <Spinner size="sm" /> : <LogOut className="h-4 w-4" />}
                                        onPress={handleLogout}
                                    >
                                        {isLoading ? "Logging out..." : "Logout"}
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Mobile Menu Toggle - Only visible on mobile */}
                <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
                    <Button
                        variant="light"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        startContent={<Menu className="h-5 w-5" />}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        Menu
                    </Button>
                    <div className="flex items-center">
                        <div className="w-6 h-6 bg-[#003366] rounded-full flex items-center justify-center flex-shrink-0">
                            <img
                                src="/Logo.png"
                                alt="Logo"
                                className="w-4 h-4 object-contain"
                            />
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                            Margie CodeVenience
                        </span>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 min-h-0 relative overflow-y-auto focus:outline-none bg-gray-50 dark:bg-gray-950">
                    <div className="py-4 md:py-6">
                        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>

            {/* Stock Alert Settings */}
            <StockAlertSettings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
}   
