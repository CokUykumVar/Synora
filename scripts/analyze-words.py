"""
Synora - Word List Analyzer
Finds duplicates and non-visualizable words
"""

import csv
from collections import defaultdict
from pathlib import Path

CSV_FILE = Path(__file__).parent / "words-template.csv"

# Words that cannot be effectively visualized (abstract concepts)
NON_VISUALIZABLE_PATTERNS = [
    # Abstract business/formal concepts
    "ethics", "compliance", "integrity", "transparency", "accountability",
    "governance", "paradigm", "methodology", "framework", "infrastructure",
    "synergy", "synergism", "bureaucracy", "hierarchy", "delegation",
    "mentorship", "stewardship", "protocol", "mandate", "provision",
    "clause", "amendment", "ratification", "jurisdiction", "litigation",
    "arbitration", "indemnity", "liability", "precedent", "sanction",
    "embargo", "tariff", "quota", "diversification", "benchmarking",
    "optimization", "scalability", "volatility", "liquidity", "solvency",

    # Abstract qualities/states
    "resilience", "agility", "efficiency", "productivity", "sustainability",
    "validity", "reliability", "bias", "parity", "equity", "diversity",
    "inclusion", "representation", "authenticity", "zenith", "zeitgeist",
    "equilibrium", "homeostasis", "continuity", "transition", "fragility",
    "stability", "autonomy", "alienation", "estrangement", "dysfunction",

    # Philosophical/scientific abstract terms
    "epistemology", "ontology", "paradigm shift", "heuristic", "taxonomy",
    "metacognition", "cognitivism", "behaviorism", "constructivism",
    "humanism", "didactics", "andragogy", "pedagogy", "semiotics",
    "poetics", "aesthetics", "dramaturgy", "historiography",

    # Complex processes that can't be shown in one image
    "photosynthesis", "metabolism", "fermentation", "decomposition",
    "symbiosis", "mutualism", "commensalism", "desalination",
    "deforestation", "reforestation", "desertification", "urbanization",
    "carbon sequestration", "nitrogen cycle", "carbon cycle",

    # Abstract measurements/concepts
    "permeability", "porosity", "solubility", "viscosity", "viscosity",
    "magnitude", "latitude", "longitude", "hemisphere",

    # Technology abstractions
    "algorithm", "encryption", "decryption", "authentication",
    "authorization", "virtualization", "abstraction", "encapsulation",
    "polymorphism", "inheritance", "instantiation", "recursion",
    "multithreading", "concurrency", "interoperability", "sovereignty",
    "singularity", "paradigm shift",

    # Business/legal abstractions
    "competitiveness", "market penetration", "niche", "speculation",
    "arbitrage", "fiscal year", "inflation", "deflation", "recession",
    "prosperity", "core competency", "value chain", "supply chain",
    "procurement", "tender", "bid", "quote", "estimate", "requisition",
    "authorization", "ratification",

    # Health abstractions
    "epidemiology", "pharmacology", "toxicology", "physiology",
    "biochemistry", "microbiology", "immunology", "genomics",
    "bioinformatics", "prevalence", "incidence", "morbidity", "mortality",
    "prognosis", "prophylaxis", "co-morbidity", "idiopathic",
    "asymptomatic", "psychosomatic", "cognitive", "neurological",

    # Family/relationship abstractions
    "kinship", "consanguinity", "affinity", "primogeniture",
    "matrilineal", "patrilineal", "hereditary", "predisposition",
    "traits", "disposition", "temperament", "cohesion", "dynamics",
    "intergenerational", "socioeconomic", "demographic",

    # Education abstractions
    "curriculum development", "instructional design", "psychometrics",
    "standardization", "accreditation", "globalization", "internationalization",
    "erudition", "enlightenment", "empowerment", "advocacy", "consensus",

    # Music/art abstractions
    "ethnomusicology", "musicology", "counterpoint", "atonality",
    "dissonance", "consonance", "chromaticism", "psychoacoustics",
    "spatial audio", "performance rights", "mechanical rights",
    "commercialism", "counterculture",

    # Entertainment abstractions
    "surrealism", "neo-realism", "expressionism", "minimalism",
    "post-modernism", "allegory", "symbolism", "iconography",
    "subtext", "nuance", "ambiguity", "paradox", "rhetoric",
    "eloquence", "charisma", "prestige", "consumerism",

    # Nature abstractions
    "ecology", "geology", "meteorology", "astronomy", "botany",
    "zoology", "entomology", "ornithology", "paleontology",
    "cartography", "topography", "carrying capacity", "ecological footprint",

    # Shopping/business abstractions
    "merchandising", "franchising", "commercialization", "segmentation",
    "psychographics", "behavioral", "engagement", "conversion rate",
    "bounce rate", "analytics", "disruption", "entrepreneurship",

    # Sports abstractions
    "biomechanics", "kinesiology", "proprioception", "sabermetrics",
    "technicality", "disqualification", "adjudication", "commercialization",
    "demographics", "viewership",

    # Verbs that are too abstract to visualize as a single image
    "be", "have", "do", "mean", "seem", "become", "let", "allow",
    "include", "continue", "set", "lead", "understand", "follow",
    "create", "add", "spend", "grow", "offer", "feel", "think",
    "know", "want", "need", "believe", "happen", "keep", "begin",

    # Abstract adjectives
    "true", "false", "possible", "impossible", "likely", "unlikely",
    "necessary", "relevant", "general", "specific", "particular",
    "certain", "definite", "absolute", "relative", "implicit", "explicit",
    "inherent", "inevitable", "initial", "final", "eventual",
    "adequate", "appropriate", "acceptable", "available", "beneficial",
    "comprehensive", "compulsory", "considerable", "consistent", "constant",
    "contemporary", "conventional", "critical", "decisive", "democratic",
    "dependent", "determined", "diplomatic", "distinct", "diverse",
    "dominant", "dynamic", "economic", "efficient", "emotional",
    "empirical", "entire", "environmental", "essential", "ethical",
    "ethnic", "evident", "evolutionary", "exclusive", "experimental",
    "extensive", "extraordinary", "extreme", "favorable", "federal",
    "flexible", "formal", "fortunate", "fundamental", "genuine",
    "gradual", "hostile", "identical", "ignorant", "immense",
    "incredible", "infinite", "innovative", "intense", "interactive",
    "intermediate", "international", "invisible", "irrelevant", "isolated",
    "joint", "just", "key", "legitimate", "liberal", "logical",

    # Emotions that are hard to distinguish visually
    "ambivalent", "apathetic", "skeptical", "stoic", "cynical",
    "indignant", "apprehensive", "empathic", "resilient",
]

