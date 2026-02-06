"""
Synora - Kelime Görselleri Üretici
Gemini (açıklama) + fal.ai (görsel) + Bunny.net (CDN)

Kullanım:
1. python generate-images.py --test   (tek kelime test)
2. python generate-images.py          (tüm kelimeleri üret)

Maliyet: Gemini ücretsiz + fal.ai ~$0.003/resim
"""

import os
import json
import time
import re
import requests
from pathlib import Path
from distinctive_descriptions import DISTINCTIVE_DESCRIPTIONS

# ============== API KEYS ==============

GEMINI_API_KEY = "AIzaSyDToyVCVU82OXfHhq3TanU2i1Wyh5_9o2w"
FAL_API_KEY = "7b68e5a5-3412-4565-bf06-6dad1a1587e8:7fd4389137cfda6ac56f93e956cfd68c"
BUNNY_API_KEY = "caafa46f-fbd1-43d0-972bbfa3c2a5-ca35-4251"

# ============== BUNNY.NET AYARLARI ==============

BUNNY_STORAGE_ZONE = "synora-images"
BUNNY_STORAGE_PATH = "/words"
BUNNY_STORAGE_HOST = "storage.bunnycdn.com"
BUNNY_CDN_URL = "https://synora-images.b-cdn.net/words"

# ============== DİĞER AYARLAR ==============

WORDS_FILE = Path(__file__).parent / "words-for-images.json"
GENERATED_FILE = Path(__file__).parent / "generated-images.json"
OUTPUT_FOLDER = Path(__file__).parent / "generated-images"  # Görseller bu klasöre kaydedilecek

# API endpoints
FAL_API_URL = "https://queue.fal.run/fal-ai/flux/schnell"  # schnell model - hızlı ve ucuz
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

# Rate limiting
DELAY_BETWEEN_REQUESTS = 3  # fal.ai requests
GEMINI_RETRY_DELAY = 10     # Gemini rate limit retry (longer wait)
GEMINI_MAX_RETRIES = 5      # Max retries for Gemini

# ============== GÖRSEL PROMPT ŞABLONU ==============

# Karakter gerektiren kategoriler
CATEGORIES_WITH_CHARACTERS = ["emotions", "verbs", "health", "sports", "family", "people_roles"]

# Kategori bazlı prompt şablonları
CATEGORY_PROMPTS = {
    "everyday_objects": """A single {description} shown clearly as the main subject.

Style: Clean 3D render or realistic product photography
- Object centered and filling 80% of frame
- Soft studio lighting from top-left
- IMPORTANT: Use soft BLUE-GRAY gradient background (not white!)
- Object should have realistic colors (NOT white/gray)
- High detail, photorealistic quality
- Show the object from its most recognizable angle
- CRITICAL: ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS, NO LABELS, NO BRAND NAMES anywhere in the image
- NO writing on the object, completely blank surface
- Just the object itself, nothing else""",

    "food_drink": """A delicious {word} photographed beautifully.

Style: Food photography style
- Appetizing, fresh appearance
- Soft natural lighting
- Clean white or wooden surface
- Shallow depth of field
- NO text, NO labels, NO packaging
- Makes viewer hungry""",

    "travel": """A {word} related to travel and transportation.

Style: Clean travel photography
- Bright, inviting atmosphere
- Clear blue sky or neutral background
- Professional quality
- NO text, NO signs with words""",

    "nature_animals": """A {word} in its natural environment.

Style: Nature photography
- Beautiful natural lighting
- Vibrant colors
- Sharp focus on subject
- Peaceful, serene atmosphere""",

    "sports_hobbies": """A {word} sport or hobby activity/equipment.

Style: Dynamic sports photography
- Action or equipment clearly shown
- Energetic feel
- Clean background
- Professional sports photography style""",

    "default": """A clear illustration of {word}.

Style: Clean modern illustration
- Subject centered and prominent
- Soft gradient background
- NO text or labels
- Easily recognizable"""
}

def get_image_prompt(word: str, category: str, description: str) -> str:
    """Kategori bazlı görsel promptu oluştur"""
    template = CATEGORY_PROMPTS.get(category, CATEGORY_PROMPTS["default"])
    return template.format(word=word, description=description)

# Eski template (geriye uyumluluk için)
IMAGE_PROMPT_TEMPLATE = """A simple illustration of {description}

Style requirements:
- Flat vector/cartoon style with clean lines
- Light pastel gradient background
- Subject fills most of the frame, centered
- NO text, NO letters, NO words, NO labels anywhere
- Clean, minimal, easily recognizable
- If showing people: simple cartoon style with clear features"""

# ============== FONKSİYONLAR ==============

def load_words():
    """Kelimeleri JSON'dan yükle"""
    if not WORDS_FILE.exists():
        print(f"HATA: {WORDS_FILE} bulunamadi!")
        print("Once 'node extract-words.js' komutunu calistirin.")
        return []

    with open(WORDS_FILE, 'r', encoding='utf-8') as f:
        words = json.load(f)

    print(f"Toplam {len(words)} kelime yuklendi.")
    return words

