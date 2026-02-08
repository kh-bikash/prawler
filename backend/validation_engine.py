from typing import List, Dict, Any

def validate_build(parts: List[Dict[str, Any]]) -> List[str]:
    """
    Analyzes parts list and returns a list of warnings.
    """
    warnings = []
    
    parts_text = " ".join([p.get("name", "").lower() + " " + p.get("specs", "").lower() for p in parts])
    
    # Check for power source
    if not any(x in parts_text for x in ["battery", "usb", "power supply", "adapter", "plug"]):
        warnings.append("No obvious power source detected (battery, USB, adapter).")
        
    # Check for voltage mismatch keywords (very basic heuristic)
    if "3.3v" in parts_text and "5v" in parts_text:
        warnings.append("Mixed voltages (3.3V and 5V) detected. Ensure logic level shifting or regulation is used.")
        
    # Check for microcontroller
    if not any(x in parts_text for x in ["arduino", "esp32", "esp8266", "stm32", "raspberry", "pico", "attiny"]):
        warnings.append("No common microcontroller detected. Ensure this is intended.")
        
    return warnings
