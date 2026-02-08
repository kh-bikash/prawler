"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { CircuitBoard, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("token")
        setIsLoggedIn(!!token)

        const handleScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const handleLogout = () => {
        localStorage.removeItem("token")
        window.location.href = "/"
    }

    // Aramco/Premium Style: Deep Gradient + Clean Typography
    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-white/10 
            ${scrolled ? "bg-[#002f6c]/90 backdrop-blur-md shadow-lg py-3" : "bg-[#002f6c] py-5"}`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo Area */}
                    <div className="flex items-center gap-10">
                        <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <CircuitBoard className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-sans font-bold text-2xl tracking-tight text-white">Prawler</span>
                        </Link>

                        {/* Desktop Links */}
                        <div className="hidden sm:flex space-x-8">
                            {[
                                { name: "Home", href: "/" },
                                { name: "Gallery", href: "/gallery" },
                                ...(isLoggedIn ? [{ name: "Dashboard", href: "/dashboard" }] : [])
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="text-white/80 hover:text-white text-sm font-medium transition-colors relative group py-1"
                                >
                                    {item.name}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right Side Buttons */}
                    <div className="hidden sm:flex items-center gap-4">
                        {isLoggedIn ? (
                            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white" onClick={handleLogout}>
                                Logout
                            </Button>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">Sign In</Button>
                                </Link>
                                <Link href="/signup">
                                    <Button className="bg-white text-[#002f6c] hover:bg-gray-100 font-semibold border-none">
                                        Get Started
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-white hover:bg-white/10">
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="sm:hidden bg-[#002f6c] border-b border-white/10 overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <Link href="/" className="block px-3 py-2 text-base font-medium text-white hover:bg-white/10 rounded-md">Home</Link>
                            <Link href="/gallery" className="block px-3 py-2 text-base font-medium text-white hover:bg-white/10 rounded-md">Gallery</Link>
                            {isLoggedIn && <Link href="/dashboard" className="block px-3 py-2 text-base font-medium text-white hover:bg-white/10 rounded-md">Dashboard</Link>}
                            <div className="pt-4 flex flex-col gap-3">
                                {isLoggedIn ? (
                                    <Button className="w-full bg-white/10 text-white" onClick={handleLogout}>Logout</Button>
                                ) : (
                                    <>
                                        <Link href="/login"><Button variant="ghost" className="w-full text-white justify-start">Sign In</Button></Link>
                                        <Link href="/signup"><Button className="w-full bg-white text-[#002f6c]">Get Started</Button></Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
