"use client"

import React, { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Edge,
    Node,
    Position,
    useNodesState,
    useEdgesState,
    MarkerType,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

interface WiringVisualizerProps {
    wiringData: any[];
    partsData: any[];
}

const nodeWidth = 180;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes, edges };
};

const isHorizontal = true;

const WiringVisualizer: React.FC<WiringVisualizerProps> = ({ wiringData, partsData }) => {

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const addedNodes = new Set();

        // Helper to get or add node
        const getOrAddNode = (partName: string) => {
            if (!partName) return;
            const normalizedName = partName.trim();
            if (!addedNodes.has(normalizedName)) {
                // Find part type for styling if possible
                const partInfo = partsData?.find(p => p.name.includes(normalizedName) || normalizedName.includes(p.name));
                let bg = '#fff';
                let border = '#333';

                if (partInfo?.type?.toLowerCase().includes('microcontroller')) { bg = '#3b82f6'; border = '#1e3a8a'; } // Blue
                else if (partInfo?.type?.toLowerCase().includes('sensor')) { bg = '#10b981'; border = '#064e3b'; } // Green
                else if (partInfo?.type?.toLowerCase().includes('actuator')) { bg = '#f59e0b'; border = '#78350f'; } // Amber
                else if (partInfo?.type?.toLowerCase().includes('power')) { bg = '#ef4444'; border = '#7f1d1d'; } // Red

                nodes.push({
                    id: normalizedName,
                    data: { label: normalizedName },
                    position: { x: 0, y: 0 },
                    style: {
                        background: bg,
                        color: '#fff',
                        border: `1px solid ${border}`,
                        borderRadius: '8px',
                        padding: '10px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        width: nodeWidth,
                    },
                });
                addedNodes.add(normalizedName);
            }
            return normalizedName;
        };

        if (Array.isArray(wiringData)) {
            wiringData.forEach((conn, index) => {
                const sourceId = getOrAddNode(conn.from_part);
                const targetId = getOrAddNode(conn.to_part);

                edges.push({
                    id: `e-${index}`,
                    source: sourceId,
                    target: targetId,
                    label: `${conn.from_pin} → ${conn.to_pin}`,
                    animated: true,
                    style: { stroke: conn.wire_color || '#888', strokeWidth: 2 },
                    labelStyle: { fill: '#888', fontWeight: 700, fontSize: 10 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: conn.wire_color || '#888' },
                });
            });
        }

        return getLayoutedElements(nodes, edges);
    }, [wiringData, partsData]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Recalculate layout if data changes (layout logic is inside useMemo, but we need to update state)
    React.useEffect(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
    }, [initialNodes, initialEdges, setNodes, setEdges]);


    if (!Array.isArray(wiringData) || wiringData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg text-gray-400">
                No structural wiring data available for this build.
            </div>
        );
    }

    return (
        <div style={{ height: 600, border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-right"
            >
                <Background gap={12} size={1} />
                <Controls />
            </ReactFlow>
        </div>
    );
};

export default WiringVisualizer;