def load_generated():
    """Daha önce üretilmiş görselleri yükle"""
    if GENERATED_FILE.exists():
        with open(GENERATED_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_generated(generated):
    """Üretilmiş görselleri kaydet"""
    with open(GENERATED_FILE, 'w', encoding='utf-8') as f:
        json.dump(generated, f, indent=2, ensure_ascii=False)

def get_fallback_description(word: str, category: str) -> str:
    """Gemini kullanılamadığında kategori bazlı açıklama"""

    # İNSAN/KARAKTERgerektiren kelimeler
    person_words = {
        # Problematic words (bypass Gemini)
        "belt": "brown leather waist strap with rectangular silver metal buckle, fashion accessory worn with trousers around hips",
        # Travel
        "tourist": "a tourist person with camera and backpack, casual traveler",
        "guide": "a tour guide person holding a small flag, friendly guide",
        "passenger": "a passenger person sitting with luggage",
        "pilot": "an airplane pilot in uniform with cap",
        "driver": "a taxi or bus driver person",
        # Health
        "doctor": "a friendly doctor person in white coat with stethoscope",
        "nurse": "a nurse person in medical scrubs",
        "patient": "a patient person sitting or lying down",
        "dentist": "a dentist person with dental tools",
        "surgeon": "a surgeon in surgical gown and mask",
        # Family
        "mother": "a mother woman smiling warmly",
        "father": "a father man smiling warmly",
        "baby": "a cute baby infant",
        "child": "a happy child kid",
        "grandmother": "an elderly grandmother woman",
        "grandfather": "an elderly grandfather man",
        "sister": "a young girl sister",
        "brother": "a young boy brother",
        "uncle": "an adult uncle man",
        "aunt": "an adult aunt woman",
        # Business
        "boss": "a boss manager person in business suit",
        "employee": "an office employee worker at desk",
        "secretary": "a secretary person at desk",
        "manager": "a manager person in professional attire",
        # Education
        "teacher": "a teacher person at blackboard",
        "student": "a student person with books",
        "professor": "a professor with glasses and books",
        # Sports
        "athlete": "an athlete person in sports gear",
        "coach": "a sports coach with whistle",
        "referee": "a referee in black and white stripes",
        "player": "a sports player in uniform",
        # Music/Entertainment
        "singer": "a singer person with microphone",
        "musician": "a musician playing instrument",
        "actor": "an actor person on stage",
        "dancer": "a dancer person dancing",
        "chef": "a chef in white hat and apron",
        "waiter": "a waiter person with serving tray",
        # Verbs with person
        "run": "a person running, side view, athletic pose",
        "walk": "a person walking, side view",
        "jump": "a person jumping in the air",
        "sit": "a person sitting on a chair",
        "stand": "a person standing upright",
        "sleep": "a person sleeping in bed",
        "eat": "a person eating food",
        "drink": "a person drinking from a glass",
        "read": "a person reading a book",
        "write": "a person writing with pen",
        "swim": "a person swimming in water",
        "dance": "a person dancing",
        "sing": "a person singing with microphone",
        "cook": "a person cooking in kitchen",
        "work": "a person working at desk",
        "study": "a person studying with books",
        "play": "a person playing",
        "laugh": "a person laughing happily",
        "cry": "a person crying with tears",
        "smile": "a person smiling warmly",
        "wave": "a person waving hand",
        "hug": "two people hugging each other warmly",
        "kiss": "two people kissing romantically",
        # Çok kişili / sahne gerektiren kelimeler
        "wedding": "a bride and groom at wedding ceremony",
        "engagement": "a couple with engagement ring, proposal scene",
        "marriage": "a married couple holding hands with rings",
        "family": "a happy family group with parents and children",
        "party": "a group of people celebrating at a party",
        "meeting": "people sitting around a conference table",
        "interview": "two people at a job interview, one asking questions",
        "conversation": "two people talking to each other",
        "argument": "two people arguing with angry expressions",
        "handshake": "two people shaking hands",
        "date": "a romantic couple at dinner date",
        "friendship": "two friends together smiling",
        "teamwork": "a group of people working together",
        "crowd": "a large group of people together",
        "audience": "people sitting watching a performance",
        "class": "students sitting in a classroom",
        "queue": "people standing in a line waiting",
        "traffic": "cars on a busy road",
        "war": "soldiers in battle scene",
        "peace": "people holding hands in harmony",
        "love": "a heart shape or couple in love",
        "fight": "two people fighting or boxing",
        "race": "runners racing on a track",
        "game": "people playing a game together",
        "concert": "a singer performing for audience",
        "theater": "actors on a theater stage",
        "restaurant": "people dining at restaurant tables",
        "cafe": "people sitting at cafe with coffee",
        "hospital": "hospital building with ambulance",
        "school": "school building with students",
        "office": "office interior with desks and computers",
        "airport": "airport terminal with planes",
        "station": "train or bus station building",
        "beach": "beach scene with sand, water, and umbrellas",
        "park": "park with trees, benches, and paths",
        "gym": "gym interior with exercise equipment",
        "library": "library with bookshelves and reading area",
        "museum": "museum interior with art and exhibits",
        "zoo": "zoo with various animals in enclosures",
        "circus": "circus tent with performers",
        "birthday": "birthday cake with candles and celebration",
        "christmas": "christmas tree with presents and decorations",
        "halloween": "halloween pumpkin and spooky decorations",
        "graduation": "graduate in cap and gown with diploma",
        "funeral": "sad funeral scene with flowers",
        "ceremony": "formal ceremony with people gathered",
        # Etkileşim kelimeleri - 2+ kişi gerekli
        "share": "two people sharing food, one giving half to other",
        "help": "one person helping another person stand up",
        "give": "one person giving a gift box to another person",
        "receive": "one person receiving a package from another",
        "teach": "teacher at board explaining to students",
        "learn": "student at desk studying with books",
        "talk": "two people talking face to face",
        "listen": "person listening carefully to another speaking",
        "visit": "person knocking on door, being welcomed by another person",
        "meet": "two people meeting and greeting each other",
        "introduce": "one person introducing two others to each other",
        "invite": "person handing invitation card to another",
        "thank": "person bowing or expressing gratitude to another",
        "apologize": "person apologizing with sorry expression to another",
        "agree": "two people nodding and shaking hands",
        "disagree": "two people with crossed arms facing each other",
        "compete": "two people racing or competing against each other",
        "cooperate": "two people working together on something",
        "communicate": "two people exchanging speech bubbles",
        # Mekan kelimeleri - binalar/manzara gerekli
        "city": "city skyline with tall buildings and skyscrapers",
        "town": "small town with houses and church steeple",
        "village": "small village with cottages and countryside",
        "street": "street view with buildings, sidewalk, and road",
        "road": "long road stretching into distance with lanes",
        "building": "tall modern building with many windows",
        "house": "cozy house with roof, windows, and door",
        "apartment": "apartment building with multiple floors and balconies",
        "store": "store front with shop window and sign",
        "shop": "small shop with products in window display",
        "market": "outdoor market with stalls and vendors",
        "mall": "large shopping mall interior with escalators",
        "hotel": "hotel building with entrance and lobby",
        "factory": "factory building with smokestacks",
        "farm": "farm with barn, fields, and animals",
        "garden": "beautiful garden with flowers and plants",
        "forest": "dense forest with tall trees",
        "mountain": "tall mountain with snow-capped peak",
        "river": "flowing river with banks and water",
        "lake": "calm lake surrounded by nature",
        "ocean": "vast ocean with waves and horizon",
        "island": "tropical island with palm trees in ocean",
        # Yön kelimeleri - OK TABELASI şeklinde
        "left": "a green arrow shape pointing to the left, arrow tip on left side, tail on right side",
        "right": "a blue arrow shape pointing to the right, arrow tip on right side, tail on left side",
        "straight": "a blue road sign with white arrow pointing STRAIGHT ahead UP",
        "back": "a blue road sign with white U-turn arrow pointing backward",
        "near": "a small house and a tree right next to each other, very close together",
        "far": "a tiny house on left and tiny tree on right with huge empty space between them",
        "stop": "a red octagonal STOP traffic sign on a pole",
        "go": "a green traffic light glowing green for GO",
        # Soyut/kavram kelimeleri
        "single": "number 1 with one single apple next to it",
        "double": "number 2 with two identical red apples side by side",
        "world": "3D planet Earth globe showing blue oceans and green continents",
        "stamp": "a single colorful postage stamp, small square with perforated edges, showing a flower design",
        "postcard": "a rectangular postcard with beach photo on front, address lines visible on back side",
        "square": "a European city square plaza with fountain and buildings around",
        "center": "a red target bullseye with arrow hitting the center",
        "sign": "a wooden signpost with directional arrows at crossroads",
        # Para/ödeme kelimeleri
        "price": "a white price tag label showing $99",
        "cash": "stack of green dollar bills and golden coins",
        "card": "a blue credit card with chip and numbers",
        "money": "fan of colorful paper currency bills spread out",
        "currency": "different country money notes - dollar euro yen pound together",
        # Seyahat işlem kelimeleri
        "booking": "a computer screen showing hotel reservation confirmation with checkmark",
        "reservation": "a restaurant table with RESERVED sign on it",
        "cancel": "a ticket with big red X crossed over it",
        "delay": "a person sitting and waiting at airport gate, looking at watch impatiently, clock showing late time",
        "arrival": "airplane landing on runway with wheels touching ground",
        "departure": "airplane taking off from runway into sky",
        "connection": "a chain with two links connected together, metal chain links interlocked",
        "transfer": "person walking between two train platforms with arrows",
        "direct": "airplane with straight arrow from A to B, no stops",
        "terminal": "inside airport terminal building with gates and passengers",
        "border": "border checkpoint gate with barrier and guard booth",
        "customs": "customs officer at desk checking luggage with X-ray machine",
        "visa": "passport page with colorful visa stamp on it",
        "insurance": "a shield icon with checkmark protecting a person silhouette",
        "safety": "a yellow triangle warning sign with exclamation mark",
        "rent": "a car with FOR RENT sign on windshield",
        "hire": "a taxi with HIRE light on top",
        "help": "a blue help desk counter with question mark sign",
        "sightseeing": "tourist taking photo of Eiffel Tower landmark",
        "souvenir": "a gift shop display with magnets, keychains, and small Eiffel tower figurines",
        # Kişi kelimeleri
        "tourist": "tourist wearing hat with camera around neck looking at map",
        "guide": "tour guide holding umbrella up leading a group",
        "passenger": "person sitting in airplane seat looking out window",
        "driver": "taxi driver behind steering wheel in yellow cab",
        "pilot": "airplane pilot in uniform sitting in cockpit with controls",
        "travel": "airplane flying over world globe",
        "trip": "family in car on road trip with mountains in background",
        "tour": "open top tour bus with tourists taking photos",
        # ===== YENİ 100 KELİME - TRAVEL =====
        "exit": "person walking through open doorway to outside, arrow symbol pointing outward through door",
        "entrance": "a building entrance door with ENTER arrow sign",
        "local": "a local market street with traditional shops and vendors",
        "foreign": "multiple country flags from different nations together",
        "abroad": "airplane flying over a world globe map",
        "overseas": "a large ship crossing the blue ocean",
        "journey": "a long winding road through mountains into horizon",
        "route": "a map with red dotted line showing travel route path",
        "schedule": "a calendar planner with dates and times marked",
        "timetable": "train station departure board showing grid of colored rows with clock symbols and train icons",
        "delay": "a large clock showing late time with waiting person",
        "return": "a curved arrow making U-turn going back",
        "one-way": "a single straight arrow pointing one direction only",
        "round-trip": "two arrows forming a circle, going and returning",
        "class": "airplane seats showing different seat sections",
        "economy": "cramped airplane economy class seats in rows",
        "business": "comfortable wide business class airplane seat",
        "first class": "luxurious first class airplane suite with bed",
        "stay": "a cozy hotel room with bed and lamp",
        "guest": "a hotel guest checking in at reception desk",
        "host": "a friendly host welcoming guest at door",
        "hostel": "hostel dormitory room with bunk beds",
        "camping": "camping scene with tent in forest near fire",
        "tent": "a colorful camping tent pitched in nature",
        "caravan": "a caravan RV motorhome parked in nature",
        "cruise": "a large white cruise ship on ocean",
        "deck": "ship deck with wooden floor and railing ocean view",
        "port": "a busy port with large ships and cranes",
        "harbor": "a peaceful harbor with boats and yachts",
        "cabin": "a ship cabin room with small bed and porthole window",
        "crew": "ship crew members in uniform standing together",
        "captain": "a ship captain in white uniform with hat",
        "flight attendant": "a friendly flight attendant serving passengers",
        "take-off": "airplane lifting off from runway into sky",
        "landing": "airplane wheels touching down on runway landing",
        "runway": "long airport runway with painted lines",
        "trolley": "airport luggage trolley cart with suitcases",
        "security": "airport security checkpoint with officers",
        "metal detector": "airport metal detector security gate frame",
        "liquid": "small travel liquid bottles in clear plastic bag",
        "weight": "a luggage scale showing weight measurement",
        "limit": "a speed limit sign showing maximum number",
        "extra": "large suitcase with additional small bag placed on top of it, plus symbol floating nearby",
        "fee": "hand giving money bills through service counter window, payment transaction",
        "tax": "a tax document paper with percentage symbol",
        "bill": "a restaurant bill receipt with itemized charges",
        "receipt": "long paper strip coming out of cash register machine, small shopping bag beside it on counter",
        "brochure": "a colorful travel brochure pamphlet with photos",
        "itinerary": "a travel itinerary document with day by day plan",
        "accommodation": "a hotel building exterior with rooms",
        "destination": "a map pin marker on destination location",
        "delayed": "frustrated person sitting at airport gate with luggage, large wall clock showing late time, airplane visible through window",
        "exchange rate": "two hands exchanging different colored money bills, dollars trading for euros, currency swap",
        "travel insurance": "insurance policy document with airplane symbol",
        "landmark": "famous Eiffel Tower landmark monument",
        "exploration": "explorer with compass and map discovering",
        "voyage": "old sailing ship on long ocean voyage",
        "excursion": "tour group on day trip excursion bus",
        "guided tour": "tour guide with umbrella leading tourist group",
        "package deal": "vacation suitcase with airplane icon, hotel icon, and palm tree icon floating around it as bundle",
        "all-inclusive": "colorful wristband on wrist with small icons showing food plate, drink glass, and swimming pool",
        "self-catering": "apartment kitchen with cooking facilities",
        "half-board": "breakfast and dinner plates together",
        "full-board": "breakfast lunch dinner three meals together",
        "suite": "luxurious hotel suite room with living area",
        "twin room": "hotel room with two separate single beds",
        "amenities": "hotel bathroom items arranged neatly: folded white towels, small soap bars, tiny shampoo bottles on marble counter",
        "facilities": "hotel facilities pool gym spa icons",
        "service": "room service waiter with tray at door",
        "staff": "hotel staff team receptionist bellboy maid",
        "tip": "hand giving money tip to waiter",
        "gratitude": "person bowing showing thank you gratitude",
        "budget": "piggy bank with coins budget savings",
        "luxury": "diamond ring jewelry luxury expensive items",
        "resort": "tropical beach resort with palm trees pool",
        "spa": "relaxing spa treatment massage scene",
        "view": "window with beautiful scenic mountain view",
        "scenery": "beautiful natural scenery mountains lake trees",
        "landscape": "wide landscape panorama of countryside",
        "nature": "nature scene with trees flowers river",
        "adventure": "adventure sports climbing rafting exciting activities",
        "hiking": "person hiking on mountain trail with backpack",
        "trekking": "trekkers climbing steep mountain path",
        "gear": "hiking gear boots backpack poles equipment",
        "equipment": "travel equipment suitcase camera gear laid out",
        "expedition": "expedition team with equipment in wilderness",
        "discovery": "excited explorer with magnifying glass finding ancient golden artifact in cave, moment of discovery",
        "culture": "cultural symbols music art dance traditions",
        "heritage": "ancient heritage building historical architecture",
        "tradition": "traditional cultural ceremony with costumes",
        "customs": "border customs checkpoint with officer at desk examining passport and open suitcase with X-ray scanner",
        "authentic": "authentic handmade traditional crafts",
        "original": "artist hands crafting unique handmade pottery on wheel, one-of-a-kind authentic piece",
        "modern": "modern glass skyscraper building city",
        "ancient": "ancient ruins old temple crumbling stones",
        "historical": "historical castle fortress medieval building",
        "monument": "famous monument statue landmark",
        "statue": "large bronze or stone statue sculpture",
        # ===== YENİ TRAVEL KELİMELERİ =====
        "environment": "beautiful natural environment with trees, river, mountains, and blue sky",
        "climate": "four seasons shown together: sunny summer, orange fall, snowy winter, blooming spring",
        "weather": "weather icons together: bright sun, white clouds, rain drops, lightning bolt",
        "forecast": "TV weather forecast screen showing sun and cloud icons on a map",
        "navigation": "GPS navigation screen on phone showing route with blue arrow on map",
        "compass": "classic compass with red needle pointing north, cardinal directions marked",
        "isolated": "tiny cabin alone on small island surrounded by vast ocean, very remote",
        "wanderlust": "person with backpack dreaming of travel, thought bubble showing landmarks Eiffel Tower pyramids",
        "vagabond": "free-spirited traveler with worn backpack walking on endless road",
        "layover": "tired traveler sleeping on airport bench between flights, luggage beside",
        "off the beaten track": "hidden jungle path through dense forest, adventure trail",
        "jet lag": "exhausted traveler with dark circles, clock showing day and night times confused",
        "pilgrimage": "pilgrim walking toward distant holy temple on mountain",
        "embark": "passenger stepping onto ship gangway, beginning journey",
        "disembark": "passengers walking down airplane stairs onto tarmac",
        "traverse": "hiker crossing long suspension bridge over deep canyon",
        "globetrotter": "traveler with passport full of stamps standing next to globe",
        "nomad": "nomad with camel and tent in desert landscape",
        "expeditionary": "expedition team with gear and equipment in wilderness base camp",
        "uncharted": "old map with blank unexplored area marked with question marks",
        "picturesque": "charming European village with colorful houses by lake, very scenic",
        "panoramic": "wide panoramic mountain view stretching across horizon",
        "breathtaking": "person standing amazed at edge of grand canyon, stunning view",
        "majestic": "majestic snow-capped mountain peak towering above clouds",
        "pristine": "pristine untouched white sand beach with crystal clear water",
        "rugged": "rugged rocky mountain terrain with steep cliffs",
        "verdant": "lush verdant green valley with dense forest and meadows",
        "arid": "dry arid desert landscape with sand dunes and cracked earth",
        "bustling": "bustling busy city street crowded with people and vendors",
        "cosmopolitan": "diverse cosmopolitan city with people of different cultures, world flags",
        "provincial": "quiet provincial countryside town with small shops and farms",
        "rustic": "rustic old wooden barn and farmhouse in countryside",
        "serene": "serene peaceful lake at dawn with perfect reflection, calm water",
        "hospitality": "hotel staff warmly welcoming guest at entrance with open arms",
        "concierge": "hotel concierge at desk helping guest with recommendations",
        "valet": "valet parking attendant receiving car keys from guest",
        "transport": "various transport modes together: bus, train, airplane, ship",
        "ecotourism": "eco-friendly nature tour with guide showing wildlife to tourists",
        "conservation": "park ranger protecting wildlife, animals in natural habitat",
        "icon": "collection of famous world icons: Eiffel Tower, Statue of Liberty, Big Ben",
        "relic": "ancient relic artifact in museum display case with spotlight",
        "artifact": "archaeological artifact: old pottery and tools from excavation",
        "exhibit": "museum exhibit display with paintings and sculptures",
        "gallery": "art gallery interior with paintings on white walls, visitors viewing",
        "masterpiece": "famous masterpiece painting in golden frame on museum wall",
        "architecture": "stunning architecture: gothic cathedral with detailed facade",
        "urban": "urban city scene with tall buildings, busy streets, traffic",
        "rural": "peaceful rural countryside with farms, fields, and barns",
        "suburban": "suburban neighborhood with houses, lawns, and quiet streets",
        "commute": "person commuting to work on crowded subway train",
        "hub": "major transport hub: large central station with many platforms",
        "junction": "road junction where multiple roads meet and cross",
        "interchange": "highway interchange with multiple levels of roads crossing",
        "toll": "toll booth on highway with cars passing through barrier",
        "fare": "bus fare ticket with price printed on it",
        "voucher": "discount voucher coupon with dotted cut line",
        "refund": "hand receiving money back, refund transaction at counter",
        "regulation": "official regulation document with stamps and seals",
        "visa waiver": "passport with visa-free entry stamp, no visa required",
        "residency": "residency permit card next to house keys",
        # ===== FOOD KELİMELERİ =====
        "menu": "restaurant menu booklet open showing food items with pictures",
        "salt": "white salt shaker with salt crystals pouring out",
        "sugar": "sugar bowl with white sugar cubes and spoon",
        "pepper": "black pepper shaker with ground pepper",
        "oil": "olive oil bottle with golden oil and olives",
        "bread": "fresh baked loaf of bread with golden crust",
        "rice": "bowl of white steamed rice with chopsticks",
        "pasta": "plate of spaghetti pasta with red tomato sauce",
        "soup": "bowl of hot soup with steam rising, spoon beside",
        "salad": "fresh green salad bowl with lettuce tomatoes cucumbers",
        "meat": "raw red meat steak on cutting board",
        "fish": "whole fresh fish on plate with lemon slices",
        "chicken": "roasted golden chicken leg drumstick on plate",
        "egg": "three brown eggs in nest, one cracked showing yolk",
        "cheese": "yellow cheese wedge with holes, swiss cheese style",
        "butter": "stick of yellow butter on butter dish with knife",
        "milk": "glass bottle of white milk with full glass beside",
        "fruit": "colorful fresh fruits: apple, orange, banana, grapes together",
        "vegetable": "fresh vegetables: carrot, broccoli, tomato, pepper together",
    }

    if word.lower() in person_words:
        return person_words[word.lower()]

    # Özel NESNE kelimeleri - belirsizlik olmaması için detaylı açıklamalar
    special_words = {
        # Bilgisayar/Elektronik - MUTLAKA belirtilmeli
        "mouse": "a black wireless computer mouse, PC mouse with scroll wheel and buttons, ergonomic design",
        "charger": "a white phone charger with USB cable and wall adapter plug, smartphone charging cable",
        "keyboard": "a black computer keyboard with keys, PC keyboard, QWERTY layout",
        "monitor": "a flat screen computer monitor display, LCD screen on stand",
        "laptop": "an open laptop computer showing screen and keyboard",
        "printer": "an office inkjet printer machine, document printer",
        "remote": "a distant mountain landscape viewed from far away, showing the concept of distance and remoteness, faraway scenery",
        "remote control": "a classic TV remote control with number pad buttons, black plastic remote controller for television",

        # Kırtasiye
        "notebook": "a spiral notebook with colorful cover, school notebook with lines, NOT a laptop",
        "pencil case": "a colorful fabric zipper pencil case open showing pencils and pens inside, school pencil pouch",
        "pencil sharpener": "a classic small handheld pencil sharpener, simple single-hole plastic sharpener in bright color, traditional school supply NOT electric",
        "can opener": "a manual can opener actively opening a metal food can, hands using the can opener tool on a tin can, kitchen action shot",
        "kitchen sink": "a kitchen sink with faucet installed in a kitchen countertop, dirty dishes and sponge visible, window above sink, clearly in a kitchen",
        "bathroom sink": "a bathroom sink with faucet under a mirror, toothbrush holder and soap dispenser visible, towel hanging nearby, clearly in a bathroom",
        "book": "a closed hardcover book with colorful cover and spine",
        "pen": "a blue ballpoint writing pen",
        "pencil": "a yellow wooden pencil with eraser tip",
        "eraser": "a pink rubber eraser for pencil",
        "folder": "a colored paper folder for documents",
        "binder": "a colorful blue 3-ring binder open showing metal rings inside, office ring binder with papers",

        # Dikiş/Kişisel bakım
        "cotton swab": "multiple Q-tip cotton swabs in a pile, white ear cleaning sticks with cotton on ends, bathroom cotton buds",
        "seatbelt": "a car seatbelt buckled across a car seat, black fabric strap with red release button buckle, vehicle safety belt inside a car",
        "clothespin": "a colorful plastic clothespin clipping a white towel on a clothesline rope, laundry peg in action hanging clothes",
        "bus shelter": "a modern bus shelter with glass walls, bench inside, route map on wall, and people waiting, urban bus stop with advertisements",
        "shampoo bottle": "a colorful PINK shampoo bottle with pump dispenser, hair care product with bubbles design on label",
        "conditioner bottle": "a colorful PURPLE hair conditioner bottle with flip-top cap, smooth silky hair image on bottle",
        "lotion bottle": "a WHITE body lotion bottle with pump, moisturizer cream with aloe vera leaf design, skincare product",
        "bathroom trash can": "a small pedal bin trash can with foot pedal and lid, bathroom garbage bin next to toilet",
        "name tag": "a plastic name badge with clip, Hello My Name Is written on it with blank space, ID badge with lanyard",
        "shower mat": "a rectangular textured rubber bath mat lying flat on bathroom floor next to bathtub, colorful non-slip bathroom floor mat",
        "coin": "a stack of silver and copper metal coins, real currency coins like quarters and pennies, NOT bitcoin NOT cryptocurrency",
        "coffee table": "a wooden coffee table in front of a sofa in living room, with magazines and coffee cup on top, low rectangular table",
        "dining table": "a large dining table with 4 chairs around it, plates and glasses set for dinner, family dining room",
        "console table": "a narrow console table against a wall in entryway hallway, with vase and mirror above it, decorative entry table",
        "side table": "a small round side table next to a sofa arm, with lamp and book on top, living room end table",

        # TV furniture - ayırt edici
        "tv stand": "a simple LOW wooden TV stand with flat screen TV on top, just a basic shelf unit for TV",
        "tv console": "a WHITE modern TV console with drawers and cabinets, entertainment center with storage",
        "media console": "a DARK BROWN wooden media console with open shelves showing DVD player and gaming console, living room",

        # Mobilya - ayırt edici
        "bookcase": "a tall wooden bookcase FILLED with colorful books on every shelf, library bookshelf",
        "medicine cabinet": "an OPEN white medicine cabinet on bathroom wall showing medicine bottles and first aid supplies inside",
        "kitchen cabinet": "wooden kitchen cabinets mounted on wall above kitchen counter with dishes visible through glass doors",
        "wall hook": "a simple metal coat hook mounted on white wall with a jacket hanging from it, single wall mounted hook",
        "key hook": "a small key holder rack on wall with multiple keys hanging from hooks, entryway key organizer",
        "storage bin": "a large BLUE plastic storage bin with lid, household storage container",
        "plastic bin": "a clear transparent plastic bin showing toys inside, see-through storage box",
        "stackable bin": "three simple plastic storage containers stacked neatly, basic rectangular boxes with lids",
        "sofa bed": "a sofa bed OPENED UP showing the mattress pulled out, convertible sleeper sofa in bed position",
        "bed frame": "a metal bed frame WITHOUT mattress showing the slats and frame structure only",
        "headboard": "an upholstered fabric headboard attached to wall behind a bed, just the headboard panel",
        "utility cart": "a metal utility cart with multiple shelves holding tools and cleaning supplies, janitorial cart in hallway",
        "rolling cart": "a 3-tier white kitchen rolling cart with wire baskets holding fruits and vegetables, home kitchen organizer",
        "serving cart": "a gold metal bar cart with 4 wheels, two glass shelves holding wine bottles and cocktail glasses, front view showing all wheels",
        "room divider": "a 3-panel wooden room divider with fabric panels, standing folded in living room separating space, decorative partition",
        "folding screen": "a traditional Japanese style 4-panel folding screen with cherry blossom design, decorative privacy screen",
        "shelf unit": "a tall wooden shelf unit with 5 shelves holding books, plants, and decorative items, freestanding bookshelf in living room",
        "wall shelf": "a wooden wall shelf mounted on wall with L-shaped metal brackets, holding framed photos and small plants, clearly attached to wall with visible bracket supports",
        "floating shelf": "a modern floating shelf with NO visible brackets or supports, white minimalist shelf appearing to float on wall, holding decorative vases and candles",
        "floor lamp": "a tall standing floor lamp next to a sofa in living room, arc floor lamp with shade illuminating the room, full height lamp standing on floor",
        "paper towel roll": "a large kitchen paper towel roll on a vertical metal holder stand, white absorbent paper towels in kitchen",
        "tissue roll": "a white toilet paper roll on a bathroom wall holder, simple toilet tissue roll mounted on wall",
        "sewing kit": "an open travel sewing kit box showing colorful thread spools, needles, scissors, buttons, and thimble inside",
        "needle": "a close-up of a silver metal sewing needle with a small hole at one end and sharp point at other end, simple hand sewing needle",
        "hair tie": "colorful elastic hair ties scrunchies, multiple hair bands in different colors, hair rubber bands",

        # Mutfak
        "container": "a large red metal shipping container, cargo container used for transport, industrial freight container box",
        "glass": "a clear drinking glass, water glass tumbler",
        "mug": "a ceramic coffee mug with handle",
        "cup": "a ceramic tea cup with saucer",
        "bowl": "a ceramic soup bowl, round deep bowl",
        "plate": "a white ceramic dinner plate",
        "pot": "a metal cooking pot with lid and handles",
        "pan": "a black frying pan with long handle, skillet",
        "kettle": "an electric kettle for boiling water",

        # Ev eşyaları
        "iron": "a clothes iron for ironing, steam iron appliance, NOT metal material",
        "fan": "an electric standing fan with blades, room cooling fan",
        "lamp": "a table lamp with lampshade, bedside lamp",
        "mirror": "a rectangular wall mirror with frame",
        "curtain": "elegant window curtains on both sides of a bright window, living room drapes with daylight coming through",
        "drawer": "an open wooden drawer pulled out from a dresser, showing inside storage space with handle",
        "pillow": "a white fluffy bed pillow",
        "blanket": "a soft cozy blanket, bed blanket with pattern",
        "towel": "a folded bath towel, soft cotton towel",
        "rug": "a colorful floor rug, decorative carpet",
        "room": "a cozy living room interior with sofa, coffee table, lamp, window with curtains, and rug on floor",

        # Giyim
        "belt": "brown leather waist strap with silver buckle for pants, fashion accessory worn with trousers, wardrobe item",
        "watch": "a wristwatch on display, analog watch with band",
        "glasses": "eyeglasses, reading glasses with frames",
        "sandal": "bright red and blue summer flip flops sandals, colorful beach footwear with straps",
        "sandals": "bright red and blue summer flip flops sandals pair, colorful beach footwear",

        # Mekanlar/Binalar
        "balcony": "a balcony attached to apartment building with flower pots, railing, and outdoor furniture, view from outside",
        "garage": "a house garage with car inside, open garage door showing vehicle and tools on wall",
        "cafe": "a cozy coffee shop interior with wooden tables, chairs, coffee cups, and warm lighting, inviting atmosphere",
        "bus stop": "a bus stop shelter with bench, glass walls, and route sign, waiting area on sidewalk",
        "park bench": "a classic GREEN painted wooden park bench on grass with trees in background, outdoor garden bench",
        "street bench": "a modern metal and wood bench on concrete sidewalk next to a street lamp and buildings",
        "crosswalk": "a pedestrian zebra crossing on asphalt road with white stripes, cars stopped at traffic light",
        "elevator": "an open elevator with metal doors, inside view showing buttons panel and handrail",
        "staircase": "wooden indoor staircase with handrail in a house, stairs going up",
        "stairs": "concrete outdoor stairs with metal handrail, steps going up",
        "airport": "an airport terminal building exterior with control tower, planes parked at gates",
        "train station": "a train station platform with train arriving, roof shelter and passengers waiting",

        # Aletler
        "screwdriver": "a yellow and black Phillips head screwdriver tool, cross-head screwdriver",

        # Araçlar
        "car": "a sedan car automobile, passenger vehicle",
        "bus": "a public transit bus, city bus",
        "truck": "a pickup truck vehicle",
        "bicycle": "a bicycle bike with two wheels",

        # Mekanlar
        "sidewalk": "a gray concrete sidewalk path with trees and buildings on the side, pedestrian walkway in a city",
        "store": "a cute small retail shop building exterior with red awning, glass door, display window showing colorful products inside, brick facade",

        # Mutfak eşyaları
        "spoon": "ONE single silver metal tablespoon lying flat, just one spoon not two, eating utensil",

        # Elektronik aksesuarlar
        "earphones": "white wired earphones earbuds with cable and 3.5mm jack plug, in-ear headphones",

        # Aletler
        "flashlight": "a black handheld flashlight torch, cylindrical LED flashlight with on/off button",

        # Diğer belirsiz kelimeler
        "map": "a large unfolded paper map showing city streets and landmarks",
        "ticket": "a paper ticket or boarding pass",
        "passport": "a passport booklet document with cover",
        "suitcase": "a travel suitcase luggage bag with wheels",
        "camera": "a digital photo camera, DSLR camera",
        "phone": "a smartphone mobile phone, iPhone style",
        "key": "a metal door key, house key",
        "keys": "a set of metal keys on keyring",
        "coin": "gold and silver coins, money coins",
        "stamp": "a colorful postage stamp",
        "button": "clothing buttons, shirt buttons, sewing buttons",
        "switch": "a light switch on wall, electrical switch",
        "plug": "an electrical plug, power plug",
        "battery": "AA batteries, cylindrical batteries",
        "bulb": "a light bulb, LED bulb glowing",
        "light bulb": "a light bulb, LED bulb glowing",
    }

    if word.lower() in special_words:
        return special_words[word.lower()]

    templates = {
        "everyday_objects": f"{word}",  # Basit - kategori promptu detayları halleder
        "food_drink": f"{word}",
        "travel": f"a {word} travel item or object",
        "nature_animals": f"a {word}",
        "sports_hobbies": f"{word} sport or hobby",
        "people_roles": f"a {word} person",
        "actions": f"a person doing {word} action",
        "adjectives": f"something that looks {word}",
        "emotions": f"a large cartoon human face showing {word} emotion, expressive eyes and mouth",
        # Eski kategoriler (geriye uyumluluk)
        "food": f"a {word} food dish on a plate",
        "business": f"a {word} office supply or item",
        "technology": f"a {word} electronic device",
        "health": f"a {word} medical item",
        "sports": f"a {word} sports equipment",
        "music": f"a {word} musical instrument",
        "entertainment": f"a {word} entertainment item",
        "nature": f"a {word} from nature",
        "shopping": f"a {word} product item",
        "family": f"a cartoon {word} person portrait",
        "education": f"a {word} school supply",
        "verbs": f"a person doing {word} action",
    }
    return templates.get(category, f"a {word}")

def has_manual_prompt(word: str) -> bool:
    """Kelimenin manuel promptu var mı kontrol et"""
    # 1. DISTINCTIVE_DESCRIPTIONS kontrol (en yüksek öncelik)
    if word.lower() in DISTINCTIVE_DESCRIPTIONS:
        return True
    word_lower = word.lower()
    # get_fallback_description içindeki sözlükleri kontrol et
    # Bu fonksiyon person_words ve special_words'de kelime varsa True döner
    test_desc = get_fallback_description(word, "test")
    # Eğer generic template döndüyse (kelimeyi içeriyorsa) manuel prompt yok demektir
    if f"a {word_lower}" in test_desc.lower() and ("item" in test_desc or "object" in test_desc):
        return False
    return True

def get_word_description(word: str, category: str) -> str:
    """Kelime açıklaması al - önce DISTINCTIVE_DESCRIPTIONS, sonra manuel, sonra Gemini"""

    # 1. ÖNCE: DISTINCTIVE_DESCRIPTIONS kontrol (en yüksek öncelik)
    if word.lower() in DISTINCTIVE_DESCRIPTIONS:
        return DISTINCTIVE_DESCRIPTIONS[word.lower()]

    # 2. Sonra manuel prompt var mı kontrol et (person_words, special_words)
    if has_manual_prompt(word):
        return get_fallback_description(word, category)

    prompt = f"""You create educational illustrations for a vocabulary app. Users must understand the word INSTANTLY from the image.

Word: "{word}"
Category: "{category}"

VISUALIZATION TYPES - Choose the right one:

1. PLACE/LOCATION (city, beach, airport, office, park):
   - MUST show buildings, landscape, or environment
   - "city" = skyline with tall buildings, NOT a car
   - "beach" = sand, ocean, palm trees
   - "park" = trees, grass, benches, paths

2. OBJECT (phone, pizza, car, book):
   - Show ONLY the object, large and centered
   - NO people needed

3. PERSON TYPE (doctor, tourist, chef, teacher):
   - Show that person with their defining outfit/uniform/tools

4. INTERACTION/SHARING (share, help, give, teach, talk):
   - MUST show 2+ people interacting together
   - "share" = two people sharing something between them
   - "help" = one person helping another
   - "give" = one person giving something to another

5. EVENT/RELATIONSHIP (wedding, meeting, party, date):
   - Show the SCENE with multiple people
   - "wedding" = bride and groom together

6. ACTION (run, eat, sleep, jump):
   - Show a person doing that action clearly

7. EMOTION (happy, sad, angry):
   - Show a large expressive face with that emotion

Rules:
- Make meaning OBVIOUS - a child should understand instantly
- Be SPECIFIC about visual elements
- Places MUST show environment/buildings
- Interactions MUST show multiple people

Reply with ONLY visual description (max 25 words).

Examples:
- "city": Skyline view with tall buildings, skyscrapers, and urban landscape
- "share": Two children sharing a cookie, one handing half to the other
- "help": One person reaching out hand to help another person stand up
- "beach": Sandy beach with blue ocean waves, palm trees, and sunny sky
- "wedding": Bride in white dress and groom in suit at altar with flowers
- "doctor": Friendly doctor in white coat with stethoscope around neck

Describe "{word}" ({category}):"""

    headers = {"Content-Type": "application/json"}

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 200}
    }

    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"

    for attempt in range(GEMINI_MAX_RETRIES):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)

            if response.status_code == 200:
                data = response.json()
                if data.get("candidates"):
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return text.strip()
            elif response.status_code == 429:
                # Rate limit - wait and retry
                if attempt < GEMINI_MAX_RETRIES - 1:
                    time.sleep(GEMINI_RETRY_DELAY * (attempt + 1))
                    continue
                else:
                    print(f"  Gemini rate limit", end="")
            else:
                print(f"  Gemini {response.status_code}", end="")
                break

        except Exception as e:
            print(f"  Gemini err", end="")
            break

    # Fallback: use category-specific default descriptions
    return get_fallback_description(word, category)

