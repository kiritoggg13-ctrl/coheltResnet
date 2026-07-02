from fastapi import FastAPI, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
import requests

app = FastAPI(title="CocoaHealth - Klasifikasi Penyakit Kakao")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

HF_API_URL = "https://geryuga-coheltfastapi.hf.space/predict"
CONFIDENCE_THRESHOLD = 70.0

DESCRIPTIONS = {
    "black_pod_rot": {
        "nama": "Black Pod Rot (Busuk Buah Hitam)",
        "deskripsi": "Penyakit busuk pada buah kakao yang menyebabkan buah menghitam.",
        "penanganan": [
            "Buang buah yang terinfeksi.",
            "Jaga kebun tidak lembap.",
            "Gunakan fungisida tembaga."
        ]
    },
    "healthy": {
        "nama": "Buah Kakao Sehat",
        "deskripsi": "Buah kakao dalam kondisi normal.",
        "penanganan": [
            "Lanjutkan perawatan rutin.",
            "Jaga sanitasi kebun."
        ]
    },
    "pod_borer": {
        "nama": "Pod Borer (PBK)",
        "deskripsi": "Hama penggerek buah kakao.",
        "penanganan": [
            "Panen tepat waktu.",
            "Gunakan perangkap feromon."
        ]
    },
    "unknown": {
        "nama": "Bukan Buah Kakao",
        "deskripsi": "Gambar tidak dikenali sebagai buah kakao.",
        "solusi": [
            "Pastikan objek adalah buah kakao.",
            "Gunakan pencahayaan cukup.",
            "Ambil gambar dengan fokus jelas."
        ]
    }
}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        
        # Forward the request to the Hugging Face API
        files = {"file": (file.filename, contents, file.content_type)}
        response = requests.post(HF_API_URL, files=files)
        
        result = response.json()
        
        # Check confidence if available from the API
        confidence = result.get("confidence")
        if confidence is not None and isinstance(confidence, (int, float)):
            if float(confidence) < CONFIDENCE_THRESHOLD:
                return JSONResponse({
                    "class": "unknown",
                    "details": DESCRIPTIONS["unknown"]
                })
        
        # Add the description details to the response
        predicted_class = result.get("class")
        if predicted_class:
            result["details"] = DESCRIPTIONS.get(predicted_class, {})
            
        return JSONResponse(result)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
