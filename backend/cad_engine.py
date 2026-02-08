
import os
import uuid
import logging
import build123d as build123d_module
from build123d import *

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

STATIC_DIR = "static/stls"
os.makedirs(STATIC_DIR, exist_ok=True)

def generate_stl(script_content: str) -> dict:
    """
    Executes a build123d script and exports 'lid' and 'body' objects to STL.
    Returns a dictionary with URLs to the generated files.
    """
    try:
        # 1. Prepare execution environment
        local_scope = {}
        
        # dynamic globals from build123d
        exec_globals = {}
        exec_globals.update(build123d_module.__dict__)
        
        # Add extras
        exec_globals.update({
            "__name__": "__main__",
            "__builtins__": __builtins__,
            "logging": logging,
        })

        # 2. execute the script
        logger.info("Executing build123d script...")
        exec(script_content, exec_globals, local_scope)

        # 3. Extract parts
        lid = local_scope.get("lid")
        body = local_scope.get("body")
        
        # If script uses 'result' instead of lid/body (single part fallback)
        result = local_scope.get("result")
        
        if not lid and not body and result:
             # Try to split if it's a compound, otherwise just treat result as body
             body = result

        output = {}
        build_id = str(uuid.uuid4())

        # 4. Export Body
        if body:
            if isinstance(body, (Part, Compound)):
                body_filename = f"body_{build_id}.stl"
                body_path = os.path.join(STATIC_DIR, body_filename)
                export_stl(body, body_path)
                output["openscad_body"] = f"/static/stls/{body_filename}" # Keeping key name for compatibility for now, or change to stl_body_url
                output["stl_body_url"] = f"/static/stls/{body_filename}"
            else:
                 logger.warning(f"Body variable found but is not a Part/Compound: {type(body)}")

        # 5. Export Lid
        if lid:
            if isinstance(lid, (Part, Compound)):
                lid_filename = f"lid_{build_id}.stl"
                lid_path = os.path.join(STATIC_DIR, lid_filename)
                export_stl(lid, lid_path)
                output["openscad_lid"] = f"/static/stls/{lid_filename}"
                output["stl_lid_url"] = f"/static/stls/{lid_filename}"
            else:
                 logger.warning(f"Lid variable found but is not a Part/Compound: {type(lid)}")
        
        if not output:
            raise ValueError("Script executed but no 'lid', 'body', or 'result' variables containing 3D parts were found.")

        return output

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"CAD Generation Failed: {e}\n{tb}")
        logger.error(f"FAILING SCRIPT CONTENT:\n{script_content}")
        return {"error": str(e), "traceback": tb, "script": script_content}
