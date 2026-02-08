"use client"

import React, { useEffect, useState, useRef } from "react"
import { Canvas, useLoader } from "@react-three/fiber"
import { OrbitControls, Stage, Center } from "@react-three/drei"
import * as THREE from "three"
import { STLLoader } from "three-stdlib"

// Dynamically import OpenSCAD to avoid SSR issues and main bundle bloat
// The import path might need adjustment based on how openscad-wasm exports
let OpenSCAD: any = null

export function OpenSCADRenderer({ code }: { code: string }) {
    const [stlUrl, setStlUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [compiling, setCompiling] = useState(false)
    const [logs, setLogs] = useState<string[]>([])

    useEffect(() => {
        let mounted = true

        const compile = async () => {
            if (!code) return
            setCompiling(true)
            setError(null)
            setLogs([])

            try {
                if (!OpenSCAD) {
                    // Dynamic import
                    // Note: 'openscad-wasm' might export default or named export.
                    // Based on types, it exports { createOpenSCAD } or similar?
                    // Let's try default import first as it is common for these wrappers.
                    const module = await import("openscad-wasm")
                    // Check for named export 'createOpenSCAD' or default
                    OpenSCAD = module.createOpenSCAD || module.default || module
                }

                // Initialize instance
                // createOpenSCAD returns a wrapper { renderToStl, getInstance }
                const wrapper = await OpenSCAD({
                    print: (text: string) => {
                        console.log("[OpenSCAD]", text)
                        if (mounted) setLogs(prev => [...prev, text])
                    },
                    printErr: (text: string) => {
                        console.error("[OpenSCAD Err]", text)
                        if (mounted) setLogs(prev => [...prev, `ERR: ${text}`])
                    },
                    noInitialRun: true,
                })

                // Get the raw emscripten module which has FS
                const instance = wrapper.getInstance ? wrapper.getInstance() : wrapper;

                console.log("Raw OpenSCAD Instance:", instance);

                if (!instance.FS) {
                    throw new Error(`OpenSCAD instance missing FS. Available keys: ${Object.keys(instance).join(", ")}`)
                }

                // Write input file
                instance.FS.writeFile("/input.scad", code)

                // Compile
                // OpenSCAD CLI args: input -o output.stl
                // callMain takes array of args
                // Note: callMain might throw on error (exit code != 0)
                try {
                    instance.callMain(["/input.scad", "-o", "output.stl"])
                } catch (e) {
                    throw new Error("Compilation failed (check logs)")
                }

                // Read output
                const output = instance.FS.readFile("/output.stl")

                // Create Blob
                const blob = new Blob([output], { type: "application/octet-stream" })
                const url = URL.createObjectURL(blob)

                if (mounted) {
                    setStlUrl(url)
                    setCompiling(false)
                }

                // Cleanup? Virtual FS is in memory of that instance. 
                // We recreate instance or reuse? 
                // Ideally reuse, but for safety in React strict mode, maybe fresh instance is safer IF it cleans up.
                // But creating 13MB instance repeatedly is bad.
                // Optimization: Keep instance in ref? 
                // For MVP, just new instance is fine as long as user doesn't spam.

            } catch (err: any) {
                console.error("OpenSCAD Render Error:", err)
                if (mounted) {
                    setError(err.message || "Failed to render OpenSCAD")
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

    return (
        <div className="flex flex-col h-full bg-black/90 relative">
            {/* Overlay for compilation */}
            {(compiling || error) && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
                    {compiling && <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-2"></div>}
                    {compiling && <p className="text-primary font-mono text-sm">Rendering 3D Model...</p>}

                    {error && (
                        <div className="bg-red-900/80 p-4 rounded-lg border border-red-500 max-w-md">
                            <h3 className="text-red-300 font-bold mb-1">Render Failed</h3>
                            <p className="text-red-100 text-xs font-mono whitespace-pre-wrap text-left max-h-40 overflow-auto">
                                {error}
                                {"\n\nLogs:\n" + logs.join("\n")}
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 min-h-0">
                {stlUrl && !error && (
                    <Canvas shadows dpr={[1, 2]} camera={{ position: [50, 50, 50], fov: 50 }}>
                        <color attach="background" args={['#1a1a1a']} />
                        <Stage environment="city" intensity={0.5} adjustCamera>
                            <Model url={stlUrl} />
                        </Stage>
                        <OrbitControls makeDefault />
                        <gridHelper args={[200, 20]} position={[0, -0.1, 0]} />
                    </Canvas>
                )}
            </div>

            {/* Log toggle? Or just always show tiny logs at bottom? */}
            <div className="h-24 bg-[#111] border-t border-gray-800 overflow-auto font-mono text-[10px] p-2 text-gray-500">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
                {logs.length === 0 && <div className="italic opacity-30">Waiting for logs...</div>}
            </div>
        </div>
    )
}

function Model({ url }: { url: string }) {
    const geom = useLoader(STLLoader, url)
    // Center it
    return (
        <Center>
            <mesh geometry={geom} castShadow receiveShadow>
                <meshStandardMaterial color="#ffa500" roughness={0.5} metalness={0.5} />
            </mesh>
        </Center>
    )
}