def get_fal_headers():
    return {
        "Authorization": f"Key {FAL_API_KEY}",
        "Content-Type": "application/json"
    }

def submit_image_request(word: str, description: str, category: str = "default") -> tuple:
    """fal.ai'ye görsel isteği gönder"""

    # Kategori bazlı prompt kullan
    prompt = get_image_prompt(word, category, description)

    payload = {
        "prompt": prompt,
        "image_size": "square",
        "num_images": 1
    }

    try:
        response = requests.post(FAL_API_URL, headers=get_fal_headers(), json=payload)

        if response.status_code == 200:
            data = response.json()
            return data.get("request_id"), data.get("response_url")
        else:
            print(f"  fal.ai Hatasi: {response.status_code}", end="")

    except Exception as e:
        print(f"  fal.ai Hata: {e}", end="")

    return None, None

def wait_for_image(response_url: str, max_wait: int = 120) -> str:
    """Görsel tamamlanana kadar bekle"""

    for _ in range(max_wait):
        try:
            response = requests.get(response_url, headers=get_fal_headers())

            if response.status_code == 200:
                data = response.json()

                images = data.get("images")
                if images and len(images) > 0:
                    return images[0].get("url")

                status = data.get("status")
                if status in ["IN_QUEUE", "IN_PROGRESS"]:
                    time.sleep(1)
                    continue
                elif status == "FAILED":
                    return None
            else:
                time.sleep(1)

        except Exception as e:
            time.sleep(1)

    return None

