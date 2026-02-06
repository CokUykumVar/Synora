# ============== AYIRT EDICI AÇIKLAMALAR (512 EKSİK KELİME) ==============
# Her kelime için ayırt edici açıklama - benzer kelimeleri görsel olarak farklılaştırır
# Benzerlik gruplarina göre organize edilmiş (door, panel, cabinet, valve, vb.)

DISTINCTIVE_DESCRIPTIONS = {
    # ===== PLACES & LOCATIONS (487-497) =====
    "changing room": "a small retail fitting room with drawn fabric curtain, full-length mirror on back wall, clothing hooks on side panels",
    "checkout counter": "a supermarket checkout counter with BLACK conveyor belt, card payment terminal, and bagging area at end",
    "customer service desk": "a store customer service desk with large INFO sign overhead, computer monitor, and queue ropes in front",
    "post office": "a post office counter with rows of brass mail slots behind clerk, packages and scale on counter surface",
    "police station": "a BLUE-trimmed police station building with glowing blue lamp above entrance, marked police cars parked outside",
    "fire station": "a RED brick fire station with large open bay doors, bright red fire trucks visible inside, hoses hung on wall",
    "gas station": "a gas station with fuel pumps under flat metal canopy, price sign tower, concrete island with nozzle holders",
    "cafeteria": "a cafeteria serving counter with stainless steel food trays under sneeze guard, stacked plastic trays at start of line",
    "gym": "an indoor gym with rows of treadmills, chrome dumbbells on rack, large wall mirrors reflecting rubber floor mats",
    "laundromat": "a bright laundromat with rows of front-loading washing machines and stacked dryers, folding table in center aisle",
    "parking booth": "a small glass parking booth at garage entrance with striped barrier arm, ticket machine, and attendant window",

    # ===== BAGS & CASES (498-503, 526-528, 588) =====
    "carry on suitcase": "a SMALL wheeled carry-on suitcase, cabin size with short telescoping handle, compact NOT large, standing upright",
    "rolling suitcase": "a LARGE wheeled rolling suitcase with tall telescoping handle, full-size checked luggage standing on four spinner wheels",
    "messenger bag": "a canvas messenger bag with front FLAP closure, long crossbody strap, buckle fasteners, worn over shoulder",
    "laptop bag": "a BLACK padded rectangular laptop bag, slim profile with front zipper pocket, short carry handles and shoulder strap",
    "duffel bag": "a CYLINDRICAL soft NAVY duffel bag with two short handles and detachable shoulder strap, zippered top opening",
    "tote bag": "an OPEN-top canvas tote bag with two parallel vertical handles, NO zipper, wide rectangular shape, flat bottom",
    "makeup bag": "a SMALL PINK zippered pouch with rounded corners, soft fabric cosmetic bag holding brushes and compacts inside",
    "cosmetic case": "a rigid GOLD hard-shell cosmetic case with hinged lid, built-in mirror inside, structured rectangular box shape",
    "travel pouch": "a FLAT rectangular travel pouch with mesh zippered compartments, clear organizer for toiletries, thin and packable",
    "camera bag": "a padded BLACK camera bag with ORANGE interior dividers, top-loading lid, adjustable compartments for lenses and body",

    # ===== HATS (504-506) =====
    "baseball cap": "a cotton baseball cap with curved front brim, stitched panels, adjustable snapback closure at back, NOT knitted",
    "beanie hat": "a knitted wool beanie hat covering ears, ribbed fold-up cuff, snug fit, NO brim at all, dome shape",
    "rain hat": "a waterproof bucket-style rain hat with wide brim all around, chin strap, slick coated fabric surface",

    # ===== LOCK GROUP (507-510) =====
    "door lock": "a brass deadbolt lock set in wooden door edge, round keyhole plate visible, metal latch extending into frame",
    "window lock": "a small silver CRESCENT-shaped latch mounted on window frame sash, pivoting half-moon toggle mechanism, NOT a deadbolt",
    "cabinet lock": "a small chrome CAM lock with round face and keyhole, mounted on cabinet door panel, tiny key inserted",
    "keypad lock": "a DIGITAL keypad lock with numbered push buttons and LED indicator light, electronic access panel on door surface",

    # ===== TAGS & LABELS (511-512) =====
    "price tag": "a white cardboard price tag with string loop attached, handwritten dollar amount in marker, rectangular with rounded corners",
    "barcode label": "a white adhesive sticker with BLACK parallel barcode lines and printed numbers underneath, stuck on product surface",

    # ===== SCHEDULE BOARDS (513-514) =====
    "bus schedule board": "a BLUE LED digital display board at bus stop pole showing route numbers, times, and destination names in bright text",
    "train schedule board": "a YELLOW mechanical departure board at train station showing flip-letter destinations, platform numbers, and scheduled times",

    # ===== PARKING TICKET (515) =====
    "parking ticket": "a small paper parking ticket tucked under windshield wiper blade on car glass, printed with time and date",

    # ===== MIRROR GROUP (517-521) =====
    "floor mirror": "a TALL full-length RECTANGULAR floor mirror with thin frame, leaning against bedroom wall at slight angle",
    "wall mirror": "a ROUND wall mirror with ornate carved gilt frame, hung on wall with decorative mounting, NOT standing free",
    "vanity mirror": "a rectangular vanity mirror on desk surrounded by bright Hollywood-style light bulbs around all edges, makeup station",
    "standing mirror": "an OVAL mirror on wooden tilting STAND frame with two support legs, freestanding on floor, adjustable angle pivot",
    "makeup mirror": "a SMALL round magnifying mirror with LED ring light, mounted on articulating chrome arm, tabletop swivel base",

    # ===== FAN GROUP (516, 529-530) =====
    "ceiling fan": "a ceiling fan with five wooden blades mounted flush to white ceiling, brass motor housing, dangling pull chain",
    "desk fan": "a SMALL portable oscillating desk fan on flat base sitting on desk surface, round cage guard, NOT ceiling mounted",
    "clip on fan": "a TINY compact fan with spring-loaded CLIP base, attaches to shelf edge or desk rim, adjustable tilt head",

    # ===== PERSONAL & BATHROOM (522-525) =====
    "shoehorn": "a long curved stainless steel shoehorn tool for sliding heel into shoe, narrow tapered blade with loop handle",
    "lint brush": "a sticky roller lint brush on plastic handle, adhesive surface removes pet hair and lint from dark clothing",
    "bathrobe": "a white fluffy terry cloth bathrobe hanging on door hook, thick absorbent fabric, belt tie at waist",
    "shower cap": "a clear plastic shower cap with elastic gathered rim, waterproof dome shape placed over hair, translucent material",

    # ===== APPLIANCES (531-534) =====
    "air purifier": "a white boxy air purifier standing on floor with front grille intake, HEPA filter indicator light, quiet tower shape",
    "water dispenser": "a tall upright water dispenser with large inverted bottle on top, hot and cold tap spigots, drip tray below",
    "water cooler": "an office water cooler with paper cone cup dispenser mounted on side, blue and red tap handles, water jug",
    "trash compactor": "an under-counter trash compactor built into kitchen cabinetry, front panel door, compresses waste with ram mechanism inside",

    # ===== BATHROOM ACCESSORIES (535-545) =====
    "soap refill bottle": "a LARGE CLEAR plastic bulk soap refill bottle with pour spout cap, visible liquid inside, economy size container",
    "hand soap dispenser": "a WHITE ceramic pump dispenser sitting on sink countertop, curved push-down nozzle top, filled with liquid soap",
    "toilet paper holder": "a chrome wall-mounted toilet paper holder arm with roll loaded on spring-loaded spindle, recessed bracket on bathroom wall",
    "towel ring": "a ROUND chrome O-shaped towel ring mounted on bathroom wall, circular open loop holds folded hand towel",
    "towel hook": "a single J-shaped chrome HOOK mounted on wall, towel hangs from one point, simple curved prong design",
    "towel bar": "a LONG horizontal chrome BAR mounted on bathroom wall with two end brackets, holds bath towel spread flat",
    "shower shelf": "a wire rack shelf INSIDE shower stall attached with suction cups, holds shampoo bottles and soap on tiered shelves",
    "bathroom shelf": "a white shelf mounted ABOVE bathroom sink near mirror, holding toiletries, toothbrush holder, and small bottles in row",
    "kitchen shelf": "a wooden open shelf mounted ABOVE kitchen counter displaying glass jars of spices, ceramic bowls, and cookbooks",

    # ===== CADDY GROUP (544-545, 576) =====
    "wall caddy": "a wall-mounted fabric organizer with multiple POCKETS for sorting mail, keys, and papers, hanging on entryway wall",
    "sink caddy": "a stainless steel caddy sitting ON kitchen sink edge, holds sponge and dish brush, drains into sink basin",
    "shower caddy": "a hanging tiered shower caddy suspended from shower pipe, multiple basket shelves holding shampoo and soap bottles vertically",

    # ===== ENTRYWAY (546-556) =====
    "key holder": "a wall-mounted key holder rack with multiple small hooks in a row, several sets of keys hanging visibly",
    "mail slot": "a brass horizontal mail slot cut INTO front door surface, hinged flap cover, letters slide through into house",
    "door chain lock": "a GOLD security chain with slide bolt bracket across partially opened door, chain links taut between door and frame",
    "door knocker": "a heavy BRONZE lion-head door knocker with ring in mouth mounted on dark wooden front door, ornate casting",
    "peephole cover": "a small brass FLIP cover plate over door peephole lens, hinged disc swings aside to reveal viewing hole",
    "coat stand": "a tall wooden coat stand with branching curved hooks at top, heavy round base on floor, holds jackets",
    "umbrella stand": "a cylindrical ceramic umbrella stand by front door, glazed finish, holding several wet umbrellas upright inside",
    "shoe bench": "a wooden entryway bench with open shoe storage rack underneath, slatted shelves holding pairs of shoes below seat",
    "entryway table": "a narrow DARK wood console table by front door, small bowl for keys on top, decorative legs, slim profile",
    "hall table": "a LIGHT wooden narrow table against hallway wall with ceramic vase of flowers on top, simple clean design",
    "coffee cart": "a wheeled mobile coffee cart with espresso machine on top shelf, hanging cups, lower shelf with supplies and beans",

    # ===== DOOR PARTS GROUP (557-565, 663, 671, 696, 698, 703, 769, 770, 799, 812, 837, 839, 863) =====
    "door hinge": "a brass door hinge with three screws on each plate, mounted at door-frame junction, visible knuckle pin barrel",
    "door knob": "a round spherical CHROME doorknob with ball shape on backplate, turned by gripping and rotating, NOT a lever",
    "door handle": "a curved LEVER bar handle in brushed nickel, horizontal ergonomic grip pushed down to open, NOT round knob",
    "deadbolt": "a heavy brass deadbolt with thick rectangular bolt extending into door frame, turned by thumb turn or key",
    "door chain": "a gold security chain with linked metal loops connecting door edge to frame-mounted slide track, restricts opening width",
    "peephole": "a small round fish-eye lens installed in center of door at eye height, wide-angle viewer for seeing outside",
    "doorstop": "a rubber WEDGE doorstop on floor behind open door, triangle-shaped brown block preventing door from swinging closed",
    "door closer": "a hydraulic arm mechanism mounted at TOP of door frame, silver pneumatic cylinder controlling closing speed automatically",
    "door threshold": "a metal strip at BOTTOM of doorway at floor level, aluminum transition plate bridging gap between two floor surfaces",
    "loading bay door": "a very LARGE gray metal roll-up door at loading dock bay, full-width industrial warehouse entrance opening",
    "door frame": "a wooden door frame with decorative molding and trim casing surrounding doorway opening, architectural frame structure",
    "service door": "a plain GRAY painted metal door with small reinforced glass window, staff-only building service area access door",
    "service corridor door": "a DOUBLE swing door with round porthole windows in each leaf, restaurant kitchen or hospital corridor passage",
    "door seal": "a black rubber weather seal strip pressed along door edge gap, flexible gasket material preventing cold drafts",
    "overhead door": "a large SECTIONAL overhead garage door with horizontal insulated panels riding on ceiling-mounted tracks, counterbalanced opening",
    "industrial door handle": "a heavy-duty stainless steel horizontal PUSH BAR across full width of commercial door, panic exit bar hardware",
    "fire door": "a RED-painted heavy metal fire-rated door with fire rating label and automatic hydraulic closer arm mechanism, safety",
    "video doorbell": "a small OVAL smart doorbell camera device mounted beside front door frame, with wide-angle lens and glowing button",
    "rolling shutter door": "a corrugated galvanized metal roll-up SHUTTER door fully closed with coiled drum housing at top, security closure",
    "platform screen door": "a GLASS automatic sliding door pair at train platform edge with rubber seals, subway station safety barrier system",
    "door strike plate": "a small metal STRIKE plate mortised into door frame jamb, rectangular pocket receiving latch bolt when door closes",
    "door lock cylinder": "a brass pin tumbler lock cylinder extracted from door, cylindrical shape with keyway slot, locksmith replacement part",

    # ===== WINDOW PARTS (566-572, 672, 704) =====
    "weather stripping": "a foam adhesive weather stripping pressed along door edge, compressible rubber seal blocking drafts, visible along door frame",
    "window blinds": "white horizontal SLAT blinds with tilt wand cord, venetian style overlapping aluminum strips, covering window interior",
    "window shade": "a single SOLID roller shade pulled halfway down window, smooth continuous fabric surface NOT slats, bottom pull bar",
    "window screen": "a fine MESH insect screen in aluminum frame fitted inside window opening, thin wire grid allowing airflow through",
    "curtain rod": "a long metal curtain rod mounted above window with decorative finial caps on each end, wall bracket supports",
    "curtain hook": "a small S-shaped metal hook for hanging curtain fabric on rod rings, curved wire pin with sharp end",
    "window latch": "a small pivoting lever latch on window sash, rotating toggle mechanism locks upper and lower window panes together",
    "window frame": "a white PVC window frame showing horizontal sill, vertical jambs, and top header, exterior window framing profile",
    "window seal": "a clear silicone sealant bead applied around window glass edge, transparent weatherproofing caulk line visible",

    # ===== PLUMBING (573-578, 677-681, 706-710) =====
    "sink strainer": "a round stainless steel mesh basket strainer sitting in kitchen sink drain hole, catches food scraps, perforated dome",
    "drain plug": "a rubber stopper with bead chain attached, blocks sink drain hole when pressed in, chrome chain to hook",
    "shower head": "a chrome rainfall shower head spraying water downward, round face with many small nozzle holes, mounted on pipe",
    "toilet flush button": "a dual flush chrome button on top of toilet tank, two half-circle push pads for full and half flush",
    "toilet seat": "a white oval toilet seat with hinged lid raised, smooth plastic ring on porcelain bowl, bathroom fixture",
    "bathroom faucet": "a chrome single-handle bathroom faucet on white porcelain sink, short elegantly curved spout, lever handle on top",
    "kitchen faucet": "a TALL stainless steel pull-down kitchen faucet with flexible hose sprayer head, high-arc gooseneck over sink",
    "sprayer nozzle": "a detachable chrome kitchen SIDE sprayer nozzle with trigger handle, separate spray attachment mounted beside main faucet",
    "water valve": "a brass gate valve with RED round wheel handle on copper pipe run, plumbing supply shutoff valve",
    "drain trap": "a curved chrome P-trap pipe assembly under sink, U-shaped section holding water to block sewer gas backup",
    "bathroom drain": "a round chrome drain grate with small holes on BATHROOM tile floor, floor-level water drainage near shower",
    "kitchen drain": "a stainless steel kitchen SINK drain opening with rubber splash guard collar, food disposal drain in countertop",
    "floor drain": "a SQUARE cast metal floor drain grate set in concrete or basement floor, large industrial drainage opening",
    "shower valve": "a chrome dual-handle shower mixer valve RECESSED in tiled wall, round temperature and flow control knobs",
    "sink valve": "a small chrome angle stop valve with OVAL handle located UNDER sink, individual water supply line shutoff",

    # ===== HVAC & CLIMATE (579-584, 713-717) =====
    "thermostat": "a white digital wall thermostat with LCD screen showing temperature reading, mounted on wall, up and down buttons",
    "radiator": "a white cast iron radiator with vertical ribbed fins positioned under window, wall-mounted hot water heating element",
    "water heater": "a tall cylindrical white water heater tank standing in utility closet, pipes connected at top, temperature dial visible",
    "air vent": "a rectangular white ceiling grille for HVAC air supply, parallel louver slats directing airflow, flush-mounted overhead opening",
    "ventilation grill": "a large SQUARE aluminum ventilation grille mounted on wall with angled louver slats, industrial HVAC exhaust return cover",
    "range hood": "a stainless steel pyramid-shaped range hood mounted above kitchen stove, built-in lights underneath, vent filters visible",
    "air return vent": "a large rectangular air return vent near FLOOR level on wall, passive HVAC intake grille pulling air in",
    "ceiling vent": "a round or square air diffuser vent flush-mounted on CEILING surface, blowing conditioned air downward into room",
    "exhaust fan": "a SQUARE exhaust fan mounted in bathroom wall with louvered grille, motor extracting humid air to outside",
    "vent cover": "a decorative metal louvered vent cover plate over rectangular wall opening, replaceable snap-on HVAC grille cover",
    "filter grill": "a hinged metal filter access grille that swings open to reveal replaceable air filter element inside, maintenance access",

    # ===== PROJECTOR & TECH (585-587) =====
    "projector": "a ceiling-mounted LCD projector beaming bright light forward, lens and air vents visible, suspended from bracket mount",
    "projector screen": "a large white pull-down projector screen on wall, matte surface unrolled from top-mounted housing, black border edges",
    "tripod": "a black aluminum three-leg tripod standing with adjustable pan head mount on top, rubber feet, telescoping leg sections",

    # ===== OFFICE & RETAIL TECH (589-606) =====
    "ink cartridge": "a printer ink cartridge with colored ink chambers visible through translucent casing, snap-in electronic contacts on bottom edge",
    "barcode scanner": "a handheld RED laser barcode scanner gun at retail point-of-sale counter, trigger grip, scanning beam from nose",
    "receipt printer": "a small white thermal receipt printer with paper strip coming out, point-of-sale counter machine",
    "card reader": "a small card payment terminal with keypad and card insertion slot, POS credit card reader device",
    "cash register": "a traditional cash register with money drawer open showing bills and coins, retail checkout machine",
    "price scanner": "a wall-mounted RED laser price check scanner in store aisle, customer self-scan device on pillar",
    "laminator": "a desktop laminator machine with plastic film sheet feeding through heated rollers, document sealing device",
    "shredder": "a paper shredder bin with paper strips visible inside, office document destruction cross-cut machine",
    "document tray": "a stacking desktop document tray holding papers horizontally, tiered office inbox outbox letter organizer",
    "paper tray": "a PRINTER paper tray cassette pulled out showing stack of white A4 paper inside, feed tray",
    "monitor arm": "a desk-clamp mounted articulating monitor arm holding display, spring-loaded adjustable single-screen ergonomic arm",
    "monitor stand": "a simple FIXED wooden monitor riser block on desk elevating screen to eye level, no moving arm",
    "keyboard tray": "a slide-out keyboard tray mounted UNDER desk surface with keyboard and mouse pad, pull-out shelf",
    "cable organizer": "a desk cable management box hiding tangled power cables inside, white rectangular cord organizer with slots",
    "cable clip": "small adhesive cable clips stuck on desk edge holding individual thin cords in place, tiny plastic fasteners",
    "network switch": "a small desktop network switch with eight ethernet ports and green blinking LED lights, compact unmanaged switch",
    "access point": "a white disc-shaped ceiling-mounted WiFi access point with LED status ring, wireless network device",
    "patch cable": "a short bright BLUE ethernet patch cable with clear RJ45 connectors on each end, network jumper",

    # ===== CLEANING TOOLS (607-609) =====
    "steam mop": "an upright steam mop with triangular swivel head on floor producing white steam, electric floor cleaner",
    "robot vacuum": "a round flat robot vacuum cleaner navigating floor autonomously, disc-shaped with bumper sensors and brushes",
    "drain snake": "a coiled flexible metal drain snake auger tool for unclogging pipes, spiral wire cable with crank handle",

    # ===== PAINT & HAND TOOLS (610-626) =====
    "paint roller": "a paint roller with fluffy nap cover on metal frame handle, wet with white paint for wall coating",
    "paint tray": "a BLACK plastic paint tray with ribbed sloped surface for rolling excess paint off roller, floor tray",
    "caulking gun": "a metal frame caulking gun with silicone tube inserted, squeeze trigger and rod pushing sealant out",
    "heat gun": "a handheld electric ORANGE heat gun shaped like large hair dryer, industrial hot air blower tool",
    "power drill": "a cordless BLUE power drill with battery pack attached, trigger grip and adjustable keyless chuck",
    "drill bit": "a set of silver steel spiral drill bits in multiple sizes arranged in a labeled plastic holder case",
    "circular saw": "a handheld circular saw with round spinning blade and guard visible, corded wood cutting power tool",
    "jigsaw": "a handheld electric jigsaw with thin reciprocating blade pointing down, for curved and intricate cuts in wood",
    "measuring tape": "a YELLOW retractable measuring tape with metal hook tip extended showing inch markings, coiled in housing",
    "spirit level": "a YELLOW aluminum spirit level bar with green bubble vial centered in window, carpenter leveling tool",
    "allen key": "a small L-shaped HEXAGONAL allen wrench in black steel, for socket-head cap bolt fastening, hex key",
    "socket wrench": "a chrome ratcheting socket wrench with detachable hex socket head, mechanics hand tool for tightening bolts",
    "pipe wrench": "a heavy ORANGE adjustable pipe wrench with serrated jaw teeth, large plumbing gripping tool for pipes",
    "bolt cutter": "long-handled red bolt cutters with short hardened steel jaws, for cutting padlocks chains and rebar",
    "wire stripper": "a wire stripper plier tool with multiple gauge notches in jaw, strips insulation from copper electrical wire",
    "multimeter": "a digital multimeter with LCD display reading voltage, attached red and black test probe leads, handheld meter",
    "stud finder": "a handheld electronic stud finder pressed against wall surface, LED lights indicating detected wood stud location",

    # ===== TRAFFIC & CAMERAS (627-640) =====
    "traffic camera": "a pole-mounted traffic camera ABOVE road intersection monitoring vehicle flow, NOT speed enforcement, surveillance dome",
    "speed camera": "a YELLOW box speed camera with flash unit mounted on roadside pole, automatic speed enforcement device",
    "license plate camera": "a small ANPR camera mounted LOW at parking garage entry, reads license plates automatically for access control",
    "toll booth": "a highway toll booth with narrow lane barrier arm and overhead illuminated canopy, vehicle payment station",
    "parking barrier": "a RED and white striped parking lot barrier arm at entrance, automatic vehicle gate boom with motor",
    "parking pay station": "a solar-powered parking pay station pillar standing on sidewalk, coin and card payment kiosk column with screen",
    "parking ticket machine": "a WALL-mounted parking ticket dispenser at garage entrance, prints paper ticket with timestamp on button press",
    "pedestrian signal": "a pedestrian crossing signal head showing illuminated WHITE walk figure icon, traffic signal for walkers on pole",
    "crosswalk button": "a YELLOW pedestrian push button mounted on pole at intersection corner, press to request crossing signal",
    "traffic control box": "a GREEN metal roadside traffic control cabinet with ventilation louvers, houses signal electronics on sidewalk corner",
    "signal controller": "a larger GRAY metal signal controller cabinet at intersection, traffic light central brain with status indicators",
    "street name sign": "a GREEN rectangular street name sign blade on metal pole at intersection corner, white reflective text lettering",
    "no parking sign": "a RED circle and blue background NO PARKING sign with letter P crossed out, posted on pole by curb",
    "yield sign": "a red and white inverted triangle YIELD sign with point facing down, traffic priority warning road sign",

    # ===== AIRPORT (641-648) =====
    "security checkpoint": "an airport security checkpoint area with X-ray conveyor, walk-through gate, and officers screening passengers with bins",
    "metal detector": "a walk-through metal detector security archway gate with vertical side panels, airport passenger screening frame",
    "xray scanner": "a large tunnel X-ray baggage scanner machine with rubber curtain flaps and conveyor belt, airport luggage screener",
    "check in counter": "an airline check-in counter with luggage belt scale, computer screen, and boarding pass printer behind desk",
    "baggage claim": "an airport baggage claim oval carousel conveyor belt with suitcases rotating past waiting passengers, arrivals area",
    "luggage cart": "a metal airport luggage cart with FLAT platform base and upright push handle, free-standing silver cart",
    "airport trolley": "a larger airport trolley with RAISED side rails and deeper platform holding stacked bags, wheeled terminal cart",
    "boarding gate sign": "an illuminated boarding gate NUMBER sign at airport gate area, LED display showing flight code and destination",

    # ===== BUILDING INFRASTRUCTURE (649-660) =====
    "service corridor": "a long narrow building service corridor with exposed overhead pipes and plain utility doors along walls, staff passage",
    "maintenance hatch": "a small square hinged hatch in CEILING with push-open panel, access to pipes and wiring above ceiling tiles",
    "access hatch": "a FLOOR-level recessed access hatch with flush-mounted lift handle in panel, underground utility access point below",
    "inspection panel": "a small removable WALL panel with corner screws, pulled off to reveal hidden plumbing pipes behind for inspection",
    "access panel": "a LARGER hinged access panel in wall or ceiling with swing latch, opened for building systems maintenance entry",
    "service hatch": "a metal service hatch in EXTERIOR building wall with keyed lock, outdoor access to utility meters and valves",
    "storage room": "a cluttered building storage room with metal shelving units holding cardboard boxes and miscellaneous supplies on shelves",
    "utility room": "a utility room with water heater tank, gray electrical panel, and exposed copper pipes on walls",
    "maintenance room": "a maintenance workshop room with pegboard tool wall, sturdy workbench, and labeled spare parts on metal shelves",
    "electrical room": "a room with large gray electrical panels, bundled conduit runs, and HIGH VOLTAGE warning signs on door",
    "server room": "a server room with rows of tall black server racks showing BLUE LED lights and cable-managed raised floor",
    "boiler room": "a boiler room with large cylindrical boiler, steam pipes, pressure gauges, and warm industrial atmosphere inside",

    # ===== LOADING & WAREHOUSE (661-670, 761-767) =====
    "loading dock": "an outdoor loading dock raised concrete platform at warehouse height with semi-truck backed up to dock edge",
    "loading bay": "an INDOOR loading bay area with overhead roll-up door open and delivery truck backed in, warehouse interior zone",
    "forklift": "a YELLOW forklift truck with steel forks raised carrying a wooden pallet load, warehouse material handling vehicle",
    "pallet jack": "a manual ORANGE pallet jack with pump handle for lifting, low-profile rolling pallet mover on warehouse floor",
    "hand truck": "a vertical two-wheeled hand truck dolly with L-shaped frame and rubber grip handles, moving stacked boxes upright",
    "cargo van": "a WHITE cargo van with sliding side door open revealing empty cargo area inside, commercial delivery vehicle",
    "tow truck": "a YELLOW flatbed tow truck with car loaded on tilted hydraulic ramp platform, roadside vehicle recovery truck",
    "garbage truck": "a GREEN garbage truck with side-mounted hydraulic arm lifting large dumpster overhead, municipal waste collection vehicle",
    "delivery truck": "a BROWN box delivery truck with rear roll-up cargo door, package courier van with company branding on side",
    "material bin": "a BLUE plastic parts bin on warehouse shelf with front label holder slot, small component storage container",
    "storage crate": "a sturdy WOODEN slatted storage crate with reinforced corners, industrial shipping container box for heavy goods",
    "shipping pallet": "a flat WOODEN shipping pallet with parallel deck boards on stringer supports, standard cargo stacking base platform",
    "pallet stack": "multiple empty wooden pallets stacked vertically on top of each other in tall tower pile at warehouse",
    "dock bumper": "a thick BLACK molded rubber dock bumper pad bolted to loading dock wall face, truck trailer impact cushion",
    "dock leveler": "a hinged STEEL dock leveler platform bridging gap between dock edge and truck bed, hydraulic adjustable height bridge",
    "dock shelter": "a padded foam dock shelter frame surrounding loading bay door opening, inflatable curtain cushion sealing around backed-up truck",

    # ===== CABINET HARDWARE (673-675) =====
    "cabinet hinge": "a small concealed European cup hinge with arm mechanism inside kitchen cabinet door, hidden when closed, NOT visible",
    "cabinet latch": "a brown plastic magnetic catch INSIDE cabinet door, small magnet holds door shut, NOT a keyed lock",
    "cabinet handle": "a sleek D-shaped chrome pull handle mounted on cabinet door front, horizontal curved arch bar hardware grip",

    # ===== FIRE SAFETY SIGNS (682-684) =====
    "fire exit sign": "a GREEN illuminated fire exit sign above door showing white running figure with arrow, emergency directional guidance",
    "emergency light": "a white twin-head emergency light unit with battery box, wall-mounted above door providing backup illumination during outage",
    "fire alarm": "a RED circular fire alarm bell with chrome dome on wall beside flashing white strobe light, building alert",

    # ===== ELEVATOR & ESCALATOR (685-689, 836) =====
    "elevator panel": "a brushed stainless steel elevator interior wall panel with vertical column of floor buttons and digital floor display",
    "elevator button panel": "a CLOSE-UP of elevator floor buttons showing numbered circles with raised braille dots beside each button, interior",
    "elevator handrail": "a horizontal polished metal grab BAR inside elevator mounted on rear wall, passenger stability handrail at waist height",
    "escalator handrail": "a moving BLACK rubber handrail belt running along escalator balustrade edge, continuous loop moving with steps automatically",
    "escalator panel": "a stainless steel skirt panel at escalator BASE with red emergency stop button and comb plate visible",
    "freight elevator": "a LARGE industrial freight elevator with heavy ribbed doors and padded blanket interior walls, oversized goods lift car",

    # ===== SECURITY & ACCESS (690-695) =====
    "security camera": "a white DOME ceiling-mounted security camera, hemisphere-shaped housing with dark lens window underneath, indoor surveillance",
    "badge reader": "a wall-mounted proximity card badge reader with green LED indicator light, tap-to-access device beside secure door",
    "keypad reader": "a wall-mounted NUMERIC keypad access reader with small LCD screen and buzzer, PIN entry security device panel",
    "access gate": "a waist-height stainless steel TURNSTILE gate with integrated card reader, building lobby pedestrian access control barrier",
    "parking ticket validator": "a wall-mounted parking ticket VALIDATION machine near elevator lobby, insert ticket slot with green confirmation display",
    "ticket scanner": "a HANDHELD wireless ticket scanner device with screen scanning QR code on paper ticket, event entry verification",

    # ===== SERVICE PANELS (697) =====
    "service panel": "a gray metal utility panel with latch on building wall, hinged maintenance access cover for hidden systems behind",

    # ===== CABINET GROUP (699-702, 705, 730, 751, 754, 780, 850, 866, 918, 956) =====
    "utility cabinet": "a BEIGE metal utility cabinet in building utility room with pipes and shut-off valves visible through open doors",
    "storage cabinet": "a tall GRAY metal storage cabinet with double front doors and adjustable interior shelves, general supply storage unit",
    "linen closet": "a white closet with neatly folded towels and bed sheets organized on shelves, household linen storage area",
    "medicine storage cabinet": "a WHITE locked medicine cabinet with RED CROSS symbol on door, controlled substance secure storage unit",
    "cabinet seal": "a thin rubber gasket seal strip along cabinet door edge, narrow dust-proof and moisture-proof cabinet closure",
    "tool cabinet": "a RED metal rolling tool cabinet with multiple pull-out drawers full of organized wrenches and sockets, mechanic workshop",
    "roadside cabinet": "a GREEN metal roadside equipment cabinet standing on sidewalk, telecom or traffic signal electronics housing with lock",
    "transformer cabinet": "a large GREEN pad-mounted electrical transformer cabinet on concrete slab outdoors, utility power distribution with warning label",
    "junction cabinet": "a wall-mounted metal junction cabinet with terminal blocks and wire connections inside, electrical wire distribution point enclosure",
    "telecom cabinet": "a tall GRAY outdoor telecom equipment cabinet with louvered ventilation panels on sides, roadside communications infrastructure housing",
    "network cabinet": "a BLACK enclosed 19-inch network rack cabinet with locking GLASS front door showing organized patch panels and switches",
    "industrial control cabinet": "a large floor-standing GRAY steel control cabinet with cable gland entries at bottom, factory automation electronics housing",
    "hose cabinet": "a red glass-front wall-mounted cabinet containing coiled fire hose and brass nozzle with break-glass panel in corridor",

    # ===== METER BOXES (711-712) =====
    "water meter box": "a GREEN plastic ground-level water meter box with hinged flip lid, buried in lawn for utility access",
    "gas meter box": "a YELLOW metal wall-mounted gas meter box with round dial gauge and pipe connections, outdoor utility fixture",

    # ===== MOUNT GROUP (718-722) =====
    "projector mount": "a ceiling projector mount bracket with adjustable tilt arm, holds projector body flush underneath ceiling surface",
    "ceiling mount": "a universal round ceiling mount base plate with threaded rod, generic hardware for hanging fixtures from ceiling",
    "wall mount": "a flat TV wall mount bracket with articulating swing arm joint, holds flat screen television on wall surface",
    "monitor mount": "a desk-CLAMP articulating single monitor arm mount holding computer display screen, adjustable height and angle tilt",
    "camera mount": "a small ball-head camera mount with quarter-inch screw thread, compact tripod or wall bracket for small camera",

    # ===== CABLE GROUP (723-724, 790, 874-875, 965) =====
    "cable tray": "a metal ladder-style cable tray with side rails supporting bundled cables running OVERHEAD along ceiling, open rung",
    "cable raceway": "an enclosed rectangular white plastic cable raceway channel on WALL surface hiding cables inside, surface-mounted conduit",
    "cable splice box": "a weatherproof rectangular cable splice enclosure box with rubber cable glands on sides, outdoor cable junction housing",
    "cable ladder": "a wide metal cable LADDER tray with side rails and rungs supporting large cable bundles overhead in industrial ceiling",
    "cable management arm": "a flexible multi-hinged cable management arm on server rack REAR door, guides cables when opening, articulating route",
    "cable termination box": "a gray wall-mounted cable termination box with rows of terminal strips inside for wire endpoints in electrical room",

    # ===== BOX GROUP (725-727) =====
    "junction box": "a small SQUARE gray metal junction box on wall with conduit pipes entering, internal wire connection splice point",
    "outlet box": "a BLUE plastic electrical outlet box recessed in wall cavity, housing receptacle wiring behind cover plate",
    "switch box": "a metal electrical switch box in wall framing, single-gang housing for light SWITCH wiring and connections",

    # ===== ELECTRICAL MISC (728-729) =====
    "extension reel stand": "an ORANGE portable extension cord reel on upright stand frame with hand crank, long power cable storage spool",
    "power distribution strip": "a horizontal BLACK rack-mounted power distribution strip with multiple outlets and LED indicator, server rack PDU unit",

    # ===== WORKSHOP (731-738) =====
    "tool drawer": "a single tool drawer pulled OUT from red cabinet revealing neatly organized wrenches and screwdrivers inside foam cutouts",
    "workbench": "a heavy solid wooden workbench with mounted vise on corner and hand tools hanging on pegboard wall behind",
    "vise clamp": "a cast iron bench vise CLAMPED to workbench edge, serrated jaws gripping metal workpiece, heavy-duty holding tool",
    "bench grinder": "a double-wheel bench grinder BOLTED to workbench surface, spinning abrasive stone wheel with clear eye shield guard",
    "air compressor": "a RED portable air compressor with horizontal cylindrical tank, analog pressure gauge dial, and coiled rubber air hose",
    "pressure gauge": "a round ANALOG pressure gauge with black needle on numbered PSI dial face, brass threaded pipe fitting connection",
    "hose reel": "a wall-mounted garden hose reel drum with GREEN hose coiled around central spindle, hand crank winding handle",
    "spray nozzle": "an adjustable garden hose spray nozzle with squeeze trigger grip, variable pattern from jet to wide fan spray",

    # ===== SAFETY & CROWD CONTROL (739-747) =====
    "safety cone": "an ORANGE rubber traffic safety cone with reflective white collar stripe, placed on road surface or wet floor",
    "warning sign": "a YELLOW triangle warning sign with black exclamation mark symbol, general caution hazard alert on post or wall",
    "temporary barrier": "an orange and white striped plastic sawhorse barricade on folding legs, portable construction zone warning barrier",
    "crowd barrier": "a METAL interlocking crowd control barrier fence section with flat base feet, steel event perimeter barricade panel",
    "stanchion post": "a chrome retractable BELT stanchion post with coiled nylon strap, queue management pole forming orderly waiting lines",
    "queue post": "a BLACK rope stanchion post with braided red VELVET rope attached, theater-style VIP line elegant rope barrier",
    "queue rope": "a RED velvet rope stretched between two polished brass posts, upscale queue line barrier with hook ends",
    "portable ramp": "a folding aluminum portable wheelchair ramp placed over steps, temporary accessibility slope with side rails and surface grip",
    "wheel stop": "a YELLOW painted concrete wheel stop block at end of parking space, rectangular car tire bumper on pavement",

    # ===== PARKING & ROAD TECH (748-756) =====
    "parking sensor": "a small round ultrasonic parking sensor embedded in car rear bumper, proximity distance backup detector dot sensor",
    "parking camera": "a small wide-angle reverse camera mounted ABOVE license plate on car rear, rearview parking aid backup camera",
    "license plate reader": "a pole-mounted ANPR automatic license plate recognition camera system aimed at passing traffic, vehicle identification device",
    "signal box": "a metal signal control box at TRACKSIDE or roadside, railway or traffic signal relay electronics weatherproof enclosure",
    "utility pole base": "the concrete foundation base and lower treated-wood section of a utility pole at ground level, anchor footing",
    "substation gate": "a locked METAL chain-link gate with HIGH VOLTAGE DANGER warning sign at electrical substation perimeter security fence",
    "control pedestal": "a standalone stainless steel control pedestal with pushbuttons and small display screen on top, machine control station post",

    # ===== SCALE GROUP (757-760) =====
    "industrial scale": "a heavy-duty stainless steel BENCH scale with digital display panel for factory weighing, countertop industrial measurement",
    "floor scale": "a LOW-profile floor platform scale with beveled ramp edges, large flat pallet-size weighing surface on ground level",
    "platform scale": "a RAISED platform scale with tall column-mounted digital indicator display, step-on standing person or object weighing station",
    "weighing indicator": "a wall-mounted DIGITAL weighing indicator display unit with numeric LED readout only, remote scale controller box",

    # ===== INDUSTRIAL DOORS (768-770) =====
    "rolling shutter": "a metal security rolling shutter partially raised showing coiled drum mechanism at top of doorway, corrugated slats",

    # ===== ELECTRICAL SAFETY (771-776) =====
    "safety switch": "a wall-mounted RED safety disconnect switch with rotary lockable handle, electrical isolation device for maintenance lockout",
    "emergency stop button": "a large RED mushroom-head E-STOP emergency stop pushbutton on machine panel surface, safety shutdown push button",
    "control button": "a colored illuminated round pushbutton on industrial control panel face, green for START or red for STOP operation",
    "indicator light": "a small round LED pilot indicator light on machine panel, green glowing status signal lamp showing running state",
    "status display": "a small multi-line LED text display panel on machine housing, shows alphanumeric operational status and parameter readout",
    "circuit breaker": "a single DIN-rail mounted miniature circuit breaker with toggle lever switch, compact overcurrent protection device in panel",

    # ===== ELECTRICAL PANELS (777-783) =====
    "fuse box": "a small older-style metal fuse box with row of glass tube or ceramic FUSES, vintage electrical protection panel",
    "electrical panel": "a LARGE gray steel electrical panel with hinged door OPEN showing rows of labeled circuit breaker switches inside",
    "breaker panel": "an OPEN breaker panel interior close-up showing labeled toggle circuit breaker switches arranged in two vertical columns",
    "meter box": "a wall-mounted outdoor utility meter box with glass window showing spinning analog meter dials inside, measurement housing",
    "water meter": "a round BRASS water meter with analog dial face showing gallons usage, installed inline in pipe with fittings",
    "gas meter": "a YELLOW gas meter with multiple rotating numbered dial wheels showing cubic feet, wall-mounted with two pipe connections",

    # ===== VALVE GROUP (784-785, 794, 902-904, 930, 940, 943) =====
    "shutoff valve": "a RED lever handle quarter-turn ball valve mounted on pipe, main water or gas supply line shutoff control",
    "valve handle": "a round cast iron WHEEL-type valve handwheel on threaded stem, multi-turn gate valve operating handle for manual control",
    "sprinkler valve": "a brass fire sprinkler system control valve with analog PRESSURE GAUGE and tamper switch, in pipe riser room",
    "pressure relief valve": "a brass pressure relief valve with SPRING-loaded bonnet cap on top, opens at set overpressure to vent safely",
    "check valve": "a brass inline check valve with cast flow direction ARROW on body, prevents backflow in one-way piping",
    "solenoid valve": "a valve body with ELECTROMAGNETIC COIL assembly on top, electrically actuated on-off fluid control, wired connections visible",
    "pneumatic valve": "a bank of small solenoid valves mounted on aluminum manifold block with blue pneumatic tubing in automation cabinet",
    "steam valve": "a large cast iron gate valve with handwheel on insulated steam pipe with flanged connections in industrial boiler room",
    "flow control valve": "a stainless steel modulating flow control valve with electric actuator on top for automated flow regulation on process pipe",

    # ===== PLUMBING MISC (786-787) =====
    "backflow preventer": "a brass double-check backflow preventer assembly with test port cocks on pipe run, plumbing cross-connection safety device",
    "conduit pipe": "a gray rigid metal electrical conduit pipe with threaded couplings running along wall surface, wire protection tube pathway",

    # ===== NETWORK & SERVER (788-789) =====
    "patch panel": "a 19-inch rack-mounted network patch panel with horizontal row of 24 numbered RJ45 ports, cable termination punchdown",
    "server rack": "a tall BLACK open-frame or enclosed 42U server rack with perforated mesh doors, data center equipment mounting cabinet",

    # ===== FIRE DETECTION & SUPPRESSION (791-800, 860-861, 876-877, 951-956) =====
    "carbon monoxide detector": "a round WHITE carbon monoxide alarm detector mounted on ceiling with green power LED indicator, CO safety monitor",
    "fire alarm pull station": "a RED fire alarm pull station box on wall with manual pull-down handle lever, fire emergency alert trigger",
    "sprinkler head": "a ceiling-mounted brass fire sprinkler head with red glass BULB element, automatic heat-activated fire suppression nozzle",
    "sprinkler controller": "a GREEN fire sprinkler zone controller box mounted on wall with LCD display showing active zone status map",
    "fire hose reel": "a RED wall-mounted fire hose reel drum inside glass-fronted cabinet with brass nozzle, emergency firefighting equipment",
    "sprinkler pipe": "a red-painted steel fire sprinkler distribution PIPE running along ceiling with pendant sprinkler heads at regular intervals",
    "standpipe hose connection": "a wall-recessed brass fire standpipe HOSE valve connection with cap in stairwell at each floor, firefighter hookup",
    "fire suppression panel": "a RED fire suppression system control panel with illuminated zone map diagram and alarm silence and reset buttons",
    "gas suppression cylinder": "a tall RED pressurized gas suppression CYLINDER in rack row, FM200 or CO2 clean agent fire extinguishing tank",
    "fire smoke damper": "a rectangular combination fire-rated smoke damper with fusible link and electric motor actuator installed inside sheet metal duct",
    "fire pump": "a large red electric fire pump on concrete pad with suction and discharge piping and brass pressure gauges in pump room",
    "fire water tank": "a large cylindrical red-painted steel water storage tank outdoors on concrete base for firefighting reserve water supply",
    "sprinkler riser": "a vertical red pipe assembly with OS&Y valve and pressure gauges mounted on wall inside fire sprinkler riser room",
    "standpipe system": "a vertical red standpipe pipe in concrete stairwell with brass hose valve connections at each floor landing for firefighting",

    # ===== EXITS & FIRE DOORS (797-800) =====
    "emergency exit": "a doorway with illuminated GREEN EXIT sign above and horizontal push-bar door, emergency building escape route exit",
    "exit sign": "a green illuminated EXIT sign with bold white letters and running man pictogram icon, ceiling or wall mounted",
    "panic bar": "a horizontal brushed metal panic crash bar spanning full width of fire door, push-to-open emergency exit hardware",

    # ===== HVAC UNITS (801-810) =====
    "hvac unit": "a large outdoor rooftop HVAC packaged unit with fan cowls and coil sections on building roof, climate system",
    "air filter": "a rectangular PLEATED air filter with cardboard frame border, disposable furnace or HVAC replacement filter element panel",
    "air handling unit": "a large GRAY insulated metal air handling unit in mechanical room with fan section, coils, and filter rack",
    "compressor unit": "an outdoor air conditioner compressor condensing unit with round FAN grille on top, AC outdoor unit on pad",
    "water pump": "a centrifugal water pump with electric motor on concrete base pad, BLUE cast iron volute housing and pipe flanges",
    "sump pump": "a submersible sump pump sitting in basement floor sump PIT with float switch ball, groundwater removal pump",
    "industrial fan": "a large floor-standing YELLOW industrial drum fan with heavy tubular metal stand, high-velocity warehouse air circulation blower",
    "industrial heater": "a ceiling-mounted or suspended radiant industrial heater unit glowing RED, warehouse overhead infrared space heating element",
    "industrial dehumidifier": "a large portable YELLOW industrial dehumidifier on wheels with water collection tank and drain hose, site drying unit",
    "industrial air purifier": "a large boxy WHITE industrial HEPA air purifier on caster wheels with air exhaust on top, cleanroom-rated unit",

    # ===== SECURITY (811-815) =====
    "security keypad": "a wall-mounted alarm system keypad with numeric buttons and armed/disarmed status LED indicators, home security panel",
    "surveillance camera": "a BULLET-style outdoor surveillance camera on wall bracket, cylindrical white weather-resistant housing with cable, NOT dome shape",
    "surveillance pole": "a tall metal pole with multiple cameras and antennas mounted at top, outdoor parking lot security monitoring post",
    "cctv monitor": "a desktop CCTV monitor screen showing SPLIT-VIEW grid of multiple camera feeds simultaneously, security desk surveillance display",

    # ===== CONTROL GROUP (816-821) =====
    "control panel": "an industrial control panel face with rows of pushbuttons, selector switches, indicator lights, and digital readout displays",
    "control box": "a SMALL wall-mounted gray metal control box with hinged door, contains internal relays and contactors for equipment",
    "relay box": "a small DIN-rail mounted relay enclosure with multiple transparent relay modules visible inside, industrial switching control box",
    "time clock machine": "a wall-mounted employee time clock machine with card slot or biometric fingerprint scanner, workplace attendance recording device",
    "utility pole": "a tall WOODEN utility pole with overhead power lines, transformer can, and wooden crossarms at top against sky",
    "transformer box": "a GRAY ground-level pad-mounted transformer box with HIGH VOLTAGE warning diamond label, neighborhood electrical power distribution unit",

    # ===== CONSTRUCTION (822-835) =====
    "road barrier": "a METAL W-beam highway guardrail along road edge on wooden posts, corrugated steel crash protection barrier rail",
    "concrete barrier": "a heavy CONCRETE Jersey barrier on road center divider, gray precast trapezoidal profile traffic separator wall section",
    "construction fence": "a temporary GREEN mesh construction site fence on round metal post supports, building site perimeter safety enclosure",
    "scaffold": "a multi-level metal tube scaffolding structure on building exterior with wooden plank decks and diagonal cross braces",
    "traffic cone": "an ORANGE and white striped standard traffic cone on road surface, flexible rubber base, reflective collar band",
    "warning cone": "a YELLOW wet floor caution cone placed INDOORS on shiny floor, smaller cone with printed CAUTION text warning",
    "temporary sign": "a fold-out ORANGE temporary road construction sign on portable A-frame stand, diamond-shaped advance warning message",
    "road work sign": "an orange diamond-shaped ROAD WORK AHEAD sign mounted on barricade, black text construction zone warning sign",
    "construction sign": "a LARGE rectangular construction project site information sign board with company name, project details, and rendering image",
    "portable toilet": "a BLUE plastic portable toilet porta-potty unit at construction site, freestanding single-occupant chemical toilet booth",
    "storm grate": "a rectangular cast iron storm drain grate recessed in street CURB opening, rainwater inlet catch basin grating",
    "drain cover": "a ROUND heavy cast iron manhole drain cover on road surface, large circular utility access lid with pattern",
    "grate cover": "a RECTANGULAR flat metal bar grating cover over utility trench or channel, industrial floor-level drainage opening cover",
    "manhole ladder": "a steel rung ladder attached inside dark manhole shaft wall, rungs embedded in concrete going vertically down",

    # ===== TRANSIT (837-841) =====
    "swing gate": "a single-leaf metal SWING gate on hinges at property driveway entrance, manual or motorized opening gate panel",
    "fare machine": "a transit fare VENDING machine at station with touchscreen display, accepts cards and cash for ticket purchase",
    "ticket barrier": "an automated ticket gate TURNSTILE barrier at train station entry, tap contactless card or scan paper ticket",

    # ===== WEATHER INSTRUMENTS (842-845) =====
    "weather station": "an outdoor weather station with multiple sensor instruments on mounting pole, temperature, humidity, and wind measurement array",
    "anemometer": "a spinning CUP anemometer with three or four hemispherical cups rotating on vertical axis measuring wind speed",
    "rain gauge": "a CYLINDRICAL transparent graduated rain gauge collection tube on ground stand, measuring accumulated precipitation rainfall amount",
    "wind vane": "an ARROW-shaped metal wind vane weathercock on rooftop peak, rotating pointer showing current wind direction compass bearing",

    # ===== GROUNDING & ELECTRICAL (846-849) =====
    "grounding rod": "a COPPER grounding rod driven into earth soil with green wire clamp attached, electrical earthing electrode stake",
    "surge arrester": "a PORCELAIN glazed surge arrester device mounted on utility pole crossarm, overhead lightning protection insulator with gap",
    "vent damper": "a round BUTTERFLY-blade damper inside circular ductwork cross-section, adjustable lever controlling airflow restriction, metal disc pivot",
    "duct fan": "a CYLINDRICAL inline duct booster fan installed inside round sheet metal air duct, tubular motor and blade assembly",

    # ===== TELECOM & DISTRIBUTION (851-855) =====
    "fiber distribution box": "a small wall-mounted fiber optic distribution box with splice tray and fiber pigtails inside, FDB access enclosure",
    "substation transformer": "a LARGE outdoor oil-filled power substation transformer on concrete pad with porcelain bushings and radiator cooling fins",
    "power distribution box": "a metal power distribution box with copper bus bars and row of branch breakers, secondary electrical distribution panel",
    "surge protector panel": "a panel-mounted surge protection device module with green STATUS indicators, SPD installed in electrical breaker panel board",
    "loop detector": "a diamond-shaped wire LOOP sensor cut into road pavement surface, embedded vehicle presence detection at intersection or gate",

    # ===== DUCTWORK (856-859) =====
    "air duct": "a round flexible ALUMINUM corrugated air duct tube connecting HVAC unit to ceiling vent, silver spiral tube",
    "duct register": "a rectangular FLOOR register with adjustable damper louvers set in floor surface, room-level air supply vent grille",
    "smoke damper": "a motorized rectangular damper with electric ACTUATOR arm inside duct, automatically closes smoke compartment during fire alarm",
    "fire damper": "a FUSIBLE-LINK fire damper blade inside duct at rated fire wall penetration, spring-loaded automatic closure mechanism",

    # ===== ACCESS CONTROL (862-865) =====
    "magnetic lock": "an electromagnetic door lock PLATE mounted at top of door frame, electric maglock holding door closed with current",
    "access controller": "a wall-mounted electronic access control unit near secured door with CARD READER and numeric keypad integrated panel",
    "security controller": "a RACK-mounted central security access management controller unit with network ports and status LEDs, head-end system device",

    # ===== DATA CENTER & NETWORK (866-875) =====
    "data center rack": "a tall OPEN-frame four-post data center rack with dense servers, organized cable bundles, and overhead cable management",
    "server cooling unit": "an IN-ROW precision cooling unit placed between hot server racks, rear-door heat exchanger targeted cold air delivery",
    "power supply unit": "a rack-mounted redundant power supply unit with HOT-SWAP slide-out modules and LED indicators, server PSU shelf",
    "uninterruptible power supply": "a tall tower or rack UPS unit with internal battery and front LCD status panel, backup power protection device",
    "battery backup unit": "a rack-mounted BATTERY module shelf with rows of sealed lead-acid or lithium battery blocks, UPS capacity expansion",
    "electrical busbar": "a solid COPPER busbar conductor with multiple bolted lug connections inside switchgear panel, power distribution conductor strip",
    "busbar trunking": "an enclosed ALUMINUM busbar trunking duct system running along ceiling, factory electrical power distribution feeder run channel",

    # ===== GENERATORS (878-880) =====
    "emergency generator": "a large OUTDOOR diesel emergency generator set inside sound-attenuated weather enclosure, backup building power generation unit",
    "diesel generator": "a heavy-duty open-frame diesel GENERATOR showing exposed engine block and alternator on steel skid base, industrial power",
    "generator control panel": "a control panel mounted ON generator set with analog gauges, start/stop switches, and digital parameter display module",

    # ===== PROCESS EQUIPMENT (881-888) =====
    "fuel storage tank": "a large horizontal cylindrical steel fuel storage TANK on concrete supports outdoors with fill port and level gauge",
    "oil separator": "a vertical cylindrical oil-water SEPARATOR tank with inlet and outlet pipe connections, industrial wastewater separation vessel",
    "grease trap": "a stainless steel GREASE trap box installed under commercial kitchen sink, interceptor with baffles catching fats before drain",
    "water treatment unit": "a SKID-mounted water treatment system with media tanks, cartridge filter housings, and UV sterilizer chamber on frame",
    "filtration system": "a multi-stage inline FILTRATION system with blue cartridge filter housings connected in series on pipe, water purification",
    "reverse osmosis unit": "a reverse osmosis membrane unit with horizontal PRESSURE VESSELS in steel frame rack, RO water purification system",
    "chemical dosing pump": "a small peristaltic or diaphragm chemical dosing PUMP beside solution tank, precise metering injection into process stream",
    "flow meter": "a flanged electromagnetic FLOW meter installed on pipe with attached digital display showing flow rate reading, measurement device",

    # ===== SENSOR GROUP (889-893, 947-949) =====
    "level sensor": "an ULTRASONIC level sensor aimed downward on tank top nozzle, non-contact liquid level measurement transducer with cable",
    "temperature sensor": "a stainless steel temperature PROBE inserted into pipe through thermowell fitting, RTD or thermocouple sensor with cable",
    "humidity sensor": "a wall-mounted WHITE rectangular humidity sensor with ventilated side slots housing, indoor room climate monitoring device",
    "proximity sensor": "a small CYLINDRICAL inductive proximity sensor with glowing LED tip clamped on machine bracket, metal object detection",
    "photoelectric sensor": "a small RECTANGULAR photoelectric sensor emitting visible red laser dot beam, mounted on machine for object detection",
    "vibration sensor": "a small stainless steel accelerometer vibration sensor bolted to motor housing for machine condition monitoring on rotating equipment",
    "gas detector": "a yellow wall-mounted combustible gas detector with electrochemical sensor element and digital display showing alarm status indoors",
    "flame detector": "an IR flame detector with dark optical lens mounted on bracket in industrial area for automatic fire detection and alarm",

    # ===== CONTROL & AUTOMATION (894-901) =====
    "control relay": "a small TRANSPARENT DIN-rail relay module with visible electromagnetic coil and contact mechanism inside clear housing, industrial switching",
    "programmable logic controller": "a compact PLC module on DIN-rail with rows of LED status indicators and screw terminal I/O connections, industrial automation",
    "industrial touchscreen": "a large ruggedized industrial HMI touchscreen panel showing colorful process control DIAGRAM, factory wall-mounted operator interface",
    "operator panel": "an industrial operator panel with membrane KEYPAD buttons and small monochrome LCD display, simpler machine interface device",
    "machine guard": "a transparent POLYCARBONATE safety guard panel mounted around dangerous machine area, hinged protective barrier with interlock switch",
    "safety light curtain": "a vertical pair of yellow SENSOR COLUMNS with array of infrared beams across machine opening, safety presence detection",
    "emergency stop switch": "a RED mushroom-head emergency stop switch with TWIST-to-RELEASE reset mechanism on yellow base plate, safety E-stop",
    "lockout tagout device": "a RED safety padlock and DANGER tag attached to equipment energy isolation switch handle, LOTO lockout device",

    # ===== MOTORS & DRIVES (905-920) =====
    "actuator motor": "a compact electric rotary ACTUATOR motor bolted on valve body, geared motor for automated valve open-close operation",
    "gearbox unit": "a cast iron industrial reduction GEARBOX with input and output shafts, coupled between motor and driven equipment",
    "belt drive": "a V-BELT pulley drive with two grooved pulleys and belt connecting motor shaft to equipment, tension guard",
    "chain drive": "a ROLLER CHAIN drive with toothed sprocket gears connecting motor output to equipment input, chain guard cover visible",
    "conveyor belt": "a flat wide rubber CONVEYOR belt carrying cardboard boxes in warehouse, horizontal material transport with side guides",
    "roller conveyor": "a gravity ROLLER conveyor with rows of freely spinning cylindrical metal rollers, unpowered package transport track section",
    "overhead conveyor": "an OVERHEAD trolley conveyor system with carrier hooks moving along ceiling-mounted enclosed I-beam track, suspended transport",
    "material feeder": "a vibratory BOWL feeder with spiral ramp sorting and orienting small parts onto output track, automated feeding",
    "hopper bin": "a large V-shaped steel HOPPER with sloped walls and bottom gate above machine, gravity material feed container",
    "industrial chute": "an angled sheet metal CHUTE directing loose material flow downward by gravity, inclined slide channel with side walls",
    "dust collector": "a large BAG-HOUSE dust collector with fabric filter bags inside tall housing and ductwork connections, industrial filtration",
    "cyclone separator": "a tall CONICAL steel cyclone separator with tangential air inlet near top and dust collection drum at bottom",
    "bag filter unit": "an industrial BAGHOUSE filter unit housing with rows of long cylindrical filter bags inside for dust particle removal",
    "power factor controller": "a panel-mounted DIGITAL power factor controller with LCD screen showing cos-phi reading, capacitor bank step management unit",
    "motor control center": "a large MULTI-SECTION lineup cabinet with individual pull-out motor starter drawer compartments in each vertical section, MCC",
    "wireless controller": "a silver rack-mounted WLAN controller appliance with ethernet ports managing multiple wireless access points in network cabinet",
    "robot controller": "a tall gray robot controller cabinet with teach pendant hanging from hook and power connections on factory floor",
    "light curtain controller": "a small gray DIN-rail mounted light curtain controller with wiring connected to yellow transmitter and receiver sensor columns",

    # ===== DRIVES (921-925) =====
    "variable frequency drive": "a gray plastic VFD unit mounted on DIN rail with digital display showing Hz frequency for motor speed control in electrical panel",
    "soft starter": "a dark gray motor soft starter module with green LED status indicators for gradual ramp-up mounted on DIN rail in control cabinet",
    "motor drive unit": "a black motor drive module with aluminum heatsink fins and power terminal connections mounted inside an industrial electrical enclosure",
    "servo motor": "a compact silver servo motor with rear-mounted encoder and coiled feedback cable on factory automation bench for precise positioning",
    "linear actuator": "a silver rod-type electric linear actuator with extending steel shaft and mounting brackets on industrial frame for push-pull motion",

    # ===== HYDRAULIC (926-928) =====
    "hydraulic pump": "a blue hydraulic power unit with gear pump coupled to electric motor atop a steel oil reservoir tank on factory floor",
    "hydraulic cylinder": "a heavy chrome-rod hydraulic cylinder with piston extending outward and port fittings mounted on industrial steel frame",
    "hydraulic manifold": "a machined aluminum block with multiple drilled valve ports and brass hydraulic fittings arranged on workbench surface",

    # ===== PNEUMATIC (929-932) =====
    "pneumatic compressor": "a large dark green industrial air compressor with horizontal receiver tank and belt-driven motor on concrete plant floor",
    "air receiver tank": "a tall vertical blue compressed air storage tank with pressure gauge dial and bottom drain valve on factory floor",
    "air dryer unit": "a white refrigerated air dryer unit with inline moisture separator and condensate drain connected to compressed air piping",

    # ===== THERMAL & HEAT EXCHANGE (933-938) =====
    "oil cooler": "a black finned-tube oil cooler with electric fan attached for fluid cooling mounted on hydraulic power unit frame",
    "plate heat exchanger": "a stainless steel plate heat exchanger with corrugated plates compressed by long tie bolts and flanged pipe connections",
    "shell tube heat exchanger": "a long cylindrical shell and tube heat exchanger with welded flanges and pipe connections at each end in mechanical room",
    "cooling tower": "a large outdoor concrete cooling tower with rotating fan at top and visible water cascade behind louvers on building roof",
    "chiller unit": "a large blue industrial chiller unit with compressor section and condenser coils and control panel on plant rooftop",
    "boiler unit": "a red fire-tube boiler with front-mounted burner controls and vertical exhaust stack for steam generation in boiler room",

    # ===== STEAM (939-940) =====
    "steam trap": "a small cast iron steam trap installed on pipe with inlet and outlet connections for condensate removal in mechanical room",

    # ===== PIPING (941-943) =====
    "expansion tank": "a red bladder-type expansion tank mounted vertically on copper pipe to absorb thermal pressure changes in mechanical room",
    "circulation pump": "a bronze inline circulation pump with flanged connections on hot water pipe for recirculation in building mechanical room",

    # ===== TRANSMITTERS (944-946) =====
    "pressure transmitter": "a stainless steel diaphragm pressure transmitter mounted on process pipe with digital display showing pressure reading in bar",
    "temperature transmitter": "a gray transmitter head mounted on thermowell fitting in pipe for temperature measurement with wired signal output",
    "level transmitter": "a guided wave radar level transmitter mounted on tank top flange for continuous level measurement with rod probe extending down",

    # ===== SMOKE EXHAUST (950) =====
    "smoke exhaust fan": "a large rooftop smoke exhaust fan with red motor housing and galvanized cowl for fire ventilation on building roof",

    # ===== ELECTRICAL DISTRIBUTION (957-964) =====
    "emergency power panel": "a red steel emergency power distribution panel with labeled critical circuit breakers and pilot lights mounted on wall",
    "automatic transfer switch": "a gray automatic transfer switch enclosure with utility and generator feed terminals and status indicator lights on wall",
    "main distribution board": "a large gray main electrical distribution board with main breaker and copper bus bars behind locked hinged panel door",
    "sub distribution board": "a smaller gray sub-distribution board with rows of branch circuit breakers and neutral bar mounted on corridor wall",
    "energy meter": "a white digital energy meter with LCD screen showing kWh consumption and pulse LED mounted in electrical meter cabinet",
    "power quality analyzer": "a yellow portable power quality analyzer with clamp current probes and color screen displaying waveforms on workbench",
    "grounding bar": "a polished copper grounding bar with multiple drilled lug connection points and green ground wires inside electrical panel",
    "lightning arrester": "a tall pointed copper lightning rod mounted on building rooftop with braided ground cable running down to earth electrode",

    # ===== FIBER & NETWORK (965-973) =====
    "fiber patch panel": "a black rack-mounted fiber patch panel with rows of green LC and blue SC fiber connectors and colored pigtails",
    "optical network terminal": "a small white ONT box with green fiber input port and multiple ethernet ports and status LEDs on wall",
    "network core switch": "a large black chassis network core switch with modular line cards and redundant power supplies in server rack",
    "edge switch": "a compact black PoE edge switch with multiple ethernet ports stacked in wiring closet on wall-mount bracket",
    "server blade chassis": "a large black blade server chassis with multiple hot-swap blade servers and shared power supplies in data center rack",
    "storage area network": "a black SAN storage array unit with rows of disk drive shelves and dual controller modules in data center rack",
    "rack power distribution unit": "a long vertical black rack PDU power strip with multiple outlet receptacles mounted inside server rack rail",

    # ===== DATA CENTER (974-978) =====
    "cold aisle containment": "an enclosed data center aisle with transparent ceiling panels and hinged doors containing cool supply air between server rows",
    "hot aisle containment": "a data center aisle with overhead exhaust chimney panels directing hot air from server rears upward to return plenum",
    "raised floor panel": "a perforated metal raised floor tile with circular ventilation holes and cable cutouts in data center access floor",
    "floor grommet": "a round black rubber grommet ring with brush seal inserted in raised floor tile for cable pass-through opening",
    "anti static flooring": "a blue anti-static ESD-safe vinyl floor tile surface installed in electronics assembly workspace to prevent static discharge",

    # ===== CLEANROOM (979-981) =====
    "cleanroom air shower": "a stainless steel air shower chamber with angled nozzle jets blowing particles off person entering through interlocked doors",
    "cleanroom pass box": "a stainless steel pass-through box with interlocking doors and UV light for transferring materials between cleanroom zones",
    "cleanroom laminar flow unit": "a ceiling-mounted white HEPA filter fan unit providing laminar downward clean airflow in cleanroom production area",

    # ===== ROBOT & AUTOMATION (982-988) =====
    "industrial robot arm": "a large orange multi-jointed industrial robot arm with gripper end effector performing assembly on factory production floor",
    "safety fence panel": "a yellow powder-coated mesh safety fence panel with steel posts around robot cell with interlocked gate door",
    "machine enclosure": "a gray sheet metal fully enclosed machine housing with clear safety windows and hinged access doors on production floor",
    "noise barrier panel": "a thick gray sound-absorbing composite wall panel with perforated face for industrial noise reduction along factory wall",
    "acoustic enclosure": "a padded acoustic enclosure with foam-lined panels surrounding noisy machine equipment with sealed access door for soundproofing",

    # ===== BULK MATERIAL (989-993) =====
    "material silo": "a tall cylindrical galvanized steel silo with cone-shaped bottom discharge hopper for bulk powder storage at processing plant",
    "bulk storage tank": "a large white horizontal cylindrical storage tank for industrial liquids with manway hatch and level gauge on supports",
    "loading spout": "a green telescoping loading spout tube extending downward from silo outlet for dust-free filling of trucks below",
    "weighbridge": "a long concrete and steel vehicle weighbridge scale embedded flush in road surface for truck weighing at facility entrance",
    "truck scale": "a heavy steel truck scale platform with adjacent digital display column showing weight readout at loading yard entrance",

    # ===== PERIMETER SECURITY (994-998) =====
    "gate barrier arm": "a red and white striped automatic barrier arm on yellow post at vehicle entrance gate with control box",
    "automatic bollard": "a stainless steel retractable hydraulic bollard rising from flush ground housing in post shape at secure building entrance",
    "road blocker": "a heavy steel road blocker plate rising from road surface flush mount for anti-vehicle perimeter security at checkpoint",
    "perimeter fence sensor": "a small gray fence-mounted vibration sensor device clamped to chain-link fence for perimeter intrusion detection outdoors",
    "perimeter alarm panel": "a white wall-mounted perimeter alarm control panel with illuminated zone map display and colored status indicator lights",

    # ===== REGENERATE GROUP - Mevcut resimleri iyilestirme =====
    "ceiling light": "a round flush-mount ceiling light with frosted glass dome mounted flat on WHITE ceiling in a furnished living room, warm glow illuminating the room below",
    "night light": "a small glowing night light plugged directly into a wall OUTLET in a DARK hallway at night, soft warm orange glow near baseboard, tiny compact shape",
    "wall sconce": "a decorative wall sconce with upward and downward light casting warm pools on HALLWAY wall, ornate bronze metal bracket with frosted glass cylinder shade",
    "clip lamp": "a flexible-neck lamp with spring CLIP attached to edge of wooden bookshelf, bendable metal gooseneck arm with small cone shade pointing at books below",
    "reading lamp": "a tall adjustable FLOOR-STANDING reading lamp with arched neck beside an armchair, directing focused beam DOWN onto an open book resting on chair seat",
    "bedside lamp": "a table lamp with cream fabric shade on a wooden NIGHTSTAND beside a bed with white pillow visible, warm cozy bedroom setting at night",
    "desk lamp": "an articulated metal desk lamp with jointed arm on an office DESK beside keyboard and papers, cone shade directing task light onto workspace",
    "media console": "a long low wooden media console with open shelves showing GAMING CONSOLE, soundbar speakers, and streaming device visible, cabinets on sides, large TV on top",
    "tv console": "a modern WHITE closed-front TV console with flat doors and cable management, flat-screen TV mounted on WALL above it, clean minimal living room",
    "tv stand": "a simple open-shelf TV STAND in natural light wood with TV sitting directly on top, two open shelves below with nothing, basic minimal no-door design",
    "microphone": "a handheld dynamic MICROPHONE with chrome metal grille ball head held near a person's mouth for speaking or singing, cable trailing down, performance context",
    "webcam": "a small BLACK webcam clipped on top edge of computer MONITOR screen, round lens facing viewer with tiny green LED light, video call desk setup",
    "surge protector": "a surge protector with illuminated ON/OFF SWITCH and protection indicator LED light, multiple cords plugged in, label showing joule rating, on floor beside desk",
    "power strip": "a basic WHITE elongated power strip with 6 outlets in a ROW and single long cord, several device plugs inserted, simple design WITHOUT switch or indicator",
    "lamp shade": "a classic truncated cone LAMP SHADE in beige fabric shown ON a brass table lamp base, visible wire frame at top and bottom rim, warm light through fabric",
}