def load_words():
    words = []
    with open(CSV_FILE, 'r', encoding='utf-8-sig') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split(',')
            if len(parts) >= 3:
                word = parts[0].strip().lower()
                category = parts[1].strip().lower()
                level = parts[2].strip().lower()
                words.append({
                    'word': word,
                    'category': category,
                    'level': level,
                    'original': line
                })
    return words

def find_duplicates(words):
    """Find duplicate words within the same category"""
    category_words = defaultdict(list)

    for w in words:
        key = (w['word'], w['category'])
        category_words[key].append(w)

    duplicates = []
    for key, items in category_words.items():
        if len(items) > 1:
            duplicates.append({
                'word': key[0],
                'category': key[1],
                'count': len(items),
                'levels': [i['level'] for i in items]
            })

    return duplicates

def find_non_visualizable(words):
    """Find words that cannot be effectively visualized"""
    non_viz = []

    for w in words:
        word_lower = w['word'].lower()

        # Check if word matches any non-visualizable pattern
        for pattern in NON_VISUALIZABLE_PATTERNS:
            if word_lower == pattern.lower():
                non_viz.append(w)
                break

    return non_viz

def main():
    print("=" * 60)
    print("SYNORA - Word List Analyzer")
    print("=" * 60)

    words = load_words()
    print(f"\nTotal words loaded: {len(words)}")

    # Count by category
    categories = defaultdict(int)
    for w in words:
        categories[w['category']] += 1

    print("\nWords per category:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}")

    # Find duplicates
    print("\n" + "=" * 60)
    print("DUPLICATE WORDS (same word in same category)")
    print("=" * 60)

    duplicates = find_duplicates(words)
    if duplicates:
        for d in sorted(duplicates, key=lambda x: x['category']):
            print(f"  '{d['word']}' in '{d['category']}' appears {d['count']}x (levels: {d['levels']})")
        print(f"\nTotal duplicates found: {len(duplicates)}")
    else:
        print("  No duplicates found!")

    # Find non-visualizable
    print("\n" + "=" * 60)
    print("NON-VISUALIZABLE WORDS (abstract concepts)")
    print("=" * 60)

    non_viz = find_non_visualizable(words)
    if non_viz:
        by_category = defaultdict(list)
        for w in non_viz:
            by_category[w['category']].append(w['word'])

        for cat in sorted(by_category.keys()):
            print(f"\n  {cat.upper()}:")
            for word in sorted(by_category[cat]):
                print(f"    - {word}")

        print(f"\nTotal non-visualizable words: {len(non_viz)}")
    else:
        print("  No problematic words found!")

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total words: {len(words)}")
    print(f"Duplicates to remove: {len(duplicates)}")
    print(f"Non-visualizable to remove: {len(non_viz)}")
    print(f"Clean words: {len(words) - len(duplicates) - len(non_viz)}")

if __name__ == "__main__":
    main()
