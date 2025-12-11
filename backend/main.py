import base64
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.utils import create_image, edit_image

app = FastAPI(title="Image Generation and Editing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _encode_image_bytes(image_bytes: bytes) -> str:
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/create-image")
async def generate_image(payload: dict):
    prompt = payload.get("prompt", "").strip()
    size = payload.get("size", "1024x1024")

    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required to generate an image")

    try:
        image_bytes = create_image(prompt=prompt, size=size)
        image_data_url = _encode_image_bytes(image_bytes)
        return JSONResponse({"image": image_data_url})
    except Exception as exc:  # pragma: no cover - guarded external call
        raise HTTPException(status_code=500, detail=f"Failed to generate image: {exc}") from exc


@app.post("/api/edit-image")
async def edit_uploaded_image(
    prompt: str = Form(...),
    image: UploadFile = File(...),
):
    prompt_value = prompt.strip()
    if not prompt_value:
        raise HTTPException(status_code=400, detail="Prompt is required to edit an image")

    try:
        image_bytes = await image.read()
        edited_image_bytes = edit_image(prompt_value, image_bytes)
        edited_image_data_url = _encode_image_bytes(edited_image_bytes)
        return JSONResponse({"image": edited_image_data_url})
    except Exception as exc:  # pragma: no cover - guarded external call
        raise HTTPException(status_code=500, detail=f"Failed to edit image: {exc}") from exc
