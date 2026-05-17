"""
MultilingualTranslator - Moteur de traduction FR ↔ Mooré ↔ Dioula ↔ Fulfuldé
==============================================================================

Ce module implémente un système de traduction basé sur un modèle Transformer
fine-tuné sur un corpus parallèle santé/climat du Burkina Faso.

En production, ce module chargerait un modèle mBART fine-tuné.
Pour le prototype, il utilise un dictionnaire de traductions pré-calculées
et des règles de génération de messages.
"""

import random
from typing import Dict, List, Optional


# Corpus de traduction santé/climat (mock pour prototype)
HEALTH_VOCABULARY = {
    "fr": {
        "déshydratation": {"moore": "ko-yiibu", "dioula": "ji bɔli", "fulfulde": "ɗaccugol ndiyam"},
        "paludisme": {"moore": "weoogo", "dioula": "sumaya", "fulfulde": "heendu"},
        "vaccin": {"moore": "piqûre", "dioula": "pikiri", "fulfulde": "leɓɓitol"},
        "fièvre": {"moore": "wʋʋsgo", "dioula": "farigan", "fulfulde": "jontinoowo"},
        "diarrhée": {"moore": "sãn-pʋʋsgo", "dioula": "kɔnɔbɔli", "fulfulde": "reedu yaɗa"},
        "moustiquaire": {"moore": "mõosã", "dioula": "mɔsikitɛri", "fulfulde": "saakitorde"},
        "eau potable": {"moore": "ko-sõngo", "dioula": "ji ɲuman", "fulfulde": "ndiyam laaɓɗam"},
        "centre de santé": {"moore": "laafi yiri", "dioula": "dɔgɔtɔrɔso", "fulfulde": "suudu cellal"},
        "enfant": {"moore": "biiga", "dioula": "denmisɛn", "fulfulde": "ɓinngel"},
        "mère": {"moore": "ma", "dioula": "ba", "fulfulde": "inna"},
        "chaleur": {"moore": "wẽnde", "dioula": "funteni", "fulfulde": "nguleeki"},
        "pluie": {"moore": "saaga", "dioula": "sanji", "fulfulde": "toɓo"},
        "inondation": {"moore": "ko-zẽnga", "dioula": "ji bonyali", "fulfulde": "ilam"},
        "sécheresse": {"moore": "tẽn-koɛɛga", "dioula": "tile waati", "fulfulde": "wuɗɗere"},
        "nourriture": {"moore": "rɩɩbo", "dioula": "dumuni", "fulfulde": "ɲaamdu"},
        "médicament": {"moore": "tɩɩm", "dioula": "fura", "fulfulde": "leɗɗe"},
    }
}

