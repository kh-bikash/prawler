"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Plus, ArrowRight, Loader2, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"

interface Build {
    id: number
    device_name: string
    description: string
    created_at: string
}

const STEPS = [
    "Analyzing your device requirements...",
    "Identifying necessary components...",
    "Designing circuit logic & wiring...",
    "Writing firmware structure...",
    "Finalizing build plan..."
]

export default function DashboardPage() {
    const router = useRouter()
    const [builds, setBuilds] = useState<Build[]>([])
    const [loading, setLoading] = useState(true)
    const [prompt, setPrompt] = useState("")
    const [generating, setGenerating] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        fetchBuilds()
    }, [])

    const fetchBuilds = async () => {
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                router.push("/login")
                return
            }
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/builds/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setBuilds(res.data)
        } catch (err) {
            console.error(err)
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                localStorage.removeItem("token")
                router.push("/login")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!prompt.trim()) return

        setGenerating(true)
        setCurrentStep(0)

        // Simulate steps visual sequence
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev))
        }, 2000)

        try {
            const token = localStorage.getItem("token")
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/builds/generate`,
                { prompt },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            clearInterval(stepInterval)
            setCurrentStep(STEPS.length) // Complete

            // Short delay to show completion before redirect
            setTimeout(() => {
                router.push(`/build/${res.data.id}`)
            }, 800)

        } catch (err) {
            clearInterval(stepInterval)
            console.error("Generation failed", err)
            setGenerating(false)

            if (axios.isAxiosError(err) && err.response?.status === 401) {
                localStorage.removeItem("token")
                router.push("/login")
                return
            }

            alert("Failed to generate build. Please try again.")
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <div className="flex flex-col gap-12">
                {/* Create Section / Progress UI */}
                <section className="max-w-2xl mx-auto w-full space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                            What are we building today?
                        </h1>
                        <p className="text-muted-foreground">From idea to hardware in seconds.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {!generating ? (
                            <motion.form
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                onSubmit={handleGenerate}
                                className="flex flex-col gap-4 relative"
                            >
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                    <Textarea
                                        placeholder="Describe your device (e.g., 'A Smart Doorbell with Face Recognition and Home Assistant integration')..."
                                        className="relative min-h-[140px] text-lg p-6 bg-card/80 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl resize-none shadow-xl"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />
                                </div>
                                <Button size="lg" className="w-full h-12 text-md font-medium shadow-lg hover:shadow-primary/20 transition-all rounded-lg" disabled={!prompt.trim()}>
                                    Generate Build Plan <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-card/50 backdrop-blur-md rounded-xl border border-border/50 p-8 shadow-2xl max-w-xl mx-auto"
                            >
                                <div className="space-y-6">
                                    {STEPS.map((step, index) => {
                                        const isActive = index === currentStep
                                        const isCompleted = index < currentStep
                                        const isPending = index > currentStep

                                        return (
                                            <div key={index} className={`flex items-center gap-4 transition-all duration-500 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
                                                <div className="relative flex-shrink-0">
                                                    {isCompleted ? (
                                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                                    ) : isActive ? (
                                                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                                    ) : (
                                                        <Circle className="h-6 w-6 text-muted-foreground" />
                                                    )}
                                                    {index !== STEPS.length - 1 && (
                                                        <div className={`absolute top-6 left-1/2 w-0.5 h-6 -translate-x-1/2 ${isCompleted ? 'bg-green-500/50' : 'bg-border'}`} />
                                                    )}
                                                </div>
                                                <span className={`text-sm font-medium ${isActive ? 'text-primary scale-105 origin-left' : 'text-muted-foreground'} transition-transform duration-300`}>
                                                    {step}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Recent Builds */}
                {!generating && (
                    <motion.section
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">Your Recent Builds</h2>
                        </div>

                        {builds.length === 0 ? (
                            <div className="text-center py-16 border border-dashed border-border/50 rounded-2xl bg-card/20 hover:bg-card/40 transition-colors">
                                <div className="flex justify-center mb-4">
                                    <div className="p-4 bg-primary/10 rounded-full">
                                        <Plus className="h-8 w-8 text-primary" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-medium">No builds yet</h3>
                                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                                    Your generated hardware projects will appear here. Start your first build above!
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {builds.map((build) => (
                                    <Link key={build.id} href={`/build/${build.id}`}>
                                        <Card className="group h-full hover:border-primary/50 transition-all duration-300 cursor-pointer bg-card/50 hover:bg-card/80 hover:shadow-xl hover:-translate-y-1">
                                            <CardHeader>
                                                <div className="flex justify-between items-start gap-2">
                                                    <CardTitle className="truncate text-lg group-hover:text-primary transition-colors">{build.device_name || "Untitled"}</CardTitle>
                                                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                                </div>
                                                <CardDescription className="line-clamp-2 mt-2">{build.description}</CardDescription>
                                            </CardHeader>
                                            <CardFooter className="text-xs text-muted-foreground pt-4 flex justify-between items-center border-t border-border/50 bg-muted/20 mt-auto">
                                                <span>{new Date(build.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-medium">Completed</span>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </motion.section>
                )}
            </div>
        </div>
    )
}
