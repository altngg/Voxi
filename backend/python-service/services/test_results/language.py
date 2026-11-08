LANGUAGE_KEYS = {
    "en": "en",
    "english": "en",
}

LEVELS_CONFIG = [ "A1", "A2", "B1", "B2", "C1", "C2" ]

LANGUAGE_CONFIG = {
    "en": {
        "grammar_topics" : [ "Present Simple", "Present Continuous", "Present Perfect", "Present Perfect Continuous" ],
        "levels_criteria" : {
            "A1": {
                "grammar_min": 40,
                "vocabulary_min": 40,
                "topics": {
                    "Present Simple": 8,
                    "to be": 8,
                    "Articles": 6,
                    "Pronouns": 6,
                    "There is / There are": 6,
                },
            },
            "A2": {
                "grammar_min": 50,
                "vocabulary_min": 50,
                "topics": {
                    "Present Simple": 8,
                    "Present Continuous": 8,
                    "Past Simple": 7,
                    "Articles": 7,
                    "Countable / Uncountable nouns": 7,
                    "Comparatives and Superlatives": 7,
                },
            },
            "B1": {
                "grammar_min": 60,
                "vocabulary_min": 60,
                "topics": {
                    "Present Simple": 8,
                    "Present Continuous": 8,
                    "Past Simple": 8,
                    "Present Perfect": 8,
                    "Future forms": 8,
                    "Modal verbs": 8,
                    "First Conditional": 7,
                },
            },
            "B2": {
                "grammar_min": 70,
                "vocabulary_min": 70,
                "topics": {
                    "Present Perfect": 9,
                    "Present Perfect Continuous": 8,
                    "Passive Voice": 8,
                    "Reported Speech": 8,
                    "Second Conditional": 8,
                    "Third Conditional": 7,
                    "Relative clauses": 8,
                },
            },
            "C1": {
                "grammar_min": 80,
                "vocabulary_min": 80,
                "topics": {
                    "Mixed Conditionals": 9,
                    "Inversion": 8,
                    "Cleft sentences": 8,
                    "Advanced modal verbs": 9,
                    "Advanced participle clauses": 8,
                },
            },
            "C2": {
                "grammar_min": 90,
                "vocabulary_min": 90,
                "topics": {
                    "Advanced conditionals": 10,
                    "Inversion": 10,
                    "Complex clause structures": 10,
                    "Advanced tense and aspect contrasts": 10,
                    "Advanced modal and pragmatic usage": 10,
                },
            },
        }
    }
}