# Messages de prévention pré-traduits par contexte
PREVENTION_MESSAGES = {
    "heat_wave": {
        "mothers": {
            "fr": "Chaleur extrême prévue. Donnez beaucoup d'eau à vos enfants. Si diarrhée ou fatigue, allez au CSPS immédiatement.",
            "moore": "Wẽnd-kãsenga n wat. Kõ-n y biiga ko wʋsgo. Sã biiga sẽn pʋʋsd bɩ a pa tar pãnga, kẽng-y laafi yiri zĩig pʋgẽ.",
            "dioula": "Funteni belebele bɛ nana. Aw ye ji caman di aw deenw ma. Ni kɔnɔbɔli walima sɛgɛn bɛ u la, aw ye taa dɔgɔtɔrɔso la joona.",
            "fulfulde": "Nguleeki mawndi arani. Ndokkon ɓikkoy ndiyam keewɗam. So reedu yaɗa maa tampere woodii, njahon suudu cellal law.",
        },
        "health_workers": {
            "fr": "ALERTE CANICULE J+1. Activer protocoles déshydratation. Vérifier stocks SRO et perfusions. Surveillance renforcée <5 ans.",
            "moore": "KEOOG-NOORE: Wẽnd-kãsenga beeme. Sɩng-y ko-yiibu tʋʋmde. Ges-y SRO la sɛrɛ sẽn be. Gũus-y kamb nins sẽn pa ta yʋʋm a nu wã.",
            "dioula": "LASIGIDEN: Funteni bɛ se. Aw ye ji bɔli furakɛli daminɛ. SRO ni sɛrɔm aw ye olu lajɛ. Denmisɛnw kɔlɔsi ka fisa san 5.",
            "fulfulde": "JEERTOL: Nguleeki mawndi ari. Udditon peeje ɗaccugol ndiyam. Ƴeewton SRO e perfusion. Reenton ɓikkon ɓe timmaani duuɓi 5.",
        },
        "community_leaders": {
            "fr": "Vague de chaleur attendue. Protégez les enfants et personnes âgées. Partagez l'eau. Signalez tout cas de malaise au CSPS.",
            "moore": "Wẽnd-kãsenga n wat. Maan-y kamb la nin-kẽemba. Pʋɩ-y ko-n taaba. Sã ned sẽn pa noom, togs-y laafi yiri.",
            "dioula": "Funteni belebele bɛ nana. Aw ye denmisɛnw ni cɛkɔrɔbaw tanga. Ji tilali kɛ. Ni mɔgɔ dɔ bana, aw ye dɔgɔtɔrɔso lasigiden.",
            "fulfulde": "Nguleeki mawndi arani. Ndeenon sukaaɓe e mawɓe. Peccondiral ndiyam. So neɗɗo sellaani, tindinon suudu cellal.",
        },
    },
    "flood": {
        "mothers": {
            "fr": "Risque d'inondation. Montez en hauteur avec vos enfants. Protégez la nourriture. Ne buvez pas l'eau de pluie stagnante.",
            "moore": "Ko-zẽng n wat. Rɩk-y ne y kamb n dɩk zĩig sẽn zãnde. Maan-y rɩɩbo. Da yũ-y ko sẽn sɩlg ye.",
            "dioula": "Ji bonyali bɛ se. Aw ni aw deenw ye yɛlɛ sanfɛ. Dumuni mara. Aw kana sanji ji min min bɛ sɔrɔ.",
            "fulfulde": "Ilam ina ara. Ƴaamon e ɓikkoy dow. Ndeenon ɲaamdu. Taa nyaron ndiyam toɓo darinɗam.",
        },
    },
    "malaria": {
        "mothers": {
            "fr": "Paludisme en hausse. Faites dormir vos enfants sous moustiquaire. Consultez si fièvre > 2 jours.",
            "moore": "Weoogo n paasdẽ. Gũnug-y y kamb mõosã pʋgẽ. Sã wʋʋsgo sẽn yɩɩd rasem a yiibu, kẽng-y laafi yiri.",
            "dioula": "Sumaya bɛ bonyali la. Aw ye aw deenw lalada mɔsikitɛri kɔnɔ. Ni farigan tɛmɛna tile 2 kan, aw ye taa dɔgɔtɔrɔso la.",
            "fulfulde": "Heendu ina ɓeydoo. Ndaaron ɓikkoy e nder saakitorde. So jontinoowo ɓuri balɗe 2, njahon suudu cellal.",
        },
    },
    "malnutrition": {
        "mothers": {
            "fr": "Période de soudure. Donnez des aliments variés à vos enfants. Allaitement maternel exclusif jusqu'à 6 mois. Consultez si amaigrissement.",
            "moore": "Koms wakate. Kõ-y y kamb rɩɩb toɛ-toɛya. Biig sẽn nan pa ta kiis a yoobe, kõ-y-a ma-bɩɩlem bala. Sã biiga sẽn komsde, kẽng-y laafi yiri.",
            "dioula": "Sunkalo waati. Dumuni suguya caman di aw deenw ma. Sinsinnɔ dɔrɔn fo ka se kalo 6 ma. Ni denmisɛn bɛ faga, taa dɔgɔtɔrɔso la.",
            "fulfulde": "Sahre nde. Ndokkon ɓikkoy ɲaamdu ceertuɗe. Enɗam tan haa lewru 6. So ɓinngel ina raɓɓiɗa, njahon suudu cellal.",
        },
    },
}


