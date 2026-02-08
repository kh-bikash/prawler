"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Loader2, Copy, Check, Battery, Cpu, Box, FileCode, ArrowRight, Cuboid, ClipboardCheck, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
// Note: importing SyntaxHighlighter dynamically to avoid SSR issues if necessary, but standard import works often
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import BuildVisualizer from "@/components/BuildVisualizer"
import WiringVisualizer from "@/components/WiringVisualizer"

interface BuildDetail {
    id: number
    device_name: string
    description: string
    parts_json: any[]
    wiring_json: string | any
    firmware_code: string
    enclosure_md: string
    openscad_code: string
    openscad_lid?: string
    openscad_body?: string
    stl_lid_url?: string
    stl_body_url?: string
    analysis?: string
    steps_json: string[]
}

export default function BuildPage() {
    const { id } = useParams()
    const [build, setBuild] = useState<BuildDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"parts" | "visualizer" | "wiring" | "firmware" | "steps" | "validation" | "export">("parts")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (id) fetchBuild()
    }, [id])

    const fetchBuild = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/builds/${id}`)
            setBuild(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const copyCode = () => {
        if (!build?.firmware_code) return
        navigator.clipboard.writeText(build.firmware_code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // --- EXPORT HANDLERS ---
    const handleExportBOM = () => {
        if (!build?.parts_json) return

        // 1. Create CSV content
        const headers = ["Part Name", "Type", "Quantity", "Specs", "Note", "Buy URL"]
        const rows = build.parts_json.map((p: any) => [
            `"${p.name}"`,
            `"${p.type || 'Generic'}"`,
            `"${p.quantity || 1}"`,
            `"${p.specs || ''}"`,
            `"${p.note || ''}"`,
            `"${p.buy_url || ''}"`
        ])
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")

        // 2. Trigger Download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", `${build.device_name.replace(/\s+/g, '_')}_BOM.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleDownloadFirmware = () => {
        if (!build?.firmware_code) return

        const blob = new Blob([build.firmware_code], { type: "text/plain;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", `${build.device_name.replace(/\s+/g, '_')}_Firmware.ino`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    if (!build) return <div className="text-center py-20">Build not found</div>

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{build.device_name}</h1>
                <p className="text-muted-foreground text-lg">{build.description}</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b mb-6 overflow-x-auto scrollbar-hide">
                <TabButton id="parts" icon={<Battery className="w-4 h-4" />} label="Parts" active={activeTab} set={setActiveTab} />
                <TabButton id="visualizer" icon={<Cuboid className="w-4 h-4" />} label="CAD" active={activeTab} set={setActiveTab} />
                <TabButton id="wiring" icon={<Box className="w-4 h-4" />} label="Wiring" active={activeTab} set={setActiveTab} />
                <TabButton id="firmware" icon={<Cpu className="w-4 h-4" />} label="Firmware" active={activeTab} set={setActiveTab} />
                <TabButton id="steps" icon={<FileCode className="w-4 h-4" />} label="Steps" active={activeTab} set={setActiveTab} />
                <TabButton id="validation" icon={<ClipboardCheck className="w-4 h-4" />} label="Validation" active={activeTab} set={setActiveTab} />
                <TabButton id="export" icon={<Download className="w-4 h-4" />} label="Export" active={activeTab} set={setActiveTab} />
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px] animate-in fade-in duration-300">

                {/* PARTS TAB */}
                {activeTab === "parts" && (
                    <div className="grid gap-4">
                        {build.parts_json?.map((part: any, i: number) => {
                            const searchTerm = part.image_search_term || part.name
                            const encodedTerm = encodeURIComponent(searchTerm)
                            const buyUrl = part.buy_url?.includes("http") ? part.buy_url : `https://www.amazon.com/s?k=${encodedTerm}`
                            const datasheetUrl = part.datasheet_url?.includes("http") ? part.datasheet_url : `https://www.google.com/search?q=${encodedTerm} datasheet filetype:pdf`

                            return (
                                <Card key={i} className="bg-secondary/10 border-secondary/50 overflow-hidden hover:border-primary/30 transition-colors group">
                                    <CardContent className="p-0 flex flex-col sm:flex-row">
                                        {/* Stylized Icon/Image Area since real APIs are flaky without keys */}
                                        <div className="w-full sm:w-32 h-32 bg-secondary/20 flex-shrink-0 relative border-r border-border/50 flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                                            <Box className="w-12 h-12 text-primary/40 group-hover:text-primary/70 transition-colors" />
                                        </div>

                                        <div className="p-4 flex-grow flex flex-col justify-between">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <div className="font-semibold text-lg hover:text-primary cursor-pointer transition-colors flex items-center gap-2">
                                                        <a href={`https://www.google.com/search?tbm=isch&q=${encodedTerm}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline decoration-primary/50 underline-offset-4">
                                                            {part.name} <ExternalLink className="w-3 h-3 opacity-50" />
                                                        </a>
                                                    </div>
                                                    <div className="text-sm font-medium text-primary/80 mt-1">{part.specs}</div>
                                                    {part.note && <div className="text-sm mt-2 text-muted-foreground flex items-start gap-2 bg-secondary/30 p-2 rounded"><span className="mt-1 text-[10px] text-amber-500">●</span> {part.note}</div>}
                                                </div>
                                                <div className="text-sm font-mono bg-background border border-border px-3 py-1 rounded-md shadow-sm">x{part.quantity || 1}</div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-border/50 flex gap-3">
                                                <Button size="sm" className="h-8 text-xs gap-2" onClick={() => window.open(buyUrl, '_blank')}>
                                                    Buy on Amazon <ExternalLink className="w-3 h-3" />
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-8 text-xs gap-2" onClick={() => window.open(datasheetUrl, '_blank')}>
                                                    View Datasheet <FileCode className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {/* VISUALIZER / CAD TAB */}
                {activeTab === "visualizer" && (
                    <div className="space-y-4">
                        <Card className="bg-secondary/10 border-secondary/50 overflow-hidden">
                            <CardHeader className="bg-secondary/20 border-b border-border/50 pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>3D CAD Preview</CardTitle>
                                        <CardDescription>Interactive 3D PCB visualization.</CardDescription>
                                    </div>

                                </div>
                            </CardHeader>
                            <CardContent className="p-0 h-[600px] relative">
                                <BuildVisualizer
                                    parts={build.parts_json}
                                    wiring={Array.isArray(build.wiring_json) ? build.wiring_json : []}
                                    deviceName={build.device_name}
                                    analysis={build.analysis}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* WIRING TAB */}
                {activeTab === "wiring" && (
                    <Card className="bg-secondary/10 border-secondary/50">
                        <CardHeader>
                            <CardTitle>Wiring Diagram</CardTitle>
                            <CardDescription>
                                {Array.isArray(build.wiring_json) ? "Interactive node graph of connections." : "Step-by-step wiring instructions."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {Array.isArray(build.wiring_json) && build.wiring_json.length > 0 ? (
                                <WiringVisualizer wiringData={build.wiring_json} partsData={build.parts_json} />
                            ) : (
                                <div className="p-6 whitespace-pre-wrap font-mono text-sm leading-relaxed text-secondary-foreground/90">
                                    {typeof build.wiring_json === 'string' ? build.wiring_json : JSON.stringify(build.wiring_json, null, 2)}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* FIRMWARE TAB */}
                {activeTab === "firmware" && (
                    <div className="relative group">
                        <div className="absolute right-4 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="secondary" onClick={copyCode}>
                                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                                {copied ? "Copied" : "Copy Code"}
                            </Button>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-secondary/50 shadow-2xl">
                            <SyntaxHighlighter language="cpp" style={vscDarkPlus} showLineNumbers customStyle={{ margin: 0, fontSize: '0.9rem', padding: '1.5rem' }}>
                                {build.firmware_code || "// No firmware generated"}
                            </SyntaxHighlighter>
                        </div>
                    </div>
                )}

                {/* STEPS TAB */}
                {activeTab === "steps" && (
                    <div className="space-y-6">
                        {/* Enclosure / General Info */}
                        {build.enclosure_md && (
                            <Card className="bg-secondary/10 border-secondary/50 mb-6">
                                <CardHeader><CardTitle>Enclosure & Assembly</CardTitle></CardHeader>
                                <CardContent className="whitespace-pre-line text-muted-foreground leading-relaxed">
                                    {build.enclosure_md}
                                </CardContent>
                            </Card>
                        )}

                        <div className="space-y-4">
                            {build.steps_json?.map((step: string, i: number) => (
                                <Card key={i} className="border-l-4 border-l-primary/50 bg-secondary/5">
                                    <div className="flex p-4 gap-4 items-start">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <div className="pt-1 text-base">{step}</div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* VALIDATION TAB (Placeholder) */}
                {activeTab === "validation" && (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4 text-muted-foreground">
                        <ClipboardCheck className="w-16 h-16 opacity-20" />
                        <h3 className="text-xl font-medium text-foreground">Design Validation</h3>
                        <p className="max-w-md mx-auto"> Automated electrical rule checking (ERC) and compatibility analysis is under development.</p>
                        <Button variant="outline" disabled>Run Validation (Beta)</Button>
                    </div>
                )}

                {/* EXPORT TAB */}
                {activeTab === "export" && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <ExportCard
                            title="Export BOM"
                            desc="Download Bill of Materials CSV"
                            icon={<FileCode className="w-8 h-8" />}
                            onClick={handleExportBOM}
                        />
                        <ExportCard
                            title="Download Firmware"
                            desc="Get .ino / .cpp source files"
                            icon={<Cpu className="w-8 h-8" />}
                            onClick={handleDownloadFirmware}
                        />
                        <ExportCard title="Export STL" desc="Enclosure 3D Models" icon={<Box className="w-8 h-8" />} disabled />
                        <ExportCard title="PDF Report" desc="Full build manual" icon={<FileCode className="w-8 h-8" />} disabled />
                    </div>
                )}
            </div>
        </div>
    )
}

function TabButton({ id, icon, label, active, set }: { id: string, icon: any, label: string, active: string, set: any }) {
    return (
        <button
            onClick={() => set(id)}
            className={cn(
                "px-6 py-4 font-medium transition-all flex items-center gap-2 whitespace-nowrap border-b-2 hover:bg-secondary/5",
                active === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
        >
            {icon}
            {label}
        </button>
    )
}

function ExportCard({ title, desc, icon, disabled = false, onClick }: { title: string, desc: string, icon: any, disabled?: boolean, onClick?: () => void }) {
    return (
        <Card
            className={cn("hover:border-primary/50 transition-colors cursor-pointer", disabled && "opacity-50 pointer-events-none")}
            onClick={onClick}
        >
            <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-secondary/20 rounded-lg text-primary">{icon}</div>
                <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                {disabled && <span className="ml-auto text-xs bg-secondary px-2 py-1 rounded">Soon</span>}
            </CardContent>
        </Card>
    )
}
