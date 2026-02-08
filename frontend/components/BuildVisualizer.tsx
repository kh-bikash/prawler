"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import {
    OrbitControls,
    Center,
    Text,
    Html,
    ContactShadows,
    Environment,
    Float,
    useTexture,
    RoundedBox,
    Cylinder,
    QuadraticBezierLine,
    Grid,
    Stage,
    Billboard
} from '@react-three/drei';
import * as THREE from 'three';
import { Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Check, Download, ExternalLink, FileCode, Maximize2, RotateCcw, Box, Layers, Cpu, Database } from "lucide-react";


interface Part {
    name: string;
    type?: string;
    specs?: string;
    note?: string;
    datasheet_url?: string;
    buy_url?: string;
    quantity?: number;
    placement?: {
        x: number;
        y: number;
        z: number;
        rotation?: number[];
    };
    image_search_term?: string;
}

interface Wire {
    from_part: string;
    to_part: string;
    wire_color?: string;
}

interface BuildVisualizerProps {
    parts: Part[];
    wiring: Wire[];
    deviceName: string;
    analysis?: string;
}

// --- SPECIFIC PART GEOMETRIES ---

const ArduinoUno = () => (
    <group>
        {/* PCB */}
        <RoundedBox args={[6.86, 0.2, 5.34]} radius={0.1} smoothness={4}>
            <meshStandardMaterial color="#00979C" roughness={0.3} />
        </RoundedBox>
        {/* USB Port */}
        <mesh position={[-3, 0.3, -1.5]} rotation={[0, 0, 0]}>
            <boxGeometry args={[1.2, 1, 1.2]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* DC Jack */}
        <mesh position={[-3, 0.5, 1.8]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.6, 0.6, 1.2]} />
            <meshStandardMaterial color="#000000" />
        </mesh>
        {/* ATmega Chip */}
        <mesh position={[1, 0.2, 0.5]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.5, 3, 0.8]} />
            <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        {/* Headers */}
        <mesh position={[0, 0.3, -2.5]}>
            <boxGeometry args={[5, 0.5, 0.2]} />
            <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0, 0.3, 2.5]}>
            <boxGeometry args={[5, 0.5, 0.2]} />
            <meshStandardMaterial color="#000000" />
        </mesh>
    </group>
);

const RaspberryPi = () => (
    <group>
        {/* PCB */}
        <RoundedBox args={[8.5, 0.2, 5.6]} radius={0.2} smoothness={4}>
            <meshStandardMaterial color="#2E7D32" roughness={0.3} />
        </RoundedBox>
        {/* USB Ports */}
        <mesh position={[4, 0.5, -0.7]}>
            <boxGeometry args={[1.5, 1.2, 1.4]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.6} />
        </mesh>
        <mesh position={[4, 0.5, 1.2]}>
            <boxGeometry args={[1.5, 1.2, 1.4]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.6} />
        </mesh>
        {/* Ethernet */}
        <mesh position={[4, 0.5, 3]}>
            <boxGeometry args={[2, 1.2, 1.5]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.6} />
        </mesh>
        {/* GPIO Headers */}
        <group position={[-2, 0.4, -2.4]}>
            {Array.from({ length: 20 }).map((_, i) => (
                <mesh key={i} position={[i * 0.25 - 2.5, 0, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.6]} />
                    <meshStandardMaterial color="#FFD700" metalness={1} />
                </mesh>
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
                <mesh key={i} position={[i * 0.25 - 2.5, 0, 0.25]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.6]} />
                    <meshStandardMaterial color="#FFD700" metalness={1} />
                </mesh>
            ))}
        </group>
    </group>
);

const ESP32 = () => (
    <group>
        {/* PCB */}
        <RoundedBox args={[5, 0.2, 2.8]} radius={0.1}>
            <meshStandardMaterial color="#111" />
        </RoundedBox>
        {/* Shield */}
        <mesh position={[0.5, 0.3, 0]}>
            <boxGeometry args={[1.8, 0.2, 1.8]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.8} />
        </mesh>
        {/* Antenna */}
        <mesh position={[-2.2, 0.2, 0]}>
            <boxGeometry args={[0.5, 0.05, 1.5]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} />
        </mesh>
        {/* USB */}
        <mesh position={[2.4, 0.3, 0]}>
            <boxGeometry args={[0.6, 0.4, 0.8]} />
            <meshStandardMaterial color="#C0C0C0" />
        </mesh>
        {/* Pins */}
        <mesh position={[0, -0.2, 1.2]}>
            <boxGeometry args={[4.5, 0.4, 0.2]} />
            <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, -0.2, -1.2]}>
            <boxGeometry args={[4.5, 0.4, 0.2]} />
            <meshStandardMaterial color="#111" />
        </mesh>
    </group>
);