class MultilingualTranslator:
    """
    Moteur de traduction multilingue spécialisé santé/climat.
    
    En production, ce module utiliserait:
    - Un modèle mBART fine-tuné sur le corpus parallèle
    - Un tokenizer SentencePiece adapté aux langues burkinabè
    - Un cache de traductions fréquentes
    - Un système de post-édition par des locuteurs natifs
    """

    def __init__(self):
        self.vocabulary = HEALTH_VOCABULARY
        self.prevention_messages = PREVENTION_MESSAGES
        self.supported_languages = ["fr", "moore", "dioula", "fulfulde"]

    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        domain: str = "health",
    ) -> dict:
        """
        Traduit un texte de source_lang vers target_lang.
        
        Pour le prototype, utilise le dictionnaire de vocabulaire et
        des heuristiques de traduction. En production, utiliserait
        le modèle Transformer fine-tuné.
        """
        if source_lang == target_lang:
            return {
                "original_text": text,
                "translated_text": text,
                "source_language": source_lang,
                "target_language": target_lang,
                "confidence": 1.0,
                "alternative_translations": [],
                "domain": domain,
            }

        # Mock translation with vocabulary substitution
        translated = self._mock_translate(text, source_lang, target_lang)
        confidence = random.uniform(0.72, 0.95)

        return {
            "original_text": text,
            "translated_text": translated,
            "source_language": source_lang,
            "target_language": target_lang,
            "confidence": round(confidence, 3),
            "alternative_translations": [
                self._mock_translate(text, source_lang, target_lang)
                for _ in range(2)
            ],
            "domain": domain,
        }

    def _mock_translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """
        Traduction mock utilisant le vocabulaire spécialisé.
        Simule le comportement d'un modèle NMT.
        """
        if source_lang == "fr" and target_lang in self.supported_languages:
            # Try to find matching prevention message
            for category in self.prevention_messages.values():
                for audience_msgs in category.values():
                    if text.strip() == audience_msgs.get("fr", "").strip():
                        return audience_msgs.get(target_lang, text)

            # Word-level substitution for demo
            result = text
            for fr_word, translations in self.vocabulary.get("fr", {}).items():
                if fr_word.lower() in result.lower() and target_lang in translations:
                    result = result.replace(fr_word, translations[target_lang])
            return result

        return f"[{target_lang}] {text}"

    def generate_prevention_message(
        self,
        alert_type: str,
        target_language: str,
        target_audience: str,
        severity: str = "medium",
    ) -> dict:
        """
        Génère un message de prévention adapté culturellement.
        
        Prend en compte:
        - Le type d'alerte (canicule, inondation, épidémie...)
        - La langue cible et ses spécificités culturelles
        - L'audience (mères, agents de santé, leaders communautaires)
        - La sévérité pour adapter le ton
        """
        messages = self.prevention_messages.get(alert_type, {})
        audience_messages = messages.get(target_audience, {})
        message = audience_messages.get(target_language, "")

        if not message:
            # Fallback: translate from French
            fr_message = audience_messages.get("fr", f"Alerte {alert_type}. Prenez les précautions nécessaires.")
            message = self._mock_translate(fr_message, "fr", target_language)

        cultural_notes = self._get_cultural_notes(target_language, target_audience)

        return {
            "message": message,
            "language": target_language,
            "audience": target_audience,
            "cultural_notes": cultural_notes,
            "sms_compatible": len(message) <= 160,
            "character_count": len(message),
        }

    def _get_cultural_notes(self, language: str, audience: str) -> str:
        """Notes culturelles pour adapter la communication."""
        notes = {
            "moore": "Utiliser le vouvoiement collectif. Mentionner le respect des anciens. Référencer les pratiques traditionnelles positives.",
            "dioula": "Ton respectueux mais direct. Utiliser les formules de salutation appropriées. Mentionner la solidarité communautaire.",
            "fulfulde": "Respecter la hiérarchie sociale Peule. Utiliser les termes de parenté appropriés. Adapter au contexte pastoral si pertinent.",
            "fr": "Langage clair et simple. Éviter le jargon médical. Utiliser des phrases courtes.",
        }
        return notes.get(language, "Adapter au contexte local.")
