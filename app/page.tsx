"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { ThemeSwitch } from "@/components/ThemeSwitch";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Staff");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return "Email is required";
        if (!emailRegex.test(email)) return "Please include an '@' in the email address. '" + email + "' is missing an '@'.";
        return "";
    };

    const validatePassword = (password: string) => {
        if (!password) return "Password is required";
        if (password.length < 6) return "Password must be at least 6 characters long";
        return "";
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        setEmailError(validateEmail(value));
        if (message) setMessage("");
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordError(validatePassword(value));
        if (message) setMessage("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password);
        
        setEmailError(emailValidation);
        setPasswordError(passwordValidation);
        
        if (emailValidation || passwordValidation) {
            return;
        }

        setLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/auth/sign-up", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role }),
            });
            const data = await res.json();
            if (!res.ok) {
                setMessage(data.error || "Something went wrong");
            } else {
                setMessage("Signup successful! 🎉");
                setEmail(""); 
                setPassword(""); 
                setRole("Staff");
                setEmailError("");
                setPasswordError("");
            }
        } catch (err) {
            setMessage("Error: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // TEMP: quick navigation for testing
    const handleQuickSignIn = () => {
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex flex-col lg:flex-row relative">
            {/* Dark Mode Toggle - Top Right */}
            <div className="absolute top-4 right-4 z-50" suppressHydrationWarning>
                <ThemeSwitch />
            </div>
            {/* Mobile Header / Desktop Left Panel - Branding */}
            <div 
                className="w-full lg:w-2/5 flex flex-col relative shadow-2xl px-4 py-8 lg:py-0 min-h-[200px] lg:min-h-screen"
                style={{
                    backgroundImage: "url('/LoginBannerBG.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                }}
            >
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="text-center relative z-10 pt-8 lg:pt-16">
                    {/* Company Name - responsive text with Poppins */}
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 lg:mb-4 drop-shadow-lg font-poppins">
                        Margie CodeVenience
                    </h1>
                    
                    {/* Tagline with colored dots */}
                    <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-medium text-white drop-shadow-sm font-poppins mb-6">
                        <span>Scan</span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Track</span>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Control</span>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    
                    {/* White Logo - Bigger */}
                    <div className="flex justify-center">
                        <img 
                            src="/LogoWhite.png" 
                            alt="Margie CodeVenience Logo" 
                            className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* Form Panel - Mobile responsive */}
            <div className="w-full lg:w-3/5 flex flex-col justify-center items-center relative p-4 sm:p-6 lg:p-8">
                {/* Form Container with responsive sizing */}
                <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
                    <Card className="shadow-xl lg:shadow-2xl border-0 bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm">
                        <CardHeader className="pb-4 lg:pb-6 pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8">
                            <div className="w-full text-center">
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 lg:mb-3">Welcome Back</h2>
                                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Sign in to your account</p>
                            </div>
                        </CardHeader>
                        
                        <CardBody className="px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8">
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 lg:space-y-8">
                                <div>
                                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 lg:mb-3">
                                        Email Address
                                    </label>
                                    <Input 
                                        type="email" 
                                        placeholder="joe@email.com"
                                        value={email} 
                                        onChange={handleEmailChange} 
                                        isRequired 
                                        fullWidth 
                                        size="lg"
                                        isInvalid={!!emailError}
                                        errorMessage={emailError}
                                        classNames={{
                                            input: "text-sm sm:text-base py-3 lg:py-4 px-3 lg:px-4",
                                            inputWrapper: "h-12 sm:h-13 lg:h-14 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-md hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                                        }}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 lg:mb-3">
                                        Password
                                    </label>
                                    <Input 
                                        type="password" 
                                        placeholder="Enter your Password"
                                        value={password} 
                                        onChange={handlePasswordChange} 
                                        isRequired 
                                        fullWidth 
                                        size="lg"
                                        isInvalid={!!passwordError}
                                        errorMessage={passwordError}
                                        classNames={{
                                            input: "text-sm sm:text-base py-3 lg:py-4 px-3 lg:px-4",
                                            inputWrapper: "h-12 sm:h-13 lg:h-14 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-md hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                                        }}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 lg:mb-3">
                                        Role
                                    </label>
                                    <Select 
                                        placeholder="Select your role"
                                        selectedKeys={[role]} 
                                        onSelectionChange={(keys) => setRole(Array.from(keys)[0] as string)}
                                        size="lg"
                                        classNames={{
                                            trigger: "h-12 sm:h-13 lg:h-14 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-md hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700",
                                            value: "text-sm sm:text-base px-3 lg:px-4"
                                        }}
                                    >
                                        <SelectItem key="Admin">Admin</SelectItem>
                                        <SelectItem key="Staff">Staff</SelectItem>
                                    </Select>
                                </div>
                                
                                <Button 
                                    type="button" 
                                    fullWidth 
                                    size="lg"
                                    isLoading={loading}
                                    onPress={handleQuickSignIn}
                                    className="h-12 sm:h-13 lg:h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-[#003366] to-[#004488] hover:from-[#002244] hover:to-[#003366] text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                                    disabled={loading || !!emailError || !!passwordError}
                                >
                                    {loading ? "Creating Account..." : "Sign In"}
                                </Button>
                                
                                {message && (
                                    <div className={`text-center text-sm sm:text-base p-3 lg:p-4 rounded-xl shadow-md ${
                                        message.includes("successful") 
                                            ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-200" 
                                            : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-2 border-red-200"
                                    }`}>
                                        {message}
                                    </div>
                                )}

                                {/* Sign up link */}
                                <div className="text-center pt-4">
                                    <p className="text-gray-600 text-sm">
                                        Don't have an account?{" "}
                                        <a href="/signup" className="text-[#003366] hover:text-[#004488] font-semibold hover:underline transition-colors">
                                            Sign up here
                                        </a>
                                    </p>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}