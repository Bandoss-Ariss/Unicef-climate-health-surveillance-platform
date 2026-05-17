"""
API endpoints pour le moteur de traduction multilingue.
Traduction entre Français, Mooré, Dioula et Fulfuldé.
"""

from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.translation_engine.translator import MultilingualTranslator
from app.translation_engine.language_detector import LanguageDetector

router = APIRouter()


class TranslationRequest(BaseModel):
    text: str = Field(..., description="Texte à traduire")
    source_language: str = Field(..., description="Langue source (fr, moore, dioula, fulfulde)")
    target_language: str = Field(..., description="Langue cible (fr, moore, dioula, fulfulde)")
    domain: Optional[str] = Field(default="health", description="Domaine (health, climate, general)")


class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    confidence: float
    alternative_translations: List[str]
    domain: str


class BatchTranslationRequest(BaseModel):
    texts: List[str]
    source_language: str
    target_language: str
    domain: Optional[str] = "health"


class LanguageDetectionRequest(BaseModel):
    text: str


class LanguageDetectionResponse(BaseModel):
    detected_language: str
    confidence: float
    probabilities: dict


class PreventionMessageRequest(BaseModel):
    """Génère un message de prévention adapté culturellement."""
    alert_type: str = Field(..., description="Type d'alerte (heat_wave, flood, malaria, etc.)")
    target_language: str
    target_audience: str = Field(..., description="Audience (mothers, health_workers, community_leaders)")
    severity: str = "medium"


class PreventionMessageResponse(BaseModel):
    message: str
    language: str
    audience: str
    cultural_notes: str
    sms_compatible: bool
    character_count: int


@router.post("/translate", response_model=TranslationResponse, summary="Traduire un texte")
async def translate_text(request: TranslationRequest):
    """
    Traduit un texte entre les langues supportées.
    Utilise un modèle Transformer fine-tuné sur le vocabulaire santé/climat
    du Burkina Faso.
    """
    translator = MultilingualTranslator()
    result = translator.translate(
        text=request.text,
        source_lang=request.source_language,
        target_lang=request.target_language,
        domain=request.domain,
    )
    return TranslationResponse(**result)


@router.post("/translate/batch", response_model=List[TranslationResponse], summary="Traduction par lot")
async def translate_batch(request: BatchTranslationRequest):
    """Traduit plusieurs textes en une seule requête."""
    translator = MultilingualTranslator()
    results = []
    for text in request.texts:
        result = translator.translate(
            text=text,
            source_lang=request.source_language,
            target_lang=request.target_language,
            domain=request.domain,
        )
        results.append(TranslationResponse(**result))
    return results


@router.post("/detect", response_model=LanguageDetectionResponse, summary="Détecter la langue")
async def detect_language(request: LanguageDetectionRequest):
    """Détecte automatiquement la langue d'un texte."""
    detector = LanguageDetector()
    result = detector.detect(request.text)
    return LanguageDetectionResponse(**result)


@router.post("/prevention-message", response_model=PreventionMessageResponse, summary="Générer message prévention")
async def generate_prevention_message(request: PreventionMessageRequest):
    """
    Génère un message de prévention adapté culturellement et linguistiquement.
    Prend en compte les spécificités culturelles de chaque groupe ethnique.
    """
    translator = MultilingualTranslator()
    message = translator.generate_prevention_message(
        alert_type=request.alert_type,
        target_language=request.target_language,
        target_audience=request.target_audience,
        severity=request.severity,
    )
    return PreventionMessageResponse(**message)


@router.get("/languages", summary="Langues supportées")
async def supported_languages():
    """Liste des langues supportées avec leurs métadonnées."""
    return {
        "languages": [
            {
                "code": "fr",
                "name": "Français",
                "native_name": "Français",
                "speakers_burkina": "~25%",
                "script": "Latin",
                "model_quality": "high",
            },
            {
                "code": "moore",
                "name": "Mooré",
                "native_name": "Mòoré",
                "speakers_burkina": "~50%",
                "script": "Latin",
                "model_quality": "medium",
                "notes": "Langue principale des Mossi, groupe ethnique majoritaire",
            },
            {
                "code": "dioula",
                "name": "Dioula",
                "native_name": "Julakan",
                "speakers_burkina": "~15%",
                "script": "Latin/N'Ko",
                "model_quality": "medium",
                "notes": "Langue véhiculaire de l'Afrique de l'Ouest",
            },
            {
                "code": "fulfulde",
                "name": "Fulfuldé",
                "native_name": "Fulfulde",
                "speakers_burkina": "~10%",
                "script": "Latin/Adlam",
                "model_quality": "medium",
                "notes": "Langue des Peuls, importante dans la région du Sahel",
            },
        ],
        "supported_domains": ["health", "climate", "nutrition", "water", "general"],
        "model_info": {
            "architecture": "mBART-based Transformer",
            "fine_tuned_on": "Health & Climate corpus (Burkina Faso)",
            "training_pairs": 85000,
            "bleu_score_avg": 34.7,
        },
    }