const ESP32Cam = () => (
    <group>
        {/* PCB */}
        <RoundedBox args={[2.7, 0.2, 4]} radius={0.1}>
            <meshStandardMaterial color="#111" />
        </RoundedBox>
        {/* Camera Module */}
        <group position={[0, 0.3, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.2]} />
            <meshStandardMaterial color="#111" />
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.25]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0, 0.23, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.05]} />
                <meshStandardMaterial color="#111" roughness={0} metalness={1} />
            </mesh>
        </group>
        {/* SD Card Slot */}
        <mesh position={[0, 0.3, -1]}>
            <boxGeometry args={[1.5, 0.2, 1.5]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.8} />
        </mesh>
    </group>
);

const DisplayModule = () => (
    <group>
        {/* PCB */}
        <RoundedBox args={[4, 0.2, 4]} radius={0.1}>
            <meshStandardMaterial color="#000080" />
        </RoundedBox>
        {/* Screen */}
        <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[3.5, 0.1, 3]} />
            <meshStandardMaterial color="#111" roughness={0.1} metalness={0.8} />
        </mesh>
        {/* Text/Glow */}
        <mesh position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3, 2]} />
            <meshBasicMaterial color="#00ff00" transparent opacity={0.1} />
        </mesh>
    </group>
);


const Battery = () => (
    <group rotation={[0, 0, Math.PI / 2]}>
        {/* Body */}
        <mesh>
            <cylinderGeometry args={[0.9, 0.9, 6.5, 32]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.3} />
        </mesh>
        {/* Top */}
        <mesh position={[0, 3.35, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.2]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.8} />
        </mesh>
    </group>
)

const Motor = () => (
    <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
            <cylinderGeometry args={[1, 1, 3, 32]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.5]} />
            <meshStandardMaterial color="#FFF" />
        </mesh>
    </group>
);

const SensorModule = ({ name }: { name: string }) => (
    <group>
        <RoundedBox args={[2, 0.1, 1.5]} radius={0.1}>
            <meshStandardMaterial color="#000080" /> {/* Blue PCB */}
        </RoundedBox>
        <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.8, 0.2, 0.8]} />
            <meshStandardMaterial color="#111" />
        </mesh>
        <Text
            position={[0, 0.25, 0.5]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.15}
            color="white"
            maxWidth={1.8}
            textAlign="center"
        >
            {name.substring(0, 10)}
        </Text>
    </group>
);

// --- UNIVERSAL PARTS ---

const GenericEnclosure = () => (
    <group>
        {/* Bottom Box (Translucent) */}
        <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[6, 1.0, 4]} />
            <meshStandardMaterial color="#f0f0f0" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        {/* Lid (Open detailed look) */}
        <lineSegments position={[0, 0.5, 0]}>
            <edgesGeometry args={[new THREE.BoxGeometry(6, 1.0, 4)]} />
            <lineBasicMaterial color="#aaa" />
        </lineSegments>
    </group>
);

const GenericChassis = () => (
    <group>
        {/* Main Body Plate */}
        <RoundedBox args={[3, 0.4, 5]} radius={0.2}>
            <meshStandardMaterial color="#222" />
        </RoundedBox>
        {/* Side Rails */}
        <mesh position={[1.4, 0, 0]}>
            <boxGeometry args={[0.2, 0.4, 4.8]} />
            <meshStandardMaterial color="#444" />
        </mesh>
        <mesh position={[-1.4, 0, 0]}>
            <boxGeometry args={[0.2, 0.4, 4.8]} />
            <meshStandardMaterial color="#444" />
        </mesh>
    </group>
);


