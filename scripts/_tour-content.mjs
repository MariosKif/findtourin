// Curated seed content for every tour. Drives the one-shot enrichment
// runner (scripts/_make-tours-real.mjs). Kept in repo as the source of
// truth for what these listings claim.
//
// Image URLs are upload.wikimedia.org/wikipedia/commons/<a>/<b>/<filename>
// in original resolution (no /thumb/). The runner downloads each, resizes
// via macOS sips to ≤1600px / 80% quality, and uploads to Supabase Storage
// at tours/<slug>-<n>.jpg.

export const AGENCY_IDS = {
  'aegean-discoveries': 'f35ea21d-f9c1-409d-bc01-a4f6b1ded1b4',
  'cretan-trails':      'af8dbaae-4199-4bb3-8ad9-59ac2ad0c46b',
  'anatolian-routes':   '3ede2969-d5c6-4dfc-b178-cbd7dddcbe66',
  'italia-boutique':    'c167d123-2587-4263-8823-9bd83e2c5445',
  'balkan-trails':      'c5f95f5d-e546-4921-9aec-d924ba1fb05c',
};

export const TOURS = {
  'albanian-alps-trek': {
    agency: 'balkan-trails',
    departure_country: 'Albania',
    departure_city: 'Shkodër',
    max_participants: 12,
    description: `The Albanian Alps — known locally as the Bjeshkët e Nemuna, the Accursed Mountains — rise sharply along the country's northern border, cutting deep glacial valleys whose villages remained essentially closed to outsiders until the early 2000s. This three-day trek crosses the iconic Theth-to-Valbona pass, one of the most spectacular and accessible alpine routes in the Balkans. Day one starts in Shkodër with a transfer over the rough mountain road to Theth, a stone-house village set in a bowl beneath limestone peaks. Walkers spend the afternoon at the Grunas waterfall and the locked-in tower house known as the Kulla e Ngujimit, a structure used historically to shelter men involved in blood feuds under the Kanun customary law. Day two crosses the Valbona pass at 1,795 metres, an eight-hour walk on a well-marked trail through beech forest, scree, and high-pasture meadows where shepherds still summer with their flocks. The descent into the Valbona valley brings an overnight at a family-run guesthouse where dinner is whatever the household cooked that evening: cornbread, fresh trout, white cheese, and homemade rakia. Day three follows the Valbona river downstream to the road head, where the transfer back to Shkodër runs along the dramatic Lake Komani ferry route — a three-hour boat journey through a flooded river canyon. The trek is moderate to strenuous; bring trail shoes with ankle support, layered clothing, and a small daypack only — luggage is transferred separately.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/f/fb/Jezerski_Vrh_%282694%29_sa_Karanfila_%282480%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/b/b3/Albanian_Alps_from_Air.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/53/%C4%90eravica.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/e4/Bog%C3%ABKosov%C3%AB.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/3b/Tamara_01.JPG',
    ],
  },

  'berat-unesco-tour': {
    agency: 'balkan-trails',
    departure_country: 'Albania',
    departure_city: 'Tirana',
    max_participants: 14,
    description: `Berat is known in Albania as the City of a Thousand Windows — a phrase that becomes literal when you stand beneath the Mangalem quarter at dusk and watch the rows of identical Ottoman-era windows light up against the white-plastered hillside. This day tour from Tirana covers the UNESCO-inscribed historic core, the medieval citadel, and the working town that surrounds them. The drive south takes about two hours through the Myzeqe plain. The morning starts at the foot of the Mangalem quarter, walking the steep cobbled lanes among houses whose construction follows a remarkable thirteenth-century pattern: a narrow stone ground floor for storage and a larger upper storey of timber framing and white plaster, generously windowed to catch the southern sun. The route crosses the Osum river to the Gorica quarter on the opposite bank, where a more vernacular form of the same architecture continues, and then climbs to the Berat Castle — a still-inhabited medieval fortress whose narrow streets contain the Onufri Iconographic Museum, dedicated to the sixteenth-century post-Byzantine icon painter who worked in this region. The fortress walls give wide views over the Osum valley and the Tomorr massif. Lunch is at a family konak inside the citadel walls — typical Berat dishes include slow-braised lamb with yoghurt, stuffed peppers, and the local sweet pumpkin tart. Wear comfortable walking shoes for cobbles and 200 metres of vertical climb to the citadel; a hat is advisable in summer.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/f/f1/Berat_57.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/f4/Old_town_of_berat_1.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/4a/Old_town_of_berat_2_albania_2016.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/d/d5/BERAT_Unesco_Albania_2016.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/2/2b/Panorama_of_Berat%2C_Albania_2016.jpg',
    ],
  },

  'blue-eye-butrint-albania': {
    agency: 'balkan-trails',
    departure_country: 'Albania',
    departure_city: 'Saranda',
    max_participants: 12,
    description: `Two of southern Albania's most distinctive sites lie within an hour of Saranda, and this day tour combines them into a single itinerary that moves from natural geology in the morning to layered archaeology in the afternoon. The first stop is the Blue Eye, a karst spring near Muzina where groundwater rises through a vertical cave to form a deep circular pool of extraordinary clarity. The cold water — emerging at around 13 degrees Celsius year-round — fades from clear at the rim to an intense indigo blue at the centre, with the cave entrance more than 50 metres deep and not yet fully measured. A short forest path leads to a small viewing platform; swimming directly above the spring is no longer permitted but the surrounding stream pools are open. From the Blue Eye the route continues south to Butrint, a UNESCO World Heritage archaeological park that contains layered ruins from the Greek, Roman, Byzantine, Venetian, and Ottoman periods on a single peninsula above Lake Butrint. The guided walk covers the Greek theatre, the Roman forum, the early Christian baptistery with its ornate floor mosaic, and the Venetian-era triangular castle that crowns the highest point. Time at the small archaeological museum at the summit gives further context to the finds. Bring closed-toe shoes for uneven stone paths, sunscreen, and a swimsuit if you want to dip in the colder pools downstream of the Blue Eye.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/9/9b/Amphitheatre_of_Butrint_2009.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/8/8d/Albania_Blue_Eye.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/73/Butrint_Albania_10_baptistery.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/e5/2011_Butrint_02_Agora.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/3e/Crystal_blue_ksamil.jpg',
    ],
  },

  'ksamil-saranda-beach': {
    agency: 'balkan-trails',
    departure_country: 'Albania',
    departure_city: 'Saranda',
    max_participants: 12,
    description: `The Albanian Riviera between Saranda and Ksamil is sometimes called the Maldives of Europe — a description that overstates the case but captures something real about the colour of the water in the small bays north of the Greek border, where shallow sandy bottoms turn the sea pale turquoise even at midday. This day tour combines the southernmost beaches at Ksamil with a walking tour of Saranda's seafront and old harbour. The morning is spent on the Ksamil islets — three uninhabited rocks 100 to 200 metres offshore, reachable on rented kayaks or paddleboards from the main beach. The water inside the gap between the islets is sheltered enough for swimming children and clear enough that snorkelling reveals seagrass meadows and small reef fish without diving deep. The middle of the day moves to a lunch stop at a beachside taverna for the local catch — usually grilled sea bream or pasta with mussels — and then continues to Saranda's curving promenade. The afternoon walk passes the synagogue ruins, a fifth-century Jewish prayer house with surviving floor mosaics, before ending at the small fortified Ottoman-era square in the upper town. Bring swimwear, reef shoes for rocky approaches, and a refillable water bottle; many beach restaurants offer free refills with a meal. The high season runs late June through early September; May, June, and September are noticeably quieter.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/0/0e/Ksamill-1.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/4c/Ksamil_Albania_._Albanian_Riviera.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/6/67/Ksamil_albanian_riviera.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/3e/Crystal_blue_ksamil.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/51/Ksamil-ksamil_islands.jpg',
    ],
  },

  'bulgarian-wine-route': {
    agency: 'balkan-trails',
    departure_country: 'Bulgaria',
    departure_city: 'Plovdiv',
    max_participants: 10,
    description: `Bulgaria has been making wine for at least 6,000 years — the Thracians, who once occupied the lands between the Danube and the Aegean, are believed to have introduced viticulture to much of southeastern Europe — and the country today produces some of the most distinctive native-grape reds in the Balkans. This day route departs from Plovdiv and covers three working wineries in the Thracian Lowland, the historic heartland of Bulgarian viticulture. The first stop is a boutique cellar in the Brestovitsa wine region focused on the indigenous Mavrud grape, a deep-coloured red that produces wines with high tannin and considerable ageing potential. The winemaker walks the group through the vineyards, the fermentation cellar, and a tasting of three different Mavrud bottlings from successive vintages. The second visit is to a larger estate working with international varieties — Cabernet Sauvignon, Merlot, and Syrah — alongside the local Rubin grape, a 1944 Bulgarian crossing. Lunch is served at the estate restaurant overlooking the vineyards: typical mezedes, slow-cooked lamb, and tarator cucumber soup. The afternoon ends at a small family operation focused on natural wines, where the host pours from amphorae and explains the renewed interest in pre-industrial methods. Designated drivers are provided; tasters are encouraged to spit at the first two stops and savour at the third. The tour runs year-round, but the September harvest is when the cellars are at their most active.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/8/84/Winemuseum.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/a6/Mavrudwine.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/08/Rose-picking_in_Bulgaria_1870ies.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/d/dc/Bulgarian_Rose.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/8/82/Melnishkipiramidi.jpg',
    ],
  },

  'plovdiv-heritage-walk': {
    agency: 'balkan-trails',
    departure_country: 'Bulgaria',
    departure_city: 'Plovdiv',
    max_participants: 14,
    description: `Plovdiv is one of the oldest continuously inhabited cities in Europe — settled for at least eight thousand years on a cluster of seven hills above the Maritsa river — and it carries Thracian, Roman, Byzantine, Ottoman, and Bulgarian National Revival layers within the small footprint of its old town. This walking tour starts at the Roman Theatre on Trimontium hill, a remarkably intact second-century amphitheatre still used for summer performances, where a guide outlines the city's evolution from Thracian settlement through Philip II of Macedon's renaming to Philippopolis. The route descends through the Old Town's narrow cobbled streets, where the nineteenth-century Bulgarian Revival mansions — symmetrical timber-framed houses painted in deep ochres and blues, with overhanging upper floors and rich interior plaster work — line the lanes. Stops include the Balabanov House, the Hindliyan House, and the Ethnographic Museum, each offering interior visits with original wall paintings and period furnishings. The walk continues past the small Roman Forum remnants and the Roman Stadium, where the curved seating tiers are now embedded under a modern pedestrian street with glass viewing panels. The afternoon ends in the Kapana arts quarter, a once-derelict commercial district now full of independent galleries, third-wave coffee, and craft beer; lunch at a local mezze restaurant is included. Bring comfortable walking shoes — Plovdiv's old town is mostly cobbled and uphill in places.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/c/c3/Roman_Theatre_Plovdiv_3.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/f5/Ancient_theatre_plovdiv-1.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/fc/Plovdiv3.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/2/28/Plovdiv_balkan-1-.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/ed/Plovdiv_Bulgaria_by_Sentinel-2_20190608.jpg',
    ],
  },

  'rila-seven-lakes-trek': {
    agency: 'balkan-trails',
    departure_country: 'Bulgaria',
    departure_city: 'Sofia',
    max_participants: 12,
    description: `The Seven Rila Lakes lie at altitudes between 2,100 and 2,500 metres in Bulgaria's Rila mountains, formed during the last ice age and named for the shapes their basins suggest from above: the Tear, the Eye, the Kidney, the Twin, the Trefoil, the Fish Lake, and the Lower Lake. This day trip from Sofia covers the standard circuit of all seven, using the Pionerska chairlift to gain initial elevation and a panoramic ridge route that connects the lakes in sequence. The drive south from Sofia takes about two hours, ending at the lift station near the Rila Monastery massif. From the upper lift terminus a marked trail climbs gradually through subalpine meadows full of wildflowers in early summer, reaching the first viewpoint above the Lower Lake within forty minutes. The route then traverses the cirque, with the steepest section being the climb to Saliata pass — a 200-metre push that opens onto a panorama of all seven lakes laid out in tiered basins below. Total walking time is around five hours including stops; total elevation gain is roughly 600 metres. Mountain weather can change rapidly even in July and August; bring a waterproof shell, a fleece, and at least two litres of water. Sturdy hiking shoes are essential — the upper sections involve loose scree. The lift typically runs from June through October only.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/7/75/Vr-ezeren-pan-sm.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/e1/Rila_7_lakes_circus_panorama_edit1.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/30/Bliznakaezero.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/6/64/Okoto_Lake.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/b/bd/Езеро_Бъбрека,_Седемте_рилски_езера;_Lake_"The_Kidney",_The_Seven_Rila_lakes.jpg',
    ],
  },

  'veliko-tarnovo-fortress': {
    agency: 'balkan-trails',
    departure_country: 'Bulgaria',
    departure_city: 'Sofia',
    max_participants: 14,
    description: `Veliko Tarnovo was the capital of the Second Bulgarian Empire from 1185 to 1393 and held one of the great medieval fortifications of the Balkans — Tsarevets, a fortress citadel set on a meander of the Yantra river that loops 200 metres below on three sides, leaving only a narrow neck of land approachable from the west. This day trip from Sofia visits the citadel, the old town's tradesmen's quarter, and a panoramic viewpoint over the river bend. The drive northeast from Sofia takes about three hours, climbing gradually over the Stara Planina range. On arrival the tour begins at the gate of Tsarevets, walking the restored ramparts to the Patriarchal Cathedral of the Holy Ascension at the citadel's highest point. The cathedral's interior, repainted in the 1980s in a striking modernist style by Bulgarian artist Teofan Sokerov, is unlike anything in any other medieval church and divides visitor opinion — the guide presents both sides of the controversy. The route descends past the Baldwin's Tower, named for the Latin emperor held captive there after the Battle of Adrianople in 1205, and into the Samovodska Charshia, the working old-town craftsmen's bazaar where coppersmiths, weavers, and icon painters still operate from generations-old shops. Lunch is at a mehana, a traditional Bulgarian tavern, before a short drive to the Asen Monument viewpoint. Wear walking shoes for cobbled climbs.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/9/98/Bulgaria_Bulgaria-0960_-_Palace_Complex_(7433494368).jpg',
      'https://upload.wikimedia.org/wikipedia/commons/9/9e/Bulgaria_Veliko_Turnovo_02.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/7d/20140621_Veliko_Tarnovo_077.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/c/c2/Collage_of_views_of_VT_G.png',
      'https://upload.wikimedia.org/wikipedia/commons/f/f6/Yantra_river,Bulgaria_winter.jpg',
    ],
  },

  'athens-acropolis-tour': {
    agency: 'aegean-discoveries',
    departure_country: 'Greece',
    departure_city: 'Athens',
    max_participants: 15,
    description: `The Acropolis rock rises sharply above Athens, and standing at its base for the first time — the Parthenon framed against the sky, the city spreading in every direction — is a moment that stays with most travellers for years. This full-day tour covers both the Acropolis citadel and the Ancient Agora below, giving a layered picture of how Athenian civic and religious life intertwined. On the Acropolis you walk the Propylaea gateway, pass the small temple of Athena Nike, and spend time inside the Parthenon precinct, where a guide explains the sculptural programme and the building's long transformation from temple to church to mosque to ruin. The Erechtheion porch of the Caryatids, currently partially scaffolded, still conveys the refinement of late fifth-century BC craftsmanship. Descending via the south slope, you pass the Theatre of Dionysus — the world's oldest surviving theatre — before entering the Ancient Agora, the original civic heart of Athens. Here the remarkably preserved Temple of Hephaestus and the rebuilt Stoa of Attalos (now a museum) anchor a sprawling archaeological park where orators, philosophers, and merchants once mingled. The tour ends mid-afternoon, leaving time for the Acropolis Museum nearby. Wear comfortable shoes with grip; the marble paths are slippery when wet. Morning departure is recommended to beat both the heat and the cruise-ship crowds.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/2/2c/1029_Acropolis_of_Athens_in_Greece_at_night_Photo_by_Giles_Laurent.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/7d/View_of_the_Acropolis_of_Athens_from_Mt_Lycabettus_on_April_22%2C_2022.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/9/98/%C3%81gora_de_Atenas_03.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/56/AncientAgoraofAthensColour.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/0c/Hephaistos_Temple.JPG'
    ]
  },

  'delphi-oracle-tour': {
    agency: 'aegean-discoveries',
    departure_country: 'Greece',
    departure_city: 'Athens',
    max_participants: 20,
    description: `Perched on the southern slopes of Mount Parnassus, Delphi sits at roughly 570 metres elevation and commands a view down the Pleistos valley toward the Gulf of Corinth that has struck visitors as otherworldly since antiquity. This day trip from Athens covers the full archaeological sanctuary and the on-site museum, which together form one of the most coherent ancient Greek sites in the country. The Sacred Way winds uphill through the ruins of dozens of treasury buildings — small showcase monuments erected by city-states to display their wealth and piety — before reaching the Temple of Apollo, whose remaining columns still define the skyline of the site. Inside the temple, the adyton housed the Pythia, the priestess whose ambiguous pronouncements shaped political decisions across the Mediterranean world for nearly a thousand years. Above the temple stands the well-preserved theatre, and a further climb reaches the stadium, one of the best-preserved in Greece, where the Pythian Games were held every four years. The Delphi Archaeological Museum holds the bronze Charioteer — arguably the finest surviving large-scale bronze from classical Greece — along with the Sphinx of Naxos and a remarkable frieze from the Siphnian Treasury. The drive from Athens takes about two and a half hours each way; the day is long, so bring water and a hat for the exposed upper terraces. The site is walkable year-round, though winter snowfall occasionally closes the upper stadium path.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/d/d5/Delphi%2C_Greece_-_panoramio.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/36/Treasury_house_of_Athens_in_Delphi_%28July_2018%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/b/b6/Delphi_tholos_cazzul.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/9/9a/AurigaDelfi.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/ad/Fouilles_de_Delphes_%281902%29_%2814792888433%29.jpg'
    ]
  },

  'meteora-rock-climbing': {
    agency: 'aegean-discoveries',
    departure_country: 'Greece',
    departure_city: 'Kalambaka',
    max_participants: 8,
    description: `Meteora's sandstone pillars shoot up to 400 metres from the Thessaly plain in formations that look sculpted rather than eroded — a consequence of millions of years of river deposits compressing into conglomerate rock and then being slowly exposed by tectonic uplift. The climbing here is unlike anywhere else in Greece: routes ascend the same columns that Byzantine monks used as foundations for their cliff-top monasteries, and at the top of a pitch it is not unusual to glance across to a medieval bell tower at eye level. This one-day experience is designed for participants with basic climbing experience; absolute beginners can join with an extra morning skills session. The day starts in Kalambaka with a gear briefing and warm-up stretches, then moves to the approved climbing sectors at the base of the Great Meteoron rock group. Routes range from grade 4 to 7a (French system), with an instructor leading each pitch and a second guide managing the belay station below. After climbing, the group walks the footpath to the viewpoint above Rousanou Monastery for the panoramic late-afternoon light that photographers particularly seek out. The rock is best between March and June and again in September and October; summer heat makes afternoon climbing uncomfortable on south-facing faces. Bring a litre and a half of water, sunscreen, and close-toed shoes — climbing shoes are provided.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/7/7c/Meteora%27s_monastery_2.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/32/Great_Meteoron_Monastery_02.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/d/d7/Varlaam_Monastery%2C_Meteora.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/6/6d/Meteora_-_Rousanou_Monastery_1.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/f2/%CE%9C%CE%B5%CF%84%CE%B5%CF%89%CF%81%CE%B1_by_night.jpg'
    ]
  },

  'mount-olympus-summit': {
    agency: 'aegean-discoveries',
    departure_country: 'Greece',
    departure_city: 'Litochoro',
    max_participants: 10,
    description: `Mount Olympus, at 2,918 metres the highest point in Greece, is a genuine alpine undertaking — not a scramble to a modest summit but a two-day mountain traverse through subalpine forest, rocky ridgelines, and a final technical push to Mytikas, the true peak. The route begins at Litochoro and ascends through the Enipeas gorge, where the path climbs through beech and black pine forest before the tree line gives way to bare limestone. Day one ends at one of the two mountain refuges on the Plateau of the Muses at around 2,700 metres, where dinner and dormitory bunks are provided. Before dawn on day two, the summit group departs for the Mytikas–Skala ridge. Mytikas involves a short exposed scramble — hands on rock, no ropes required in dry conditions — across the so-called Kakoskala (bad staircase) traverse. From the summit on a clear morning, the Thermaic Gulf is visible to the east and Thessaly's flat plains stretch south. Descent returns to Litochoro via the Prionia trailhead by early afternoon. The trek is graded moderate-to-strenuous; a reasonable level of fitness is required. Bring layered clothing, as conditions on the ridge can shift from warm to cold and windy within minutes, even in summer. The season runs from mid-May through October; the refuge must be booked in advance during July and August.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/e/e8/Olympus_National_Park_30.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/8/8f/Mytikas_peak_02.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/8/88/Olympus_Mountain.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/7b/Oropediolympou.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/01/Olympus26.jpg'
    ]
  },

  'mykonos-beach-hopping': {
    agency: 'aegean-discoveries',
    departure_country: 'Greece',
    departure_city: 'Mykonos Town',
    max_participants: 12,
    description: `Mykonos has a coastline of more than a dozen distinct beaches, each with a different character — some sheltered and calm, some open to the meltemi wind, some crowded with sunbeds and bars, others barely signed and easy to have almost to yourself. This one-day guided tour uses a private minibus to move between four carefully selected beaches in sequence, starting with the morning calm at Agios Sostis on the north coast, an undeveloped sandy cove with no umbrellas for hire and no road noise. From there the route moves to the more sheltered southern shores as the afternoon wind picks up, with stops at Psarou and Platis Gialos, both of which have water-sports rentals and lunch tavernas. The final stop in late afternoon is at Paraga, where the water is clear turquoise over a sandy bottom. Between beach stops, the guide points out the distinctive Myconian dry-stone walls and windmill lines that define the island's interior landscape. Mykonos's beach season runs from late April through October, with July and August being the busiest and most expensive months; late May and early September offer good weather with noticeably fewer visitors. Bring reef shoes if you prefer rocky entries and a small dry bag for phone and valuables on boat excursions. The meltemi wind can make northern beaches choppy from midday, which is why the tour sequence runs north-to-south as the day progresses.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/2/28/Mykonos_Montage_L.png',
      'https://upload.wikimedia.org/wikipedia/commons/3/33/20100706_Mykonos_chora_port_panorama_Greece.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/5f/GR-mykonos-anomera-ort.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/1/1d/Delos_general.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/4f/Terrace_of_the_Lions_03.jpg'
    ]
  },

  'mykonos-delos-cruise': {
    agency: 'aegean-discoveries',
    departure_country: 'Greece',
    departure_city: 'Mykonos Town',
    max_participants: 20,
    description: `Delos lies just five kilometres southwest of Mykonos, a 30-minute ferry crossing that delivers you to one of the most significant archaeological sites in the Aegean. The island was considered the birthplace of Apollo and Artemis and served as the religious and commercial hub of the Cyclades for roughly a thousand years. No one has been permitted to live on or die on Delos since the sixth century BC — a decree intended to keep the sanctuary pure — and today the entire island is an open-air museum managed by the Greek Ministry of Culture. The cruise departs Mykonos harbour in the morning and the tour spends roughly three and a half hours walking the island's main excavated zones. The Sacred Harbour, the Sanctuary of Apollo, the residential quarter of Hellenistic merchants' houses, and the Terrace of the Lions — five of an original nine seated marble lions dating from around 600 BC — are the core stops. The House of Dionysus and House of Masks contain the best-preserved mosaic floors in situ on any Greek island, depicting theatrical masks and the god Dionysus riding a panther in fine polychrome tesserae. The island has no shade and no fresh water available to visitors, so carry at least two litres of water and wear a sun hat. Ferries to Delos run from approximately April to October only; the island is closed out of season. Comfortable walking shoes are essential on the uneven limestone paths.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/1/1d/Delos_general.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/4f/Terrace_of_the_Lions_03.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/8/8e/GR-delos-agora-compitaliasten.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/fe/House_of_Dionysos_01.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/33/20100706_Mykonos_chora_port_panorama_Greece.jpg'
    ]
  },

  'santorini-spa-retreat': {
    agency: 'aegean-discoveries',
    departure_country: 'Greece',
    departure_city: 'Fira',
    max_participants: 12,
    description: `Santorini's caldera was formed by one of the largest volcanic eruptions of the past ten thousand years, and the geothermal activity that shaped the island still produces warm sulphurous springs in the sea just off Nea Kameni, the active volcanic islet at the caldera's centre. This wellness day combines a boat excursion to those natural hot springs with an afternoon of treatments at a cliff-top spa in Imerovigli. The morning begins with a catamaran departure from Fira's Old Port, sailing across the caldera to moor off the orange-brown coastline of Nea Kameni. Guests swim or wade into the shallow thermal pool — the water hovers around 28–35°C depending on season and is tinged faintly yellow with sulphur — before the boat moves on to a second anchorage for a swim in open caldera water. Back on Santorini by early afternoon, the group transfers to the spa facility, where the programme includes a volcanic ash scrub, a 60-minute massage, and use of the infinity pool overlooking the caldera and the white cliff villages. The combination of geothermal bathing and manual therapies is designed to work in sequence: the minerals in the springs soften the skin and relax musculature before the massage. Bring a swimsuit, a change of clothes, and flip-flops; a light robe is provided at the spa. The boat excursion is weather-dependent and may be rescheduled during strong caldera winds (common in July and August).`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/8/83/Nea_Kameni.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/f0/Santorini_NeaKameni_tango7174.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/8/8f/GR-santorini-neakameni-krater.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/2/22/SantoriniPartialPano.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/e4/Santorini_Montage_L.png'
    ]
  },

  'santorini-volcano-kayak': {
    agency: 'aegean-discoveries',
    departure_country: 'Greece',
    departure_city: 'Akrotiri',
    max_participants: 10,
    description: `Launching from the southern shore near Akrotiri, this sea-kayaking expedition traverses the inner caldera of Santorini and reaches the volcanic islets of Nea and Palea Kameni — the still-active remnants of the eruption that collapsed the original Minoan-era island around 1600 BC. The day begins with a one-hour paddling skills session in the sheltered bay below the Red Beach cliffs, where the rust-coloured volcanic rock above the waterline gives a vivid preview of the geology ahead. Paddlers then set out across the caldera, covering roughly eight kilometres to the eastern shore of Nea Kameni. The approach by kayak allows close inspection of the low lava coastline — jagged black basalt and sulphur-yellow mineral deposits that no larger vessel can get near — and landing directly on the volcanic shore to walk up to the main crater rim. On a clear day the crater emits visible steam, and the smell of sulphur is noticeable from the rim path. The return route skirts the base of the caldera cliffs, offering upward views of Fira, Imerovigli, and Oia perched on the cliff edges 300 metres above. Total paddling distance is approximately 16 kilometres; participants should be comfortable swimmers and have reasonable upper-body fitness. The season runs May through October; the window between 7 and 11 in the morning typically offers the calmest water before the afternoon caldera winds develop.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/8/83/Nea_Kameni.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/f0/Santorini_NeaKameni_tango7174.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/8/8f/GR-santorini-neakameni-krater.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/06/Santorini_ASTER.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/2/22/SantoriniPartialPano.jpg'
    ]
  },

  'santorini-wine-tour': {
    agency: 'aegean-discoveries',
    departure_country: 'Greece',
    departure_city: 'Fira',
    max_participants: 14,
    description: `Santorini's vineyards look unlike any others in the world: the vines are trained into low basket shapes called koulouri, spiralling close to the ground so the fruit hangs inside the coil, protected from the island's fierce winds and able to capture morning moisture from the volcanic ash soil. The island's native Assyrtiko grape produces dry whites with a mineral acidity that comes directly from the pumice and volcanic ash beneath the vines, and Santorini's wines have been recognised with a Protected Designation of Origin since 1971. This day tour visits three distinct wineries across the island's central plateau, moving between the traditional cooperative at Pyrgos, a boutique estate above the village of Megalochori, and a caldera-view tasting room near Akrotiri. At each stop, the winemaker or estate manager leads a guided tasting of four to six wines — predominantly Assyrtiko in its various styles, from bone-dry to the dessert wine Vinsanto, made from sun-dried grapes. Lunch at the second winery features mezedes designed to accompany the wines: fava from the island's yellow split peas, cherry tomatoes grown in the volcanic soil, and locally cured capers. The tour moves by private minibus between estates. Those who are sensitive to heat should note that the harvest and crushing period in late August and early September gives the most vivid sense of active production, though tastings run throughout the season from April to November.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/6/60/Asirtiko_Athiri_from_Santorini.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/b/bc/Bush_training_of_unstaked_Greek_grape_vines.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/d/dd/Santorini-South_local-viticulture_Aegean-Sea_Greece.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/f7/Akrotiri_Grapes_on_Rooftop-_Santorini.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/76/Santorini_red_beach.jpg'
    ]
  },

  'vikos-gorge-zagori': {
    agency: 'aegean-discoveries',
    departure_country: 'Greece',
    departure_city: 'Ioannina',
    max_participants: 12,
    description: `The Vikos Gorge in the Zagori region of Epirus holds the distinction, in the Guinness records, of being the world's deepest gorge relative to its width — the walls drop up to 900 metres from the rim while the gorge floor is in places only a few hundred metres across. This two-day trek traverses the full length of the gorge from Monodendri to Papingo, covering roughly 14 kilometres of riverside path with an overnight stay in one of the stone-built guesthouses of Megalo Papingo. Day one begins in Ioannina with a transfer to Monodendri, a village that functions as the main southern entry point. The descent into the gorge follows a kalderimi — a traditional cobbled mule path — that drops steeply to the Voidomatis River, one of the clearest rivers in Europe, fed entirely by springs and snowmelt. The canyon floor walk passes overhanging cliffs of grey Jurassic limestone, stretches of plane and maple forest, and seasonal waterfalls. The Papingo rock pools, where the river broadens into natural swimming holes, are a standard lunch stop. Overnight at Papingo allows an evening walk to the Astraka plateau above the village, where views extend across to the Gamila massif. Day two crosses the lower gorge and loops back via the Beloi viewpoint, which offers the classic top-down photograph of the gorge's full depth. The trek is manageable for fit walkers; trekking poles are strongly recommended for the steep descents. Spring snowmelt (April–May) fills the river and makes the path particularly photogenic.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/c/cd/Vikos_Gorge_from_Beloe.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/b/be/Vikos-gorge.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/8/82/Voidomatis_River%2C_Epirus%2C_Greece.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/e7/Zagori_Dragonlake_and_Gamila_summit.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/9/91/Skamneli_village_centre.jpg'
    ]
  },

  'corfu-old-town-tour': {
    agency: 'cretan-trails',
    departure_country: 'Greece',
    departure_city: 'Corfu Town',
    max_participants: 15,
    description: `Corfu Town's Old Town is one of the best-preserved Venetian-era settlements in the Mediterranean, inscribed on the UNESCO World Heritage List in 2007, and a full day exploring it on foot reveals layer upon layer of Venetian, French, and British colonial architecture pressed into a compact peninsula. The tour begins at the New Fortress — a Venetian construction of the 1570s built on a promontory north of the harbour — whose star-shaped bastions and underground cisterns are among the finest examples of Renaissance military engineering in Greece. From there the route moves through the narrow covered streets of the kantoúnia, the labyrinthine lanes of the old town that slope downhill toward the Spianada, Europe's second-largest public square. The Liston arcades running along its western edge were commissioned during the French occupation in imitation of the Rue de Rivoli in Paris. The Old Fortress, on a separate promontory connected by a drawbridge, houses a small Byzantine museum and offers a wide view of the Albanian coast. Saint Spyridon Church — dedicated to the island's patron saint whose mummified body is kept in a silver reliquary — is one of the most venerated Orthodox churches in Greece and is visited mid-tour. The afternoon traces the Jewish quarter and the Venetian-era arsenal district before ending at a seafront café in the Old Harbour. Corfu Town is walkable year-round; October through April the crowds thin considerably and the Venetian architectural details are easier to examine without queues.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/e/e9/20100728_Corfu_island_old_town_panoramic_Greece.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/8/8e/Corfu_citadel.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/c/cf/Corfu_town_houses.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/b/b8/Saint_Spyridon_church_Korfu.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/53/Corfu_Town_Hall_R01.jpg'
    ]
  },

  'corfu-yoga-retreat': {
    agency: 'cretan-trails',
    departure_country: 'Greece',
    departure_city: 'Corfu Town',
    max_participants: 10,
    description: `Corfu's interior is a landscape of dense olive groves, cypress trees, and stone-walled Venetian estates that most visitors never see because the island's beach resorts occupy the coast almost entirely. This three-day retreat is based at a hillside property in the village of Pelekas, roughly 12 kilometres from Corfu Town, using the property's terraced gardens and a covered outdoor platform as the primary practice spaces. Each day follows a structure of morning yoga (90 minutes, starting at 7:30 to catch the cooler hours), a group breakfast with local produce, and an afternoon activity that varies by day: on day one, a guided walk through the olive groves to a Venetian water cistern; on day two, a private boat excursion along the northwest coast to Paleokastritsa, where the turquoise water in the sheltered bays is some of the clearest on the island; on day three, a visit to the Old Town with free afternoon time. Evening sessions are shorter — 60 minutes of restorative or yin practice — followed by a communal dinner. The yoga programme is designed for practitioners with some prior experience; beginners are welcome with prior discussion. The retreat is intentionally small to keep group dynamics conducive to quiet and focus. Corfu's climate makes this kind of programme viable from April through October; spring and early autumn are preferable for those who find intense heat disruptive to practice. Bring your own mat if you have a preferred brand; mats are available on site.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/4/44/Pontikonisi.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/42/Corfu_town.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/e9/20100728_Corfu_island_old_town_panoramic_Greece.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/a5/Corfu_Achilleion_R05.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/e0/Corfu_Mon_Repos_R01.jpg'
    ]
  },

  'crete-olive-oil-raki': {
    agency: 'cretan-trails',
    departure_country: 'Greece',
    departure_city: 'Heraklion',
    max_participants: 12,
    description: `Crete produces roughly a third of all Greek olive oil, and the island's food culture — one of the most studied in the world for its health characteristics — is inseparable from the olive grove, the press, and the kitchen table. This day experience departs Heraklion for the agricultural belt south of the city, visiting a working multi-generational olive farm near the village of Houdetsi. The morning begins with a walk through the groves, where some trees are several hundred years old, and a practical explanation of the different harvest techniques and their effect on oil quality. At the estate's stone-built press room, a miller demonstrates the cold-press extraction process, and guests taste oils pressed from three different olive varieties — Koroneiki, Manaki, and Tsounati — at varying stages of ripeness, developing an understanding of how harvest timing determines flavour. The afternoon moves to a traditional Cretan home kitchen in a nearby village, where a local family leads a hands-on cooking session preparing dakos (barley rusk with tomato and feta), stuffed courgette flowers, and slow-braised lamb with artichokes. The meal concludes with a tasting of tsikoudia, the Cretan grape pomace spirit also known as raki, produced in the family's own copper still. Guests leave with a small bottle of cold-pressed oil and the session's recipes. The experience runs year-round; the olive harvest season, typically October through January, adds a working press and freshly milled oil to the visit.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/5/50/OliveGroveKritsa.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/2/2a/Ofto_%28cretan_roast_meat%29_or_Antikristo_%28cretan_roasted_meat_around_the_fire%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/5a/SnailsInTomatoFromCrete.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/9/92/Kazani_amira2.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/c/c5/Flag_harbour_Chania_Crete_Greece.jpg'
    ]
  },

  'rhodes-lindos-beach': {
    agency: 'cretan-trails',
    departure_country: 'Greece',
    departure_city: 'Rhodes Town',
    max_participants: 15,
    description: `Lindos sits on the east coast of Rhodes about 50 kilometres south of the capital, and the approach by road reveals the setting in stages: first the whitewashed houses of the village climbing the hillside, then the medieval walls of the Knights of St John fortification, and above them the ancient acropolis rising to 116 metres above sea level with a sheer drop to the sea on three sides. This day tour from Rhodes Town combines the archaeological and medieval heritage of the acropolis with time on Lindos beach, one of the most sheltered and swimmable on the island. The morning is devoted to the acropolis, reached on foot up the stepped lane through the village — the narrow streets are too tight for vehicles — or by donkey for those who prefer. At the top, the Doric Temple of Athena Lindia, dating from the fourth century BC, occupies the highest point, with views extending on a clear day to the Turkish coast 18 kilometres away. The medieval Governors Palace and the Crusader Church of St John occupy the lower terrace. The afternoon is spent on the double bay below the village: the main Lindos beach faces northeast and is sheltered, with calm water and a long sandy bottom suitable for swimming and snorkelling. A second smaller beach on the south side of the headland, accessed through the village, tends to be quieter. The bus back to Rhodes Town departs in late afternoon. Summer temperatures in Lindos regularly reach 35°C by midday; a morning start and light cotton clothing are advisable.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/e/e9/20210826-Lindos-DJI_0205.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/d/d7/Lindos_View_of_the_Acropolis_and_town_from_the_north-east._Rhodes%2C_Greece.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/8/8a/Lindos_the_anciet_ship.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/b/bd/Ancient_Greek_theatre_in_Lindos_01.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/6/64/Rhodos_Lindos_Panagia_Church_R01.jpg'
    ]
  },

  'samaria-gorge-hike': {
    agency: 'cretan-trails',
    departure_country: 'Greece',
    departure_city: 'Chania',
    max_participants: 15,
    description: `The Samaria Gorge in the White Mountains of western Crete is one of the longest walkable gorges in Europe, running 16 kilometres from the mountain village of Xyloskalo down to the Libyan Sea at the coastal settlement of Agia Roumeli. The descent loses roughly 1,250 metres in elevation, moving through a national park established in 1962 that protects the habitat of the Cretan wild goat, the kri-kri, as well as endemic plant species found nowhere else in the world. The hike begins with a steep descent on a wide zigzagging path through pine and cypress forest, gradually steepening as the canyon walls close in. By mid-gorge the trail passes through the narrows known as the Sideroportes — Iron Gates — where the vertical walls are only three to four metres apart and rise nearly 300 metres overhead, and a small stream runs across the path. The abandoned village of Samaria, halfway through, has a small church and rest area beneath enormous plane trees. The final stretch opens into a broader valley before reaching Agia Roumeli, where the only exit is by boat — a ferry runs along the coast to Hora Sfakion, from which the transfer back to Chania departs. The total walking time is six to eight hours depending on pace. Trekking poles ease the steep initial descent; the path is predominantly rocky throughout. The gorge is open to hikers from approximately May 1st to October 31st; early morning departure from Chania avoids the midday heat in the lower canyon.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/5/55/Walkers_in_the_Samari%C3%A1_Gorge_-_2022-07-25.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/00/Samaria_park001.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/d/d5/Samaria2r.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/4f/Samaria_park002.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/39/Crete-Samaria.jpg'
    ]
  },

  'zakynthos-blue-caves': {
    agency: 'cretan-trails',
    departure_country: 'Greece',
    departure_city: 'Zakynthos Town',
    max_participants: 12,
    description: `The Blue Caves of Zakynthos are a series of sea caverns carved into the white limestone cliffs of Cape Skinari on the island's northern tip, named for the extraordinary refraction of light through the shallow turquoise water that fills their lower sections — the effect turns the cave interiors an intense electric blue that photographs and in-person experience render equally vivid. This full-day boat cruise from Zakynthos Town heads north along the island's western coastline before rounding the cape to access the caves, which are only reachable by small motorised rowboat from the main excursion vessel. Rowers take groups of four to five inside each cave, where the ceiling drops low and the water glows from below, the sandy bottom visible through three to five metres of clear water. After the caves, the main vessel continues south to Navagio Bay — also known as Shipwreck Beach — one of the most reproduced coastal images in Greece: a white sand cove completely enclosed by vertical chalk cliffs, accessible only by sea, with the rusting hull of the MV Panagiotis freighter (stranded in 1980) lying at the water's edge. Navagio is the highlight for most participants, and the boat anchors for a 90-minute swim stop. The return journey along the western coast includes a third anchorage at a sea cave near Porto Vromi for snorkelling. Bring a mask and snorkel, a waterproof camera if possible, and a light towel; the boat provides shade but no changing facilities. The cruise operates May through October.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/d/d3/Navagio%2C_Zante_01.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/2/2a/Navagio%2C_Zante_02.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/d/d0/Navagio_beach_Zakynthos.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/b/b5/Navagio_%22Shipwreck%22_Beach_aerial_%2844653856390%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/e2/Zakintos_-_panorama.jpg'
    ]
  },
  'amalfi-cliff-diving': {
    agency: 'italia-boutique',
    departure_country: 'Italy',
    departure_city: 'Amalfi',
    max_participants: 10,
    description: `The limestone cliffs of the Amalfi Coast plunge straight into the Tyrrhenian Sea, and this one-day adventure puts you at the edge of them. Departing from the harbour town of Amalfi, the tour travels by small motorboat along the coastline to a sequence of cliff-jumping spots ranging from three to twelve metres above the water, with a certified guide assessing conditions at each platform before any jump is made. Between sessions in the water, participants snorkel through sea caves and swim in coves sheltered from boat traffic, where the water shifts from pale turquoise to deep cobalt depending on depth. A mid-morning stop at a rocky terrace allows the group to rest, eat a packed lunch, and take in the layered cliffs and whitewashed villages clinging to the slopes above. The guide covers the history of the Maritime Republic of Amalfi, once one of the four great naval powers of medieval Italy, whose paper-making and trading traditions still mark the town today. On the return leg the boat passes beneath the village of Positano so participants can see the coast from the perspective that most visitors never reach. Wear a swimsuit under your clothes, bring a towel, reef-safe sunscreen, and water shoes with a rubber sole; a wetsuit top is provided for cooler months. The tour runs from late April through October, with morning departures timed to avoid midday wind.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/3/3d/Amalfi_Coast_%28Italy%2C_October_2020%29_-_75_%2850558355441%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/b/b7/Sentier_des_dieux-Positano-gb.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/0/05/Amalfi_Coast_from_boat.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/f9/Amalfi_panorama_I.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/08/Amalfi_sea_view_Italy.JPG',
    ],
  },

  'cinque-terre-trail': {
    agency: 'italia-boutique',
    departure_country: 'Italy',
    departure_city: 'La Spezia',
    max_participants: 12,
    description: `The five villages of Cinque Terre sit like coloured building blocks stacked against vertical cliffs above the Ligurian Sea, and the coastal trail connecting them is one of the most visually varied walks in Italy. The tour begins with a short train ride from La Spezia to Riomaggiore, the southernmost village, where the guide introduces the geology of the coastline and the terraced vineyard system that earned the area UNESCO World Heritage status in 1997. The group then walks north through Manarola, Corniglia, Vernazza, and Monterosso al Mare, pausing at each village for a short exploration of the harbour, the medieval tower, or the local anchovies and lemon granita that define the food culture here. The trail itself alternates between well-paved sections and rougher stone paths cut into the cliff face, with total elevation gain of around 500 metres spread across the full route. At Vernazza the group stops for lunch overlooking the natural harbour, one of the most photographed spots along the entire Ligurian coast. The guide points out the dry-stone retaining walls — largely hand-built and maintained by local families — that prevent the terraces from slipping into the sea. Wear sturdy closed-toe shoes, bring at least one and a half litres of water per person, and pack a light rain layer for the exposed ridgeline sections. The tour runs year-round, with spring and autumn offering the most comfortable temperatures and the best light for photography.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/7/70/Cinque_Terre_%28Italy%2C_October_2020%29_-_24_%2850543603956%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/2/2f/Terraces_Manarola_Volastra_Cinque_Terre_Sep23_A7C_06874.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/a0/Monterosso_CinqueTerre.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/0/0f/1_vernazza_2012.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/76/Riomaggiore_From_Ferry_Cinque_Terre_Italy_Sep23_A7C_07414.jpg',
    ],
  },

  'pompeii-herculaneum': {
    agency: 'italia-boutique',
    departure_country: 'Italy',
    departure_city: 'Naples',
    max_participants: 14,
    description: `On the morning of 24 August 79 AD, the eruption of Vesuvius buried two thriving Roman towns under metres of volcanic material, and this full-day tour from Naples takes you through both of them. The itinerary opens at Pompeii, where the group enters through the Porta Marina gate and moves through the Forum, the amphitheatre, the thermal baths, and several well-preserved private houses, including the House of the Faun with its famous mosaic floor replica still in situ. The licensed guide explains daily life in a Roman commercial city — the bread ovens, the electoral slogans painted on walls, the stepping stones set into streets designed to keep feet clear of runoff. After approximately three hours at Pompeii the group travels the short distance to Herculaneum, the smaller and in many ways better-preserved of the two sites. Because Herculaneum was sealed by a surge of volcanic material rather than ash, wooden furniture, carbonised food, and painted walls survived in conditions impossible at Pompeii. The guide draws direct comparisons between the two sites to show the range of Roman urban life from a wealthy resort town to a working commercial centre. The tour includes skip-the-line entry at both sites. Comfortable flat shoes are essential on the uneven basalt streets; a hat and sun protection are strongly advised for the exposed sections of the Pompeii site, particularly between June and September.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/6/68/Pompeii_Forum.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/d/d4/Theathres_of_Pompeii.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/ec/Karl_Brullov_-_The_Last_Day_of_Pompeii_-_Google_Art_Project.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/47/Antigua_ciudad_de_Herculano%2C_Italia%2C_2023-03-27%2C_DD_135-138_PAN.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/74/Affreschi_romani_-_Ercolano_-_Teseo_liberatore1.JPG',
    ],
  },

  'rome-colosseum-vatican': {
    agency: 'italia-boutique',
    departure_country: 'Italy',
    departure_city: 'Rome',
    max_participants: 15,
    description: `Rome holds two of the most visited monuments on earth within a single day's walk of each other, and this tour is designed to do both without the queue fatigue that independent visitors typically face. The day begins at the Colosseum, the 50,000-seat Flavian amphitheatre completed in 80 AD, where the guide leads the group through the arena floor level, the hypogeum corridors beneath, and the upper tier to explain the engineering and the social mechanics of Roman public spectacle. From there the route passes the Arch of Constantine and the Roman Forum before crossing the city to Vatican Hill. At St. Peter's Square the group takes in the scale of Bernini's colonnade before entering the Basilica, where the guide covers the architectural evolution from the original fourth-century church through Michelangelo's dome to the baroque interior as it stands today. The Pietà, the bronze baldachin, and the papal tombs each receive dedicated attention. The tour includes pre-booked skip-the-line entry to both the Colosseum and the Basilica, an audio headset system so commentary carries clearly in crowded spaces, and a mid-day break near Campo de' Fiori. Comfortable walking shoes are essential — the day covers roughly eight kilometres on foot across cobblestone and marble surfaces.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/d/de/Colosseo_2020.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/1/12/Colosseum_exterior,_inner_and_outer_wall_AvL.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/f5/Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/f7/Saint_Peter%27s_Square_-_Pan_by_Andrew_Magill_2007.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/1/11/St._Peter%27s_Basilica_Rome_-_20140808_2350.jpg',
    ],
  },

  'sardinia-boat-tour': {
    agency: 'italia-boutique',
    departure_country: 'Italy',
    departure_city: 'Olbia',
    max_participants: 10,
    description: `The Costa Smeralda stretches roughly 55 kilometres along the northeastern coast of Sardinia, and its combination of white sand, granite outcrops, and water that reads as transparent from the air makes it one of the few stretches of Mediterranean coastline that genuinely matches its reputation. This full-day boat tour departs from Olbia and moves north along the coast, stopping at a succession of beaches and protected coves that are unreachable by road. The first anchorage is typically off the Liscia Ruja beach, where the group swims and snorkels over posidonia meadows and rocky reef sections alive with sea bream, octopus, and wrasse. A second stop near the Maddalena Archipelago allows exploration of a channel between two granite islands where tidal movement creates natural currents the guide uses to point out the geology of the area. Lunch is served on board — fresh focaccia, local cheeses, cherry tomatoes, and cold cuts from the Gallura region — while the boat anchors in a sheltered bay. The afternoon includes a passage past Porto Cervo, the marina village developed in the 1960s by the Aga Khan IV as the centrepiece of the Costa Smeralda resort, visible from the water in its full architectural oddness. Bring a towel, reef-safe sunscreen, and a light cover-up for the return leg when sea breezes pick up; snorkelling equipment is provided on board.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/e/e0/Costa_Smeralda_1.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/41/Three_luxury_yachts_-_Lady_Anne%2C_Lady_Moura_and_Pelorus.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/af/Porto_Cervo1.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/d/d6/Harrods_Porto_Cervo.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/4/45/Porto_Cervo_-_The_Port.jpg',
    ],
  },

  'tuscany-cooking-class': {
    agency: 'italia-boutique',
    departure_country: 'Italy',
    departure_city: 'Florence',
    max_participants: 12,
    description: `Thirty kilometres south of Florence the Chianti hills give way to a working farm where this full-day cooking class and farm visit takes place, and the experience is built around the ingredients that define Tuscan cuisine rather than the dishes themselves. The day opens with a walk through the estate's kitchen garden and olive grove, where the host explains the rhythm of the agricultural year and how it determines what appears on the table — cavolo nero and ribollita in winter, panzanella and raw broad beans in spring, wild boar and porcini from autumn. Back in the farmhouse kitchen, participants work in pairs on a three-course menu that typically includes a hand-rolled pasta such as pici, a braise using cuts from the estate's Chianina cattle or Cinta Senese pigs, and a cantucci biscuit to accompany the vin santo poured at the end. The class moves at a pace that allows questions and conversation rather than rushing through techniques. After cooking, the group eats together at a long table in the courtyard or, in cooler months, in the vaulted dining room. The host explains the difference between filtered and unfiltered olive oil using the estate's own production, and guests leave with a small bottle. A light lunch is provided at midday during the farm walk; the main meal is the one you cook. Wear comfortable clothes you don't mind getting flour on, and arrive with an appetite.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/1/12/Bistecca_alla_fiorentina-01.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/59/Spaghetti_vongole_2.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/6/66/Fiasco_di_vino_rosso_da_tavola_Monteriggioni.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/c/cb/Finocchiona_from_Tuscany.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/b/b3/I_cipressi_della_Val_D%27Orcia.jpg',
    ],
  },

  'tuscany-thermal-baths': {
    agency: 'italia-boutique',
    departure_country: 'Italy',
    departure_city: 'Siena',
    max_participants: 14,
    description: `The thermal springs at Saturnia have been flowing from the same volcanic source for thousands of years, and the Cascate del Mulino — a series of natural travertine pools on the Gorello stream just below the town — remain free and open to anyone who arrives at the water's edge. This day escape from Siena covers the 90-kilometre drive south through the Maremma, Tuscany's least visited and most sparsely inhabited province, arriving at the pools in mid-morning before the midday crowd. Participants soak in water that emerges at a constant 37.5 degrees Celsius and carries high concentrations of sulphur, carbon dioxide, and minerals that have been used for therapeutic purposes since Etruscan and Roman times. The guide walks the group through the geological background of the Saturnia caldera and the history of the spa town above, which still contains Roman-era walls and a small archaeological museum. The itinerary includes time to visit the hilltop village of Saturnia itself — the medieval church, the Etruscan gateway stones set into later Roman construction, and a local trattoria for lunch. The afternoon returns to the lower pools for a second soak as the light shifts and the steam from the water becomes visible against the hillside. Bring a swimsuit, flip-flops for the rocky approach to the pools, two towels, and old clothes you don't mind smelling faintly of sulphur on the drive back.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/4/41/Saturnia_Cascate_del_Mulino.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/9/99/Saturnia_hot_stream_in_June_2004.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/1/15/Cascate_del_Gorello_a_Saturnia.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/00/Saturnia%2C_chiesa_di_santa_maria_maddalena_00.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/e/ea/Sunflowers_in_bloom_-_Maremma_Toscana_-_Italy_-_25_June_2005.jpg',
    ],
  },
  'antalya-gulet-cruise': {
    agency: 'anatolian-routes',
    departure_country: 'Türkiye',
    departure_city: 'Antalya',
    max_participants: 12,
    description: `The Turquoise Coast around Antalya unfolds from the deck of a traditional wooden gulet as the boat threads between sea caves, pine-covered headlands, and secluded bays that have no road access. Departing from Antalya's Roman-era harbour, the two-day cruise heads west along a coastline that once served Lycian and later Ottoman maritime traders. On the first afternoon travellers drop anchor in a sheltered cove for swimming and snorkelling over Posidonia seagrass meadows; the water is clear enough to make out the sandy bottom at six metres. A cook on board prepares meals with local catch, mezze spreads of roasted peppers, white cheese, and herb salads eaten at the stern table as the sun drops toward Olympos. The second morning brings a slow motor past the ruins at Phaselis, visible from the water as crumbling stone piers extending into the shallows. Guests can wade ashore from the ship's dinghy and walk the pine-shaded ancient street for an hour before the gulet continues to a final bay for a long swim before returning to port. The cruise runs April through October; bring a light layer for evenings at sea even in summer, reef-safe sunscreen, and shoes that can get wet when boarding the dinghy.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/7/73/Falezlerden_Antalya_Konyaaltı_Plajına_doğru_bir_görünüm.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/06/Hadrian%E2%80%99s_Gate%2C_Antalya%2C_Turkey_-_View_Feb_2022.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/1/17/Lower_Düden_Waterfall.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/d/d4/Gulet_%22queen_of_dat%C3%A7a%22_%2815623421245%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/6/6e/Turkey.Bodrum023.jpg',
    ],
  },

  'cappadocia-balloon-ride': {
    agency: 'anatolian-routes',
    departure_country: 'Türkiye',
    departure_city: 'Göreme',
    max_participants: 16,
    description: `Cappadocia looks unlike anywhere else on earth, and the perspective from a hot-air balloon at dawn makes that strangeness fully legible: a landscape of eroded tufa carved into fairy chimneys, cone-shaped pillars, and cave-riddled valleys stretching in every direction below the gondola. The flight launches from the fields near Göreme roughly an hour before sunrise, when the wind is most stable and the valley floors hold a cool mist that burns off as the balloon climbs. Pilots navigate over Rose Valley, the Sword Valley, and the Love Valley, adjusting altitude to skim close to rock formations or to rise high enough to see the entire Göreme Open-Air Museum and the distant volcanic peak of Mount Erciyes. The flight lasts approximately sixty to ninety minutes and covers terrain that would take a full day to hike. On landing, a traditional toast with juice and pastries marks the end of the flight before the transfer back to Göreme. The season runs from March to November, though spring mornings offer the clearest air; bring a light jacket as temperatures above the valleys can be noticeably cooler than ground level, and keep a camera accessible rather than packed away.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/5/59/Cappadocia_balloon_trip%2C_Ortahisar_Castle_%2811893715185%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/31/Cappadocia_Aerial_View_%286998755984%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/7d/U%C3%A7hisar%2C_Cappadocia_01.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/2/27/G%C3%B6reme_Open_Air_Museum_%28cropped%29_%28cropped%292.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/05/Wild_horses1_%28cropped%29.jpg',
    ],
  },

  'ephesus-ancient-city': {
    agency: 'anatolian-routes',
    departure_country: 'Türkiye',
    departure_city: 'Selçuk',
    max_participants: 14,
    description: `Ephesus was once the second-largest city in the Roman Empire, and walking its marble-paved streets today still communicates something of that scale — colonnaded avenues, a theatre that seated twenty-five thousand, and the two-storey Library of Celsus whose carved facade remains one of the most photographed monuments in Türkiye. The full-day tour departs from Selçuk and enters the site through the upper Magnesian Gate, walking downhill so that the city's layout becomes progressively clearer as the group descends toward the harbour road. A guide introduces the residential terrace houses, where excavated wall paintings and mosaic floors are protected under a climate-controlled shelter and reveal how wealthy Ephesians actually lived. The Temple of Hadrian, the public latrines, and the Odeon agora each receive focused stops before the group reaches the Great Theatre. After the main site the tour includes the Selçuk Ephesus Museum, where finds such as the Artemis cult statues and Roman portrait busts provide context that the open-air ruins cannot. The site is visited year-round; comfortable walking shoes with grip are essential as the marble paving becomes slippery when wet, and a hat plus water are strongly advisable from May onward.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/8/84/Ephesus_Celsus_Library_Façade.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/b/b2/Ephesus_street_scene.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/02/The_Temple_of_Hadrian_%2816127691050%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/c/cb/Ephesos_amphitheatre.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/f3/Templo-Artemisa-Efeso-2017.jpg',
    ],
  },

  'istanbul-bazaar-walk': {
    agency: 'anatolian-routes',
    departure_country: 'Türkiye',
    departure_city: 'Istanbul',
    max_participants: 10,
    description: `Istanbul's Grand Bazaar is not merely a market but a covered city within a city, with sixty-one streets, more than four thousand shops, and a continuous trading history stretching back to 1461 — and the Spice Bazaar a ten-minute walk away adds an entirely different register of colour and smell to the same morning. The tour begins at the Grand Bazaar's Nuruosmaniye Gate, where a guide orients the group to the bazaar's geography before leading it into the goldsmiths' corridor, the carpet halls, and the Sandal Bedesten, an inner vaulted chamber that once held the most valuable textiles arriving from the East. The guide explains the historic han structure of the bazaar and points out surviving Ottoman-era caravanserai architecture embedded within the market complex. After ninety minutes in the Grand Bazaar the group walks through Tahtakale to the Spice Bazaar beside the Golden Horn, where stalls sell dried fruits, spice blends, Turkish delight, and helva alongside medicinal herbs that have been traded here since the seventeenth century. Time is left for independent browsing and tea in one of the courtyard cafés. The tour operates daily; dress modestly as both bazaars are in a neighbourhood with active mosques, and keep a hand on bags in the more crowded aisles.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/d/de/Istanbul_asv2021-11_img41_Grand_Bazaar.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/07/Grand_Bazaar_Istanbul_-_panoramio.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/9/9f/Gran_Bazar,_Estambul,_Turquía,_2024-09-29,_DD_04.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/6/68/Spice_Bazaar_Istanbul_Feb_2020%2C_img_2.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/2/24/Dried_chillies_in_Spice_Bazaar_Istanbul.jpg',
    ],
  },

  'istanbul-street-food': {
    agency: 'anatolian-routes',
    departure_country: 'Türkiye',
    departure_city: 'Istanbul',
    max_participants: 8,
    description: `Istanbul's street food culture is layered across the city's neighbourhoods, and this crawl moves through four of them in a single day, eating at the stalls, small shops, and market counters where the food has been prepared the same way for generations. The route begins in Eminönü at the Galata Bridge fish sandwich boats, where mackerel is grilled on rocking platforms and tucked into bread with onion and parsley, before moving inland to Kapalıçarşı's periphery for a mid-morning simit — the sesame-crusted ring bread that is Istanbul's most democratic food. In Karaköy the group samples kokoreç, a crisply grilled offal wrap, alongside cheese börek from a neighbourhood fırın. Afternoon takes the group across the Galata Bridge to Balıkpazarı in Beyoğlu for lakerda, cured bonito, and pickled vegetables eaten standing at marble counters. A final stop covers Turkish sweets: fresh baklava from a pastry shop that makes it on the premises, and a glass of ayran to balance the richness. A guide explains the Ottoman, Byzantine, and Anatolian threads woven through each dish. Come hungry, wear comfortable shoes for cobblestones, and note that some stops involve standing at outdoor counters.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/2/25/D%C3%B6ner_kebap.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/51/Baklava_1.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/9/97/MenemenIstanbul.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/1/1e/Sigara_B%C3%B6rek.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/c/cb/Historical_peninsula_and_modern_skyline_of_Istanbul.jpg',
    ],
  },

  'lycian-way-trek': {
    agency: 'anatolian-routes',
    departure_country: 'Türkiye',
    departure_city: 'Fethiye',
    max_participants: 10,
    description: `The Lycian Way runs five hundred kilometres along the southwestern coast of Türkiye, and this four-day trek takes in one of its most varied sections — departing from Fethiye and following clifftop paths, ancient stone-paved mule tracks, and pine forest trails that connect ruined Lycian cities with hidden lagoons and working fishing villages. Each day covers between twelve and eighteen kilometres with significant elevation change, the path often passing directly through sites like Pydnai, Sidyma, or the acropolis above Kayaköy, the ghost village abandoned after the 1923 population exchange. Nights are spent at family-run pansiyons or small hotels in villages along the route, with dinners of local produce — olive oil, goat cheese, freshwater trout, and seasonal vegetables. On day three the trail descends to the Blue Lagoon at Ölüdeniz, where walkers can swim before continuing to camp or a pension above the bay. The section through Butterfly Valley on the final day follows a narrow ledge path above a dramatic canyon. The route is walkable October through May; summers are hot and water sources unreliable. Bring trekking poles, a two-litre water capacity, trail shoes with ankle support, and cash for village accommodation.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/3/39/The_Lycian_Way_-_2014.10_-_panoramio.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/aa/Lician_Way5.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/4d/Butterfly_Valley%2C_Fethiye.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/ec/Blue_Lagoon_-_2014.10_-_panoramio.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/b/bc/Lyciawaymap.png',
    ],
  },

  'pamukkale-thermal-pools': {
    agency: 'anatolian-routes',
    departure_country: 'Türkiye',
    departure_city: 'Denizli',
    max_participants: 14,
    description: `Pamukkale's white travertine terraces are formed by calcium-rich thermal water that has been cascading down the hillside for millennia, leaving behind a series of shallow, pale blue pools that visitors can wade through barefoot — an experience that is both visually disorienting and physically soothing. The day trip from Denizli begins at the base of the terraces at opening time to avoid midday heat and crowds, ascending slowly through the lower pools where the water temperature hovers around thirty-five degrees Celsius. The route continues to the plateau above, which holds the excavated ruins of Hierapolis, a Greco-Roman spa city founded in the second century BCE. Highlights here include the necropolis — one of the largest surviving ancient cemeteries in Türkiye, with hundreds of tumuli and sarcophagi scattered across a wide hillside — and the restored theatre, whose stage building still carries carved relief panels. The Antique Pool, fed by the same thermal spring that built the terraces, allows swimming among submerged Roman column fragments. Afternoon time is free to linger on the terraces or in the pool before the return to Denizli. Shoes must be removed before walking the terraces; bring a small dry bag for valuables when using the thermal pool, and a change of clothes.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/d/de/Pamukkale_30.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/a8/PamukkaleView.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/31/Pamukkale_56.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/8/8d/Hierapolis_01.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/51/Frontinus_Street_extending_in_the_north-south_direction_of_the_city%2C_Hierapolis%2C_Phrygia%2C_Turkey_%2831528771814%29.jpg',
    ],
  },

  'turkish-hammam-spa': {
    agency: 'anatolian-routes',
    departure_country: 'Türkiye',
    departure_city: 'Istanbul',
    max_participants: 8,
    description: `The Çağaloğlu Hamam in Istanbul's historic peninsula has operated continuously since 1741, and a visit there remains one of the more direct ways to experience a social institution that shaped Ottoman urban life for centuries. The day begins with an orientation walk through Sultanahmet to the hamam's main entrance, where a guide explains the building's architectural logic — the cold room, warm room, and hot room sequence, the domed hararet with its marble göbektaşı central platform and star-shaped oculi that filter daylight, and the separate wings that historically served men and women. Guests then undress in the camekân, the vaulted changing hall with private cubicles, before progressing through the temperature sequence at their own pace. The classic kese scrub, performed by a tellak attendant using a rough mitt, removes a visible layer of dead skin; a foam massage follows. Time in the warm room after the treatment allows complete stillness in a setting that has seen little structural change in nearly three centuries. The tour also visits a second, working-neighbourhood hamam in Balat for contrast before returning. Bring or buy a cotton peştemal wrap at the door; do not eat heavily beforehand; the full experience including treatment runs approximately two and a half hours.`,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/0/06/Istanbul_Cagaloglu_hamami_entrance.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/45/Bath_of_Roxelane_Istanbul_2007.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/1/13/Ali_Gholi_Agha_hammam%2C_Isfahan%2C_Iran.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/c/cb/Historical_peninsula_and_modern_skyline_of_Istanbul.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/ad/Galata_tower_01_23.jpg',
    ],
  },
};
