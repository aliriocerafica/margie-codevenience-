"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { useState } from "react";
import { 
    Package, 
    Tag, 
    BarChart3, 
    TrendingUp,
    Users,
    DollarSign
} from "lucide-react";

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleRefresh = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 2000);
    };

    const stats = [
        {
            title: "Total Products",
            value: "1,234",
            icon: Package,
            change: "+12%",
            changeType: "positive"
        },
        {
            title: "Categories",
            value: "45",
            icon: Tag,
            change: "+3%",
            changeType: "positive"
        },
        {
            title: "Total Sales",
            value: "$12,345",
            icon: DollarSign,
            change: "+8%",
            changeType: "positive"
        },
        {
            title: "Active Users",
            value: "89",
            icon: Users,
            change: "+5%",
            changeType: "positive"
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Welcome to Margie CodeVenience POS System</p>
                </div>
                <Button 
                    color="primary" 
                    onPress={handleRefresh}
                    startContent={isLoading ? <Spinner size="sm" /> : <TrendingUp className="h-4 w-4" />}
                    isLoading={isLoading}
                >
                    {isLoading ? "Refreshing..." : "Refresh Data"}
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index} className="border border-gray-200">
                            <CardBody className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                        <p className={`text-sm mt-1 ${
                                            stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {stat.change} from last month
                                        </p>
                                    </div>
                                    <div className="p-3 bg-[#003366]/10 rounded-lg">
                                        <Icon className="h-6 w-6 text-[#003366]" />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    );
                })}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Products</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {[
                                { name: "Laptop Pro 15", category: "Electronics", price: "$1,299" },
                                { name: "Wireless Mouse", category: "Accessories", price: "$29" },
                                { name: "Mechanical Keyboard", category: "Accessories", price: "$89" },
                            ].map((product, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">{product.name}</p>
                                        <p className="text-sm text-gray-600">{product.category}</p>
                                    </div>
                                    <p className="font-semibold text-[#003366]">{product.price}</p>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            <Button 
                                color="primary" 
                                variant="flat" 
                                className="w-full justify-start"
                                startContent={<Package className="h-4 w-4" />}
                            >
                                Add New Product
                            </Button>
                            <Button 
                                color="default" 
                                variant="flat" 
                                className="w-full justify-start"
                                startContent={<Tag className="h-4 w-4" />}
                            >
                                Manage Categories
                            </Button>
                            <Button 
                                color="default" 
                                variant="flat" 
                                className="w-full justify-start"
                                startContent={<BarChart3 className="h-4 w-4" />}
                            >
                                View Analytics
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
