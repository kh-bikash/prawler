"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const formData = new FormData()
            formData.append("username", email) // OAuth2 expects username
            formData.append("password", password)

            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, formData, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            })

            localStorage.setItem("token", res.data.access_token)
            // Force reload to update navbar or use context. Reload is simpler for MVP.
            window.location.href = "/dashboard"
        } catch (err: any) {
            setError(err.response?.data?.detail || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="grid gap-4">
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            Don't have an account? <Link href="/signup" className="underline">Sign up</Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
