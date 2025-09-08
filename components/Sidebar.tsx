"use client";

import React, { useState } from "react";
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
} from "@heroui/react";
import { 
    Home, 
    Package, 
    Calendar,
    Truck,
    BarChart3, 
    Settings, 
    LogOut,
    Menu,
    X,
    User,
    Bell,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    Grid3X3
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
    children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();

    const menuItems = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: Grid3X3,
        },
        {
            name: "Products",
            href: "/product",
            icon: Package,
        },
        {
            name: "Calendar",
            href: "/calendar",
            icon: Calendar,
            hasNotification: true,
        },
        {
            name: "Suppliers",
            href: "/suppliers",
            icon: Truck,
        },
        {
            name: "Reports",
            href: "/reports",
            icon: BarChart3,
        },
    ];

    const utilityItems = [
        {
            name: "Notifications",
            icon: Bell,
            hasNotification: true,
        },
        {
            name: "Settings",
            icon: Settings,
        },
        {
            name: "Support",
            icon: HelpCircle,
        },
    ];

    const handleLogout = async () => {
        setIsLoading(true);
        // Simulate logout process
        setTimeout(() => {
            setIsLoading(false);
            // Add actual logout logic here
        }, 2000);
    };

    return (
        <div className="flex h-screen bg-purple-50 overflow-hidden">
            {/* Desktop Sidebar */}
            <div className={`hidden md:flex md:flex-col transition-all duration-300 relative ${
                isCollapsed ? 'md:w-20 lg:w-20' : 'md:w-64 lg:w-64'
            }`}>
                <div className="flex flex-col flex-grow bg-white overflow-y-auto border-r border-gray-200 m-2">
                    {/* Header */}
                    <div className="flex items-center justify-center p-4 border-b border-gray-100 h-16">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-[#003366] rounded-full flex items-center justify-center flex-shrink-0">
                                <img 
                                    src="/Logo.png" 
                                    alt="Logo" 
                                    className="w-6 h-6 object-contain"
                                />
                            </div>
                            {!isCollapsed && (
                                <span className="ml-3 text-lg font-bold text-gray-900 whitespace-nowrap">
                                    Margie CodeVenience
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Main Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                                        isActive
                                            ? "bg-purple-100 text-[#003366]"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-[#003366]"
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
                        <div className="border-t border-gray-200"></div>
                    </div>

                    {/* Utility Items */}
                    <nav className="p-4 space-y-2">
                        {utilityItems.map((item) => {
                            const Icon = item.icon;
                            
                            return (
                                <button
                                    key={item.name}
                                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-[#003366] w-full ${
                                        isCollapsed ? 'justify-center' : ''
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
                    <div className="p-4 border-t border-gray-100">
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
                                        <DropdownItem key="profile" startContent={<User className="h-4 w-4" />}>
                                            Profile
                                        </DropdownItem>
                                        <DropdownItem key="settings" startContent={<Settings className="h-4 w-4" />}>
                                            Settings
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
                                            <p className="text-xs text-gray-500 flex items-center">
                                                Welcome back 👋
                                            </p>
                                            <p className="text-sm font-medium text-gray-900">Johnathan</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="User menu">
                                    <DropdownItem key="profile" startContent={<User className="h-4 w-4" />}>
                                        Profile
                                    </DropdownItem>
                                    <DropdownItem key="settings" startContent={<Settings className="h-4 w-4" />}>
                                        Settings
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
                        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300" 
                        onClick={() => setIsMenuOpen(false)} 
                    />
                    <div className="relative flex flex-col w-80 max-w-[85vw] h-full bg-white shadow-xl">
                        {/* Mobile Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-[#003366] rounded-full flex items-center justify-center flex-shrink-0">
                                    <img 
                                        src="/Logo.png" 
                                        alt="Logo" 
                                        className="w-6 h-6 object-contain"
                                    />
                                </div>
                                <span className="ml-3 text-lg font-bold text-gray-900">
                                    Margie CodeVenience
                                </span>
                            </div>
                            <Button
                                variant="light"
                                isIconOnly
                                onClick={() => setIsMenuOpen(false)}
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Mobile Navigation */}
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                                            isActive
                                                ? "bg-purple-100 text-[#003366]"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-[#003366]"
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
                            <div className="border-t border-gray-200"></div>
                        </div>
                        <nav className="p-4 space-y-1">
                            {utilityItems.map((item) => {
                                const Icon = item.icon;
                                
                                return (
                                    <button
                                        key={item.name}
                                        className="group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-[#003366] w-full"
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
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
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
                                            <p className="text-xs text-gray-500 flex items-center">
                                                Welcome back 👋
                                            </p>
                                            <p className="text-sm font-medium text-gray-900">Johnathan</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="User menu">
                                    <DropdownItem key="profile" startContent={<User className="h-4 w-4" />}>
                                        Profile
                                    </DropdownItem>
                                    <DropdownItem key="settings" startContent={<Settings className="h-4 w-4" />}>
                                        Settings
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
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Mobile Menu Toggle - Only visible on mobile */}
                <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
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
                        <span className="ml-2 text-sm font-medium text-gray-900">
                            Margie CodeVenience
                        </span>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
                    <div className="py-4 md:py-6">
                        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}   