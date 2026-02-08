import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY, transport="rest")

MODEL_NAME = "gemini-flash-latest"

# System prompt to enforce JSON structure
SYSTEM_PROMPT = """
You are a senior hardware engineer and maker context expert.
Your goal is to generate a detailed, accurately wired, and visually descriptive build plan for the user's project.
You do NOT generate 3D CAD files directly. Instead, you define the **Specific Parts** and **Wiring** so precisely that a frontend visualizer can render them using high-quality preset models.

Return ONLY valid JSON.

# CORE RESPONSIBILITIES
1. **Component Selection**: Select real, popular components (ESP32, Arduino, Sensors, Modules).
2. **Type Classification**: You MUST assign a strict `type` to each part from the allowed list so the visualizer knows what 3D model to show.
3. **Accurate Wiring**: Define every wire needed to make it work.

# ALLOWED PART TYPES
For the `parts` array, the `type` field MUST be one of:
- `microcontroller` (e.g. Arduino, ESP32, Raspberry Pi, Pico)
- `camera` (e.g. ESP32-CAM, Pi Camera, Webcam Module)
- `sensor` (e.g. DHT11, Ultrasonic, Motion, Gas)
- `motor` (e.g. Servo, DC Motor, Stepper)
- `wheel` (e.g. Robot Wheel, Car Tire)
- `propeller` (e.g. Drone Prop, Fan Blade)
- `frame` (e.g. Drone Arm, Chassis, Robot Body, 3D Printed Frame)
- `enclosure` (e.g. Plastic Box, Case, Housing, Project Box)
- `display` (e.g. OLED, LCD 16x2, E-Ink)
- `battery` (e.g. LiPo, 18650, 9V, AA holder)
- `led` (e.g. Single LED, RGB Strip, Matrix)
- `button` (e.g. Push button, Switch)
- `module` (Generic PCB modules, L298N, Relays)
- `other` (Everything else)

# JSON RESPONSE FORMAT
{
    "device_name": "Device Name",
    "description": "Short description",
    "parts": [
        {
            "name": "Project Box (100x60x25mm)",
            "type": "enclosure",
            "quantity": 1,
            "specs": "ABS Plastic",
            "note": "Houses all electronics",
            "image_search_term": "project box electronics"
        },
        {
            "name": "ESP32-CAM",
            "type": "camera",
            "quantity": 1,
            "placement": {"x": 0, "y": 1, "z": 0},
            "specs": "2MP, WiFi",
            "note": "Main controller & camera",
            "image_search_term": "ESP32-CAM pinout"
        }
    ],
    "wiring_diagram": [
        {"from": "ESP32-CAM (5V)", "to": "Battery (VCC)", "label": "Power", "wire_color": "Red"},
        {"from": "ESP32-CAM (GND)", "to": "Battery (GND)", "label": "GND", "wire_color": "Black"}
    ],

**CRITICAL RULES:**
1. **MANDATORY WIRING**: You MUST generate a `wiring_diagram`. It cannot be empty. Even if simple, connect VCC/GND.
2. **Colors**: Use standard wire colors (Red=VCC, Black=GND, others for signals).
3. **Chassis/Enclosure**: **CRITICAL**: If the build is a VEHICLE, use `frame` (chassis). If it's a STATIONARY DEVICE (hub, sensor), use `enclosure` (box/case).
4. **Safety**: If the request is unsafe, return a JSON with error field.
    "firmware": "// C++ / MicroPython code...",
    "steps": ["Step 1", "Step 2"],
    "analysis": "Markdown analysis..."
}

**CRITICAL RULES:**
1. **Wiring**: The `wiring_diagram` MUST be an array of objects. `from` and `to` should look like "PartName (PinName)".
2. **Colors**: Use standard wire colors (Red=VCC, Black=GND, others for signals).
3. **Part Types**: Be accurate. If it's an ESP32, type MUST be `microcontroller`. If it's a screen, type MUST be `display`.
4. **Safety**: If the request is unsafe, return a JSON with error field.
"""