const Wheel = () => (
    <group rotation={[0, 0, Math.PI / 2]}>
        <mesh>
            <cylinderGeometry args={[0.8, 0.8, 0.5, 32]} />
            <meshStandardMaterial color="#111" /> {/* Tire */}
        </mesh>
        <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.55, 16]} />
            <meshStandardMaterial color="#888" /> {/* Rim */}
        </mesh>
    </group>
);

const QuadFrame = () => (
    <group>
        {/* Center Plate */}
        <mesh>
            <cylinderGeometry args={[1.5, 1.5, 0.2, 6]} />
            <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[1.5, 1.5, 0.2, 6]} />
            <meshStandardMaterial color="#222" />
        </mesh>
        {/* Arms */}
        {[45, 135, 225, 315].map((angle, i) => (
            <group key={i} rotation={[0, angle * (Math.PI / 180), 0]}>
                <mesh position={[0, 0, 2.5]}>
                    <boxGeometry args={[0.5, 0.2, 5]} />
                    <meshStandardMaterial color="#8B0000" /> {/* Red Arms for contrast */}
                </mesh>
                {/* Motor Mounts */}
                <mesh position={[0, 0.1, 4.8]}>
                    <cylinderGeometry args={[0.6, 0.6, 0.1]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
                {/* Feet */}
                <mesh position={[0, -0.8, 4.8]}>
                    <cylinderGeometry args={[0.1, 0.05, 1.5]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            </group>
        ))}
    </group>
);

const DroneArm = () => (
    <group>
        <mesh>
            <boxGeometry args={[0.5, 0.2, 5]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0, 0.2, 2.2]}>
            <cylinderGeometry args={[0.5, 0.5, 0.2]} />
            <meshStandardMaterial color="#111" />
        </mesh>
    </group>
);

const Propeller = () => (
    <group>
        <mesh>
            <cylinderGeometry args={[0.1, 0.1, 0.2]} />
            <meshStandardMaterial color="#ccc" />
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[4, 0.05, 0.3]} />
            <meshStandardMaterial color="#111" transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[4, 0.05, 0.3]} />
            <meshStandardMaterial color="#111" transparent opacity={0.8} />
        </mesh>
    </group>
);


