"""
Language Detector - Détection automatique de la langue
======================================================

Utilise des n-grammes de caractères et un classificateur pour
identifier la langue d'un texte parmi: Français, Mooré, Dioula, Fulfuldé.

En production, utiliserait un modèle fastText ou un classificateur
entraîné sur un corpus multilingue burkinabè.
"""

import re
from typing import Dict


# Caractéristiques linguistiques pour la détection
LANGUAGE_FEATURES = {
    "fr": {
        "common_words": {"le", "la", "les", "de", "des", "un", "une", "et", "est", "dans",
                        "pour", "que", "qui", "sur", "avec", "pas", "sont", "plus", "ce"},
        "char_patterns": ["tion", "ment", "eur", "que", "ais", "ait"],
        "diacritics": "éèêëàâùûîïôç",
    },
    "moore": {
        "common_words": {"sẽn", "la", "ne", "bɩ", "yaa", "pʋgẽ", "zĩig", "wã", "n",
                        "tɩ", "sã", "bala", "ye", "ka", "pa"},
        "char_patterns": ["ẽ", "ɩ", "ʋ", "ã", "ĩ"],
        "diacritics": "ẽɩʋãĩũ",
    },
    "dioula": {
        "common_words": {"bɛ", "ye", "ka", "ni", "la", "kɛ", "min", "aw", "o", "dɔ",
                        "fɛ", "na", "ko", "kan", "ma"},
        "char_patterns": ["ɛ", "ɔ", "ɲ", "ŋ"],
        "diacritics": "ɛɔɲŋ",
    },
    "fulfulde": {
        "common_words": {"e", "ɗe", "ɗum", "ko", "nde", "ina", "ɓe", "o", "mo",
                        "ngam", "haa", "so", "nii", "ɗon", "ɗoo"},
        "char_patterns": ["ɗ", "ɓ", "ŋ", "ɲ", "nde", "ɗe"],
        "diacritics": "ɗɓŋɲ",
    },
}


class LanguageDetector:
    """
    Détecteur de langue pour les langues du Burkina Faso.
    
    Méthode:
    1. Analyse des caractères spéciaux (diacritiques spécifiques)
    2. Détection de mots-clés fréquents
    3. Analyse des patterns de n-grammes
    4. Score combiné avec pondération
    """

    def __init__(self):
        self.features = LANGUAGE_FEATURES

    def detect(self, text: str) -> Dict:
        """
        Détecte la langue d'un texte.
        Retourne la langue détectée avec un score de confiance.
        """
        text_lower = text.lower()
        words = set(re.findall(r'\b\w+\b', text_lower))

        scores = {}
        for lang, features in self.features.items():
            score = 0.0

            # Score based on common words (weight: 0.4)
            common_word_matches = len(words & features["common_words"])
            word_score = min(common_word_matches / 5, 1.0) * 0.4
            score += word_score

            # Score based on character patterns (weight: 0.35)
            pattern_matches = sum(1 for p in features["char_patterns"] if p in text_lower)
            pattern_score = min(pattern_matches / 3, 1.0) * 0.35
            score += pattern_score

            # Score based on diacritics (weight: 0.25)
            diacritic_count = sum(1 for c in text if c in features["diacritics"])
            diacritic_score = min(diacritic_count / 3, 1.0) * 0.25
            score += diacritic_score

            scores[lang] = round(score, 4)

        # Normalize scores
        total = sum(scores.values()) or 1
        probabilities = {lang: round(score / total, 4) for lang, score in scores.items()}

        detected = max(scores, key=scores.get)
        confidence = probabilities[detected]

        return {
            "detected_language": detected,
            "confidence": confidence,
            "probabilities": probabilities,
        }
