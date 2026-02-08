"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import axios from "axios"
import { Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

interface Build {
    id: number
    device_name: string
    description: string
    created_at: string
}

export default function GalleryPage() {
    const [builds, setBuilds] = useState<Build[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBuilds()
    }, [])

    const fetchBuilds = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/builds/public`)
            setBuilds(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-8">
                <section className="text-center py-12">
                    <h1 className="text-4xl font-bold mb-4">Community Builds</h1>
                    <p className="text-muted-foreground">Explore hardware projects created by others.</p>
                </section>

                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {builds.map((build) => (
                            <Link key={build.id} href={`/build/${build.id}`}>
                                <Card className="h-full hover:bg-secondary/20 transition-colors cursor-pointer border-secondary/50">
                                    <CardHeader>
                                        <CardTitle className="truncate">{build.device_name || "Untitled"}</CardTitle>
                                        <CardDescription className="line-clamp-2">{build.description}</CardDescription>
                                    </CardHeader>
                                    <CardFooter className="text-xs text-muted-foreground">
                                        {new Date(build.created_at).toLocaleDateString()}
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