def download_image(url: str) -> bytes:
    """Görseli URL'den indir"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.content
    except Exception as e:
        print(f"  Indirme hatasi: {e}", end="")
        return None

def save_to_local(image_data: bytes, filename: str) -> str:
    """Görseli yerel klasöre kaydet"""

    # Klasör yoksa oluştur
    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

    filepath = OUTPUT_FOLDER / filename

    try:
        with open(filepath, 'wb') as f:
            f.write(image_data)
        return str(filepath)
    except Exception as e:
        print(f"  Kaydetme hatasi: {e}", end="")
        return None

def generate_single_image(word: str, category: str, word_id: str) -> str:
    """Tek bir kelime için görsel üret ve Bunny'ye yükle"""

    # 1. Gemini'den açıklama al
    description = get_word_description(word, category)

    # 2. fal.ai'ye gönder (kategori bazlı prompt ile)
    request_id, response_url = submit_image_request(word, description, category)

    if not response_url:
        return None

    # 3. Sonucu bekle
    image_url = wait_for_image(response_url)

    if not image_url:
        return None

    # 4. Görseli indir
    image_data = download_image(image_url)

    if not image_data:
        return None

    # 5. Yerel klasöre kaydet
    # Uygulama ile aynı isimlendirme: "Meeting Room" -> "meeting-room.jpg"
    safe_word = word.lower().strip()
    safe_word = re.sub(r'[^a-z0-9\s-]', '', safe_word)  # Özel karakterleri sil
    safe_word = re.sub(r'\s+', '-', safe_word)           # Boşlukları tire yap
    filename = f"{safe_word}.jpg"

    local_path = save_to_local(image_data, filename)

    return local_path

