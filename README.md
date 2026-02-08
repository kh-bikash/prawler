# Prawler 🤖🛠️

**Prawler** is an AI-powered hardware engineering assistant that autonomously generates build plans, 3D visualizations, and wiring diagrams for any custom hardware project—from drones and rovers to IoT weather stations.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Tech Stack](https://img.shields.io/badge/Tech-Next.js%20%7C%20FastAPI%20%7C%20Three.js%20%7C%20Google%20Gemini-blue)

## 🚀 Key Features

*   **AI Build Plans**: converting natural language prompts (e.g., "Build a Mars Rover with ESP32-CAM") into detailed BOMs and step-by-step instructions.
*   **Universal 3D Visualizer**:
    *   **Drones**: Automatically renders quadcopter frames, propellers, and motors.
    *   **Rovers**: Intelligently places wheels and chassis for vehicle builds.
    *   **Enclosures**: Generates translucent project boxes for stationary IoT devices.
    *   **Blueprint Mode**: One-click toggle for technical wireframe views.
*   **Smart Wiring Engine**:
    *   **2D Interactive Graph**: React Flow-based wiring diagrams.
    *   **Auto-Failover**: Procedural generation fallback ensures wiring data is *never* missing, even if the AI hallucinates.
*   **Strict Part Classification**: Backend logic enforces type safety (`microcontroller`, `sensor`, `frame`) for accurate 3D model mapping.

## 🛠️ Tech Stack

*   **Frontend**: Next.js 14, Tailwind CSS, React Three Fiber (3D), React Flow (Wiring).
*   **Backend**: Python FastAPI, Google Gemini 1.5 Flash (AI Engine).
*   **Infrastructure**: Docker (optional), SQLite/PostgreSQL (Planned).

## 📦 Installation & Setup

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/yourusername/prawler.git
    cd prawler
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    pip install -r requirements.txt
    # Create .env and add GEMINI_API_KEY=your_key_here
    uvicorn main:app --reload
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Access**: Open `http://localhost:3000`

---
