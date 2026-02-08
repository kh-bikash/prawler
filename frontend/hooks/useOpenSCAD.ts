"use client"

import { useState, useEffect } from "react"

// Define the shape of the OpenSCAD module and wrapper
interface OpenSCADInstance {
    FS: {
        writeFile: (path: string, data: string) => void
        readFile: (path: string, options?: { encoding?: string }) => Uint8Array | string
        unlink: (path: string) => void
    }
    callMain: (args: string[]) => number
}

interface OpenSCADWrapper {
    getInstance: () => OpenSCADInstance
    [key: string]: any
}

let OpenSCADLibrary: any = null

export function useOpenSCAD(code: string | null) {
    const [stlUrl, setStlUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [compiling, setCompiling] = useState(false)
    const [logs, setLogs] = useState<string[]>([])

    useEffect(() => {
        let mounted = true
        if (!code) {
            setStlUrl(null)
            return
        }

        const compile = async () => {
            setCompiling(true)
            setError(null)
            setLogs([])

            try {
                if (!OpenSCADLibrary) {
                    const module = await import("openscad-wasm")
                    // Cast to any to avoid "default does not exist" TS error on dynamic import
                    const modAny = module as any;
                    OpenSCADLibrary = modAny.createOpenSCAD || modAny.default || modAny
                }

                // Initialize wrapper
                const wrapper: OpenSCADWrapper = await OpenSCADLibrary({
                    print: (text: string) => {
                        console.log("[OpenSCAD]", text)
                        if (mounted) setLogs(prev => [...prev, text])
                    },
                    printErr: (text: string) => {
                        // Suppress non-fatal localization errors
                        if (text.includes("localization")) return;
                        console.error("[OpenSCAD Err]", text)
                        if (mounted) setLogs(prev => [...prev, `ERR: ${text}`])
                    },
                    noInitialRun: true,
                })

                // Extract instance
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const instance = wrapper.getInstance ? wrapper.getInstance() : (wrapper as any);

                if (!instance.FS) {
                    throw new Error("OpenSCAD instance missing FS. Initialization failed.")
                }

                // Write file
                instance.FS.writeFile("/input.scad", code)

                // Compile
                try {
                    instance.callMain(["/input.scad", "-o", "output.stl"])
                } catch (e) {
                    throw new Error("Compilation process returned non-zero exit code.")
                }

                // Read result
                const output = instance.FS.readFile("/output.stl")
                // Cast output to any to bypass strict SharedArrayBuffer checks for Blob
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const blob = new Blob([output as any], { type: "application/octet-stream" })
                const url = URL.createObjectURL(blob)

                if (mounted) {
                    setStlUrl(url)
                    setCompiling(false)
                }

                // Cleanup (optional but good practice if instance persists)
                try {
                    instance.FS.unlink("/input.scad")
                    instance.FS.unlink("/output.stl")
                } catch (e) { /* ignore cleanup errors */ }

            } catch (err: any) {
                console.error("OpenSCAD Hook Error:", err)
                if (mounted) {
                    setError(err.message || "Rendering failed")
                    setCompiling(false)
                }
            }
        }

        compile()

        return () => {
            mounted = false
            if (stlUrl) URL.revokeObjectURL(stlUrl)
        }
    }, [code])

    return { stlUrl, error, compiling, logs }
}