// PROCEDURAL COMPONENT GENERATOR
const ProceduralComponent = ({ part, index, total, explosion, blueprint }: { part: Part, index: number, total: number, explosion: number, blueprint: boolean }) => {

    let x = 0, y = 0, z = 0;
    let rotation = [0, 0, 0];
    const name = part.name.toLowerCase();
    const type = part.type?.toLowerCase() || "";

    // Check for AI-generated placement
    if (part.placement) {
        x = part.placement.x || 0;
        y = part.placement.y || 0;
        z = part.placement.z || 0;
        if (part.placement.rotation) {
            rotation = part.placement.rotation.map((r: number) => r * (Math.PI / 180));
        }
    } else {
        // --- UNIVERSAL AUTO-LAYOUT ---

        // 1. ROVER / CAR (Wheels)
        if (type === 'wheel') {
            const side = index % 2 === 0 ? 1 : -1;
            const front = index < 2 ? 1 : -1;
            x = side * 1.8;
            z = front * 1.5;
            y = 0;
            rotation = [0, 0, Math.PI / 2];
        }
        // 2. DRONE (Motors & Props)
        else if (type === 'motor') {
            if (name.includes('servo')) {
                x = (index % 2 === 0 ? 1 : -1) * 2;
                z = 0;
            } else {
                const armIndex = index % 4;
                const angle = [45, 135, 225, 315][armIndex] * (Math.PI / 180);
                x = Math.sin(angle) * 4.8;
                z = Math.cos(angle) * 4.8;
                y = 0.5;
            }
        }
        else if (type === 'propeller') {
            const armIndex = index % 4;
            const angle = [45, 135, 225, 315][armIndex] * (Math.PI / 180);
            x = Math.sin(angle) * 4.8;
            z = Math.cos(angle) * 4.8;
            y = 1.0;
        }
        // 3. FRAME / CHASSIS
        else if (type === 'frame' || name.includes('frame') || name.includes('chassis')) {
            x = 0; y = 0; z = 0;
        }
        // 4. ENCLOSURE (Box)
        else if (type === 'enclosure' || name.includes('box') || name.includes('case')) {
            x = 0; y = 0; z = 0;
        }
        // 5. INNER ELECTRONICS (If Enclosure Exists, Place Inside)
        else if (type === 'microcontroller' || type === 'camera' || type === 'sensor' || type === 'battery') {
            // Simple grid INSIDE the box zone
            const cols = Math.ceil(Math.sqrt(total));
            const row = Math.floor(index / cols);
            const col = index % cols;
            const spacing = 1.5; // Tighter spacing for inside box
            x = (col - cols / 2) * spacing + spacing / 2;
            z = (row - cols / 2) * spacing + spacing / 2;
            y = 0.2; // Inside bottom of box
        }
        else {
            // GRID FALLBACK
            const cols = Math.ceil(Math.sqrt(total));
            const row = Math.floor(index / cols);
            const col = index % cols;
            const spacing = 7;
            const baseX = (col - cols / 2) * spacing + spacing / 2;
            const baseZ = (row - cols / 2) * spacing + spacing / 2;
            x = baseX; z = baseZ; y = 0.2;
        }
    }

    // Apply Explosion
    x = x * (1 + explosion * 0.5);
    z = z * (1 + explosion * 0.5);
    y = y + (explosion * 5);


    let Component;
    let yOffset = y;

    // --- PRESET SELECTION LOGIC ---
    if (type === 'frame' || name.includes('frame') || name.includes('chassis')) {
        Component = <GenericChassis />;
    }
    else if (type === 'enclosure' || name.includes('box') || name.includes('case')) {
        Component = <GenericEnclosure />;
    }
    else if (type === 'wheel' || name.includes('wheel') || name.includes('tire')) {
        Component = <Wheel />;
    }
    else if (type === 'camera' || name.includes('cam')) {
        Component = <ESP32Cam />;
    }
    else if (type === 'frame' || name.includes('arm')) { // Catch discrete arms if not full frame
        Component = <DroneArm />;
    }
    else if (type === 'propeller' || name.includes('prop') || name.includes('rotor')) {
        Component = <Propeller />;
    }
    else if (type === 'microcontroller') {
        if (name.includes('uno') || name.includes('mega')) Component = <ArduinoUno />;
        else if (name.includes('pi') || name.includes('raspberry')) Component = <RaspberryPi />;
        else if (name.includes('cam')) Component = <ESP32Cam />; // Catch ESP32-CAM labelled as uC
        else Component = <ESP32 />;
    }
    else if (type === 'display' || name.includes('screen') || name.includes('lcd') || name.includes('oled')) {
        Component = <DisplayModule />;
    }
    else if (type === 'motor' || type === 'servo' || name.includes('motor') || name.includes('fan')) {
        Component = <Motor />;
        rotation = [0, 0, 0]; // Reset rotation for new motors standing up
    }
    else if (type === 'battery' || name.includes('battery') || name.includes('lipo')) {
        Component = <Battery />;
        rotation = [0, 0, Math.PI / 2];
    }
    else if (name.includes('arduino')) {
        Component = <ArduinoUno />;
    } else if (name.includes('pi') || name.includes('raspberry')) {
        Component = <RaspberryPi />;
    } else {
        Component = <SensorModule name={part.name} />;
    }

    return (
        <group position={[x, yOffset, z]} rotation={rotation as any}>
            {/* Blueprint Override Material */}
            {blueprint ? (
                <group>
                    {/* Simplified Blueprint Representation */}
                    {Component}
                </group>
            ) : Component}

            {!name.includes('arduino') && !name.includes('pi') && !name.includes('frame') && !name.includes('enclosure') && (
                <Billboard
                    position={[0, 2 + explosion, 0]}
                    follow={true}
                    lockX={false}
                    lockY={false}
                    lockZ={false}
                >
                    <Text
                        fontSize={0.3}
                        color={blueprint ? "#fff" : "#333"}
                        anchorY="bottom"
                        outlineWidth={blueprint ? 0 : 0.02}
                        outlineColor="#fff"
                    >
                        {part.name}
                    </Text>
                </Billboard>
            )}
        </group>
    );
};

