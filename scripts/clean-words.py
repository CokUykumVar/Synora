"""
Synora - Word List Cleaner
Removes duplicates and non-visualizable words
"""

from collections import defaultdict
from pathlib import Path

CSV_FILE = Path(__file__).parent / "words-template.csv"
OUTPUT_FILE = Path(__file__).parent / "words-clean.csv"

# Words that cannot be effectively visualized (abstract concepts)
NON_VISUALIZABLE = {
    # Abstract business/formal concepts
    "ethics", "compliance", "integrity", "transparency", "accountability",
    "governance", "paradigm", "methodology", "framework", "infrastructure",
    "synergy", "synergism", "bureaucracy", "hierarchy", "delegation",
    "mentorship", "stewardship", "protocol", "mandate", "provision",
    "clause", "amendment", "ratification", "jurisdiction", "litigation",
    "arbitration", "indemnity", "liability", "precedent", "sanction",
    "embargo", "tariff", "quota", "diversification", "benchmarking",
    "optimization", "scalability", "volatility", "liquidity", "solvency",
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

    # Complex processes
    "photosynthesis", "metabolism", "fermentation", "decomposition",
    "symbiosis", "mutualism", "commensalism", "desalination",
    "deforestation", "reforestation", "desertification", "urbanization",
    "carbon sequestration", "nitrogen cycle", "carbon cycle",

    # Abstract measurements
    "permeability", "porosity", "solubility", "viscosity",
    "magnitude", "latitude", "longitude", "hemisphere",
    "carrying capacity", "ecological footprint",

    # Technology abstractions
    "algorithm", "encryption", "decryption", "authentication",
    "authorization", "virtualization", "abstraction", "encapsulation",
    "polymorphism", "inheritance", "instantiation", "recursion",
    "multithreading", "concurrency", "interoperability", "sovereignty",
    "singularity",

    # Business abstractions
    "competitiveness", "market penetration", "niche", "speculation",
    "arbitrage", "fiscal year", "inflation", "deflation", "recession",
    "prosperity", "core competency", "value chain", "supply chain",
    "procurement", "tender", "bid", "quote", "estimate", "requisition",

    # Health abstractions
    "epidemiology", "pharmacology", "toxicology", "physiology",
    "biochemistry", "microbiology", "immunology", "genomics",
    "bioinformatics", "prevalence", "incidence", "morbidity", "mortality",
    "prognosis", "prophylaxis", "co-morbidity", "idiopathic",
    "asymptomatic", "psychosomatic", "cognitive", "neurological",

    # Family abstractions
    "kinship", "consanguinity", "affinity", "primogeniture",
    "matrilineal", "patrilineal", "hereditary", "predisposition",
    "traits", "disposition", "temperament", "cohesion", "dynamics",
    "intergenerational", "socioeconomic", "demographic",

    # Education abstractions
    "curriculum development", "instructional design", "psychometrics",
    "standardization", "accreditation", "globalization", "internationalization",
    "erudition", "enlightenment", "empowerment", "advocacy", "consensus",

    # Music abstractions
    "ethnomusicology", "musicology", "counterpoint", "atonality",
    "dissonance", "consonance", "chromaticism", "psychoacoustics",
    "spatial audio", "performance rights", "mechanical rights",
    "commercialism", "counterculture",

    # Entertainment abstractions
    "surrealism", "neo-realism", "expressionism", "minimalism",
    "post-modernism", "allegory", "symbolism", "iconography",
    "subtext", "nuance", "ambiguity", "paradox", "rhetoric",
    "eloquence", "charisma", "prestige", "consumerism",

    # Nature science terms
    "ecology", "geology", "meteorology", "astronomy", "botany",
    "zoology", "entomology", "ornithology", "paleontology",
    "cartography", "topography",

    # Shopping abstractions
    "merchandising", "franchising", "commercialization", "segmentation",
    "psychographics", "behavioral", "engagement", "conversion rate",
    "bounce rate", "analytics", "disruption", "entrepreneurship",

    # Sports abstractions
    "biomechanics", "kinesiology", "proprioception", "sabermetrics",
    "technicality", "disqualification", "adjudication", "viewership",
    "demographics",

    # Abstract verbs (too hard to show as single image)
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

    # Abstract emotions
    "ambivalent", "apathetic", "skeptical", "stoic", "cynical",
    "indignant", "apprehensive", "empathic", "resilient",
}

def load_words():
    words = []
    with open(CSV_FILE, 'r', encoding='utf-8-sig') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split(',')
            if len(parts) >= 3:
                word = parts[0].strip()
                category = parts[1].strip()
                level = parts[2].strip()
                words.append({
                    'word': word,
                    'category': category,
                    'level': level
                })
    return words

def clean_words(words):
    """Remove duplicates and non-visualizable words"""

    # Track seen words per category
    seen = set()
    clean = []
    removed_duplicates = 0
    removed_abstract = 0

    for w in words:
        word_lower = w['word'].lower()
        category = w['category'].lower()
        key = (word_lower, category)

        # Skip duplicates
        if key in seen:
            removed_duplicates += 1
            continue

        # Skip non-visualizable
        if word_lower in NON_VISUALIZABLE:
            removed_abstract += 1
            continue

        seen.add(key)
        clean.append(w)

    return clean, removed_duplicates, removed_abstract

def save_words(words):
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        for w in words:
            f.write(f"{w['word']},{w['category']},{w['level']}\n")

def main():
    print("=" * 60)
    print("SYNORA - Word List Cleaner")
    print("=" * 60)

    words = load_words()
    print(f"\nOriginal words: {len(words)}")

    clean, dup_count, abstract_count = clean_words(words)

    print(f"Removed duplicates: {dup_count}")
    print(f"Removed non-visualizable: {abstract_count}")
    print(f"Clean words: {len(clean)}")

    save_words(clean)
    print(f"\nSaved to: {OUTPUT_FILE}")

    # Count by category
    print("\n" + "=" * 60)
    print("CLEAN WORDS BY CATEGORY")
    print("=" * 60)

    categories = defaultdict(int)
    for w in clean:
        categories[w['category']] += 1

    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}")

if __name__ == "__main__":
    main()