async def generate_build_plan(prompt: str):
    if not GEMINI_API_KEY:
        # Mock response for when API key is missing (for safety/testing)
        return {
            "device_name": "Mock Device (No API Key)",
            "description": "Please add GEMINI_API_KEY to .env to get real results.",
            "parts": [],
            "wiring_diagram": [],
            "firmware": "// No API Key",
            "analysis": "No analysis (Mock).",
            "steps": []
        }

    model = genai.GenerativeModel(MODEL_NAME)
    
    full_prompt = f"{SYSTEM_PROMPT}\n\nUser Request: {prompt}\n\nResponse:"
    
    # Configure safety settings to avoid blocking harmless hardware descriptions
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    ]
    
    from starlette.concurrency import run_in_threadpool

    try:
        # Use sync method in threadpool to avoid blocking event loop
        # and bypass async library compatibility issues
        response = await run_in_threadpool(
            model.generate_content,
            full_prompt, 
            safety_settings=safety_settings,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Check if response was blocked
        if not response.parts:
            print(f"DEBUG: Response blocked. Feedback: {response.prompt_feedback}")
            return {"error": "AI response blocked by safety filters.", "details": str(response.prompt_feedback)}

        text = response.text
        
        # Robust JSON extraction and Repair
        import re
        
        # 0. Cleanups
        # Remove markdown code blocks if present
        text = re.sub(r'```json', '', text)
        text = re.sub(r'```', '', text)
        
        # 1. Try to find JSON block
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            text = match.group(0)
            
        # 2. Escape newlines inside strings to prevent JSON errors
        # Improved: Remove ALL control characters except newlines and tabs which are valid in JSON strings (escaped)
        # But for raw JSON parsing, we usually want to strip unescaped controls.
        # We will strip non-printable characters.
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]', '', text) 

        # 3. Parse JSON
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            # Fallback: try to fix common trailing comma issues
            text = re.sub(r',\s*\}', '}', text)
            text = re.sub(r',\s*\]', ']', text)
            try:
                data = json.loads(text)
            except:
                print(f"ERROR: Failed to parse JSON. Raw text: {text}")
                return {"error": "Failed to generate valid JSON.", "details": text}

        # --- POST-PROCESSING & VALIDATION ---
        
        # 1. Ensure 'parts' exists
        if "parts" not in data:
            data["parts"] = []

        # 2. MANDATORY WIRING GENERATION (Fallback)
        # If wiring_diagram is missing or empty, AUTO-GENERATE it based on parts.
        if "wiring_diagram" not in data or not data["wiring_diagram"] or len(data["wiring_diagram"]) == 0:
            print("DEBUG: Wiring diagram missing/empty. Auto-generating fallback wiring.")
            parts = data.get("parts", [])
            wiring = []
            
            # Find Power Source (Battery) and Controller (MCU/Camera)
            battery = next((p for p in parts if p.get("type") == "battery"), None)
            controller = next((p for p in parts if p.get("type") in ["microcontroller", "camera"]), None)
            
            if battery and controller:
                # Power Controller
                wiring.append({"from": f"{controller['name']} (5V/VCC)", "to": f"{battery['name']} (VCC)", "label": "Power", "wire_color": "Red"})
                wiring.append({"from": f"{controller['name']} (GND)", "to": f"{battery['name']} (GND)", "label": "GND", "wire_color": "Black"})
                
                # Power other components from Controller or Battery
                for p in parts:
                    if p == battery or p == controller: continue
                    if p.get("type") in ["frame", "enclosure", "wheel", "propeller"]: continue # Skip structural
                    
                    # Connect to Controller (Signal/Power)
                    wiring.append({"from": f"{p['name']} (VCC)", "to": f"{controller['name']} (3V3/5V)", "label": "Power", "wire_color": "Red"})
                    wiring.append({"from": f"{p['name']} (GND)", "to": f"{controller['name']} (GND)", "label": "GND", "wire_color": "Black"})
                    wiring.append({"from": f"{p['name']} (Data)", "to": f"{controller['name']} (GPIO)", "label": "Signal", "wire_color": "Yellow"})
            elif controller:
                 # USB Power Fallback
                 for p in parts:
                    if p == controller: continue
                    if p.get("type") in ["frame", "enclosure", "wheel", "propeller"]: continue
                    wiring.append({"from": f"{p['name']} (VCC)", "to": f"{controller['name']} (3V3)", "label": "Power", "wire_color": "Red"})
                    wiring.append({"from": f"{p['name']} (GND)", "to": f"{controller['name']} (GND)", "label": "GND", "wire_color": "Black"})

            data["wiring_diagram"] = wiring

        # 3. FORMAT NORMALIZATION (Crucial for Frontend)
        # The frontend expects {from_part, from_pin, to_part, to_pin}
        # The AI (and fallback) generates {from: "Part (Pin)", to: "Part (Pin)"}
        # We must parse the strings.
        normalized_wiring = []
        for wire in data.get("wiring_diagram", []):
            new_wire = wire.copy()
            
            # Parse 'from'
            if "from" in wire and "(" in wire["from"]:
                parts = wire["from"].rsplit(" (", 1)
                new_wire["from_part"] = parts[0].strip()
                new_wire["from_pin"] = parts[1].replace(")", "").strip()
            elif "from_part" not in wire:
                # Fallback if no parens
                new_wire["from_part"] = wire.get("from", "Unknown")
                new_wire["from_pin"] = "Pin"

            # Parse 'to'
            if "to" in wire and "(" in wire["to"]:
                parts = wire["to"].rsplit(" (", 1)
                new_wire["to_part"] = parts[0].strip()
                new_wire["to_pin"] = parts[1].replace(")", "").strip()
            elif "to_part" not in wire:
                new_wire["to_part"] = wire.get("to", "Unknown")
                new_wire["to_pin"] = "Pin"
            
            normalized_wiring.append(new_wire)
        
        data["wiring_diagram"] = normalized_wiring

        return data

    except Exception as e:
        import traceback
        err_msg = f"{e}\n{traceback.format_exc()}"
        print(f"ERROR in AI Engine: {err_msg}")
        # Write to file for debugging
        try:
            with open("backend_error_500.log", "w", encoding="utf-8") as f:
                f.write(err_msg)
                f.write("\n\nRAW TEXT:\n")
                # write text if it exists, otherwise "N/A"
                f.write(locals().get('text', 'N/A'))
        except:
            pass
            
        return {
            "error": str(e), 
            "details": "Failed to generate valid plan."
        }