// 3D WIRES
const Wires = ({ wiring, parts, explosion, blueprint }: { wiring: Wire[], parts: Part[], explosion: number, blueprint: boolean }) => {
    if (!wiring || !Array.isArray(wiring) || wiring.length === 0) return null;

    return (
        <group>
            {wiring.map((wire, i) => {
                const partsList = parts || [];
                const cols = Math.ceil(Math.sqrt(partsList.length));
                const spacing = 7;

                // Helper to find position of a part
                const getPos = (partName: string) => {
                    if (!partName) return new THREE.Vector3(0, 0, 0);
                    const index = partsList.findIndex((p: Part) => p.name && (p.name === partName || partName.includes(p.name)));
                    if (index === -1) return new THREE.Vector3(0, 0, 0);
                    const part = partsList[index];
                    let x, y, z;
                    if (part.placement) {
                        x = part.placement.x || 0; y = part.placement.y || 0; z = part.placement.z || 0;
                        x = x * (1 + explosion * 0.5); z = z * (1 + explosion * 0.5); y = y + (explosion * 5) + 0.5;
                    } else {
                        const row = Math.floor(index / cols); const col = index % cols;
                        const baseX = (col - cols / 2) * spacing + spacing / 2; const baseZ = (row - cols / 2) * spacing + spacing / 2;
                        x = baseX * (1 + explosion * 0.5); z = baseZ * (1 + explosion * 0.5); y = 0.5 + (explosion * 3) * (index % 2 === 0 ? 1 : 1.5);
                    }
                    return new THREE.Vector3(x, y, z);
                }

                const start = getPos(wire.from_part);
                const end = getPos(wire.to_part);

                // Control points for curve (arc up)
                const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
                mid.y += 4 + (explosion * 2); // Wires stretch when exploded

                // Wire Color
                let color = "gray";
                if (wire.wire_color) color = wire.wire_color.toLowerCase();
                if (color === "vcc" || color === "5v" || color === "red") color = "#d32f2f"; // Red
                else if (color === "gnd" || color === "ground" || color === "black") color = "#212121"; // Black
                else if (color === "blue") color = "#1976d2";
                else if (color === "yellow") color = "#fbc02d";
                else if (color === "green") color = "#388e3c";

                return (
                    <QuadraticBezierLine
                        key={i}
                        start={start}
                        end={end}
                        mid={mid}
                        lineWidth={blueprint ? 1 : 3}
                        color={blueprint ? "#00ffff" : color}
                        dashed={blueprint}
                    />
                )
            })}
        </group>
    )
}