def generate_all_images(words: list):
    """Tüm kelimeler için görsel üret"""

    generated = load_generated()

    # Daha önce üretilmemiş kelimeleri bul
    to_generate = [w for w in words if w['id'] not in generated]
    total = len(to_generate)

    if total == 0:
        print("Tum gorseller zaten uretilmis!")
        return

    print(f"\n{total} gorsel uretilecek...")
    print(f"Tahmini maliyet: ${total * 0.003:.2f}")
    print(f"Tahmini sure: {(total * 5) / 60:.0f} dakika\n")

    success_count = 0
    fail_count = 0
    start_time = time.time()

    for i, word in enumerate(to_generate, 1):
        word_en = word['word_en']
        word_id = word['id']
        category = word.get('category', 'general')

        print(f"[{i}/{total}] {word_en}...", end=" ", flush=True)

        local_path = generate_single_image(word_en, category, word_id)

        if local_path:
            print(f"OK")
            generated[word_id] = {
                "word": word_en,
                "category": category,
                "path": local_path
            }
            save_generated(generated)
            success_count += 1
        else:
            print("BASARISIZ")
            fail_count += 1

        # İlerleme bilgisi
        if i % 50 == 0:
            elapsed = time.time() - start_time
            rate = i / elapsed * 60
            remaining = (total - i) / rate if rate > 0 else 0
            print(f"    [{i}/{total}] Hiz: {rate:.1f} resim/dk, Kalan: {remaining:.0f} dk")

        if i < total:
            time.sleep(DELAY_BETWEEN_REQUESTS)

    elapsed = time.time() - start_time
    print(f"\n{'='*50}")
    print(f"TAMAMLANDI!")
    print(f"Sure: {elapsed/60:.1f} dakika")
    print(f"Basarili: {success_count}")
    print(f"Basarisiz: {fail_count}")
    print(f"\nGorseller kaydedildi: {OUTPUT_FOLDER}")
    print(f"Bu klasordeki dosyalari Bunny.net'e surukle-birak yapabilirsin.")

