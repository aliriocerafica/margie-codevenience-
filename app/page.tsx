"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Staff");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/auth/sign-up", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role }),
            });
            const data = await res.json();
            if (!res.ok) setMessage(data.error || "Something went wrong");
            else {
                setMessage("Signup successful! 🎉");
                setEmail(""); setPassword(""); setRole("Staff");
            }
        } catch (err) {
            setMessage("Error: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="flex justify-center">
                    <h1 className="text-2xl font-bold">Sign Up</h1>
                </CardHeader>
                <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} isRequired fullWidth />
                        <Input type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} isRequired fullWidth />
                        <Select label="Role" selectedKeys={[role]} onSelectionChange={(keys) => setRole(Array.from(keys)[0] as string)}>
                            <SelectItem key="Admin">Admin</SelectItem>
                            <SelectItem key="Staff">Staff</SelectItem>
                        </Select>
                        <Button type="submit" color="primary" fullWidth isLoading={loading}>Sign Up</Button>
                        {message && <p className="text-center text-sm text-gray-700">{message}</p>}
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}