// PCB / MOUNTING PLATE
const PCB = ({ width, depth }: { width: number, depth: number }) => {
    return (
        <group position={[0, -0.2, 0]}>
            {/* Internal Mounting Plate - Dark Grey */}
            <RoundedBox args={[width + 2, 0.1, depth + 2]} radius={0.5} smoothness={4}>
                <meshStandardMaterial
                    color="#2b2b2b"
                    roughness={0.7}
                    metalness={0.4}
                />
            </RoundedBox>
            {/* Subtle Grid for placement context, less obtrusive */}
            <Grid
                position={[0, 0.06, 0]}
                args={[width + 2, depth + 2]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#444"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#555"
                fadeDistance={30}
                fadeStrength={1}
            />
        </group>
    )
}


const BuildVisualizer = ({ parts, wiring, deviceName, analysis }: BuildVisualizerProps) => {

    const [explosion, setExplosion] = useState(0);
    const [selectedPart, setSelectedPart] = useState<Part | string | null>(null);
    const [blueprintMode, setBlueprintMode] = useState(false);

    const partsList = parts || [];
    const boardSize = Math.max(10, Math.ceil(Math.sqrt(partsList.length)) * 7);

    return (
        <div className={`w-full h-full relative ${blueprintMode ? 'bg-[#001020]' : 'bg-gray-100'}`} onClick={() => setSelectedPart(null)}>

            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                {/* Blueprint Toggle */}
                <Button
                    variant={blueprintMode ? "default" : "secondary"}
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setBlueprintMode(!blueprintMode); }}
                    className="border shadow-sm w-64"
                >
                    <Layers className="w-4 h-4 mr-2" />
                    {blueprintMode ? 'Blueprint Active' : 'Enable Blueprint'}
                </Button>

                {/* Explosion Control */}
                <div
                    className="bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg border border-gray-200 w-64 cursor-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-gray-700">Exploded View</label>
                        <span className="text-xs text-gray-500">{Math.round(explosion * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={explosion}
                        onChange={(e) => setExplosion(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>
            </div>

            {/* Analysis Card */}
            {selectedPart && (
                <div
                    className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-blue-100 max-w-sm animate-in slide-in-from-left-5 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {typeof selectedPart === 'string' ? selectedPart : selectedPart.name}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        {typeof selectedPart === 'string' ? (<div className="italic">Custom Part</div>) : (
                            <>
                                <p><span className="font-semibold">Type:</span> {selectedPart.type || 'Generic'}</p>
                                {selectedPart.specs && <p><span className="font-semibold">Specs:</span> {selectedPart.specs}</p>}
                                {selectedPart.note && <p className="bg-blue-50 p-2 rounded text-blue-800 border border-blue-100">{selectedPart.note}</p>}
                                <div className="pt-2 flex gap-2">
                                    {selectedPart.datasheet_url && (
                                        <a href={selectedPart.datasheet_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><FileCode className="w-3 h-3" /> Datasheet</a>
                                    )}
                                    {selectedPart.buy_url && <a href={selectedPart.buy_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Buy</a>}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="w-full h-full">
                <Canvas shadows camera={{ position: [40, 40, 40], fov: 30 }}>
                    {/* STUDIO LIGHTING */}
                    {blueprintMode ? (
                        <color attach="background" args={['#001020']} /> // Dark Blue/Black
                    ) : (
                        <color attach="background" args={['#f3f4f6']} />
                    )}
                    <fog attach="fog" args={['#f3f4f6', 40, 150]} />

                    <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.9} />

                    <ambientLight intensity={blueprintMode ? 0.3 : 0.7} />
                    <spotLight
                        position={[50, 60, 40]}
                        angle={0.25}
                        penumbra={1}
                        intensity={1.2}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-bias={-0.0001}
                    />
                    <pointLight position={[-20, 20, -20]} intensity={0.5} color="#e0f2fe" />

                    <Environment preset="city" />

                    {blueprintMode && <gridHelper args={[100, 100, 0x004488, 0x002244]} position={[0, -5, 0]} />}

                    {/* MODELS GROUP */}
                    <group position={[0, -5, 0]}>

                        {/* Internal Electronics */}
                        <group position={[0, 0, 0]}>
                            {/* PCB - Only show if NO frame/chassis parts are present */}
                            {!blueprintMode && !partsList.some(p => p.type === 'frame' || p.name.toLowerCase().includes('chassis') || p.name.toLowerCase().includes('arm')) && (
                                <PCB width={boardSize} depth={boardSize} />
                            )}

                            {blueprintMode && (
                                <group position={[0, -0.2, 0]}>
                                    <lineSegments>
                                        <edgesGeometry args={[new THREE.BoxGeometry(boardSize + 2, 0.1, boardSize + 2)]} />
                                        <lineBasicMaterial color="#0088ff" />
                                    </lineSegments>
                                </group>
                            )}

                            {partsList.map((part, i) => (
                                <group
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPart(part);
                                    }}
                                >
                                    <ProceduralComponent
                                        part={part}
                                        index={i}
                                        total={partsList.length}
                                        explosion={explosion}
                                        blueprint={blueprintMode}
                                    />
                                    {/* Selection Highlight */}
                                    {selectedPart === part && (
                                        <mesh position={[part.placement?.x || 0, (part.placement?.y || 0) + 2, part.placement?.z || 0]}>
                                            <sphereGeometry args={[0.5]} />
                                            <meshBasicMaterial color={blueprintMode ? "#00ffff" : "#3b82f6"} transparent opacity={0.6} wireframe={blueprintMode} />
                                        </mesh>
                                    )}
                                </group>
                            ))}
                            <Wires wiring={wiring} parts={partsList} explosion={explosion} blueprint={blueprintMode} />
                        </group>
                    </group>

                    <ContactShadows opacity={0.4} scale={60} blur={2.5} far={10} color="#000000" />
                </Canvas>
            </div>
        </div>
    );
};

export default BuildVisualizer;