def test_single_word():
    """Test modu"""

    print("Test modu: Ornek kelimeler uretiliyor...")

    test_cases = [
        ("tourist", "travel"),
        ("guide", "travel"),
        ("doctor", "health"),
        ("chef", "food"),
    ]

    for word, category in test_cases:
        print(f"\n--- {word} ({category}) ---")

        # Açıklama al
        print("1. Aciklama alinıyor...", end=" ", flush=True)
        description = get_word_description(word, category)
        print(f"OK")
        print(f"   > {description}")

        # Görsel üret
        print("2. Gorsel uretiliyor...", end=" ", flush=True)
        request_id, response_url = submit_image_request(word, description)

        if not response_url:
            print("BASARISIZ")
            continue

        image_url = wait_for_image(response_url)
        if not image_url:
            print("BASARISIZ")
            continue
        print("OK")

        # İndir
        print("3. Indiriliyor...", end=" ", flush=True)
        image_data = download_image(image_url)
        if not image_data:
            print("BASARISIZ")
            continue
        print(f"OK ({len(image_data)//1024}KB)")

        # Bunny'ye yükle
        print("4. Bunny.net'e yukleniyor...", end=" ", flush=True)
        safe_word = word.lower().strip()
        safe_word = re.sub(r'[^a-z0-9\s-]', '', safe_word)
        safe_word = re.sub(r'\s+', '-', safe_word)
        filename = f"{safe_word}.jpg"
        cdn_url = upload_to_bunny(image_data, filename)

        if cdn_url:
            print("OK")
            print(f"   > {cdn_url}")
        else:
            print("BASARISIZ")

# ============== ANA PROGRAM ==============

if __name__ == "__main__":
    import sys

    print("=" * 50)
    print("SYNORA - Kelime Gorselleri Uretici")
    print("Gemini + fal.ai + Bunny.net")
    print("=" * 50)

    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        test_single_word()
    else:
        words = load_words()
        if words:
            # --limit N parametresi ile ilk N kelimeyi işle
            limit = None
            for i, arg in enumerate(sys.argv):
                if arg == "--limit" and i + 1 < len(sys.argv):
                    try:
                        limit = int(sys.argv[i + 1])
                        print(f"Limit: ilk {limit} kelime")
                    except:
                        pass

            if limit:
                words = words[:limit]

            generate_all_images(words)
