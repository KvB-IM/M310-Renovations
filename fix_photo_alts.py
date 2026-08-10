#!/usr/bin/env python3
"""One-time corrective patch: several portfolio filenames do not match the actual
photo contents (e.g. 1135-crestview-kitchen-ovens.webp is a dusk pool shot).
This rewrites gen_pages.py gallery/photo tuples so every alt text matches what
is really in the frame, and swaps galleries so 'interior' grids show interiors."""
import io, sys

P = "/home/user/workspace/m310renovations_site/gen_pages.py"
s = io.open(P, encoding="utf-8").read()
orig = s

def rep(old, new):
    global s
    if old not in s:
        print("MISS:", old[:90].replace("\n", " "))
        sys.exit(1)
    s = s.replace(old, new, 1)

# ---------------- 2417 Wilkshire ----------------
rep('''        photos=[("2417-wilkshire-2.webp", "Renovated living room at 2417 Wilkshire Drive"),
                ("2417-wilkshire-3.webp", "Open-concept living and dining space at 2417 Wilkshire Drive"),
                ("2417-wilkshire-4.webp", "Aerial view of the rear elevation and standing-seam metal roof at 2417 Wilkshire Drive")],''',
    '''        photos=[("2417-wilkshire-2.webp", "Renovated living room with marble flooring at 2417 Wilkshire Drive"),
                ("2417-wilkshire-3.webp", "Open-concept living and dining space at 2417 Wilkshire Drive"),
                ("2417-wilkshire-4.webp", "Rear elevation, deck and backyard at 2417 Wilkshire Drive at dusk")],''')

rep('''            ("wilkshire-living-open.webp", "Open-concept living area with natural light at 2417 Wilkshire Drive"),''',
    '''            ("wilkshire-living-open.webp", "Guest bedroom with a four-poster bed and sitting chair at 2417 Wilkshire Drive"),''')
rep('''            ("wilkshire-patio.webp", "Rear patio and seating area at 2417 Wilkshire Drive"),
            ("2417-wilkshire-putting-green.webp", "Backyard putting green at 2417 Wilkshire Drive, minutes from Augusta National"),''',
    '''            ("wilkshire-patio.webp", "Sunroom seating area with windows onto the rear yard at 2417 Wilkshire Drive"),
            ("2417-wilkshire-putting-green.webp", "Covered patio with bistro seating at 2417 Wilkshire Drive"),
            ("2417-wilkshire-marble-master-bath.webp", "Backyard putting green at 2417 Wilkshire Drive, minutes from Augusta National"),''')

# ---------------- 2 Shadowmoor ----------------
rep('''        photos=[("2-shadowmoor-2.webp", "Covered front porch at 2 Shadowmoor Court"),
                ("2-shadowmoor-3.webp", "Renovated entry foyer at 2 Shadowmoor Court"),
                ("2-shadowmoor-4.webp", "Side elevation and garage at 2 Shadowmoor Court")],''',
    '''        photos=[("2-shadowmoor-2.webp", "Rear elevation and deck at 2 Shadowmoor Court at dusk"),
                ("2-shadowmoor-3.webp", "Front elevation of 2 Shadowmoor Court after renovation"),
                ("2-shadowmoor-4.webp", "Side elevation and entry at 2 Shadowmoor Court at dusk")],''')
rep('''            ("2-shadowmoor-staircase.webp", "Refinished staircase and entry hall at 2 Shadowmoor Court in North Augusta"),
            ("2-shadowmoor-sunroom.webp", "Bright sunroom with wraparound windows at 2 Shadowmoor Court"),
            ("2-shadowmoor-living-windows.webp", "Living room with tall windows and refinished floors at 2 Shadowmoor Court"),
            ("2-shadowmoor-marble-shower.webp", "Marble-tiled walk-in shower at 2 Shadowmoor Court"),
            ("2-shadowmoor-freestanding-tub.webp", "Freestanding soaking tub in the renovated primary bath at 2 Shadowmoor Court"),
            ("2-shadowmoor-marble-vanity.webp", "Double marble vanity with new fixtures at 2 Shadowmoor Court"),''',
    '''            ("2-shadowmoor-staircase.webp", "Refinished staircase and entry hall at 2 Shadowmoor Court in North Augusta"),
            ("2-shadowmoor-marble-vanity.webp", "Sunroom with wraparound windows overlooking the rear deck at 2 Shadowmoor Court"),
            ("2-shadowmoor-living-windows.webp", "Living room with tall windows and refinished hardwood at 2 Shadowmoor Court"),
            ("2-shadowmoor-freestanding-tub.webp", "Family room with a wall of windows and new hardwood flooring at 2 Shadowmoor Court"),
            ("2-shadowmoor-sunroom.webp", "Formal dining room with chandelier and custom wainscoting at 2 Shadowmoor Court"),
            ("2-shadowmoor-marble-shower.webp", "Open main-level living space looking toward the hall at 2 Shadowmoor Court"),''')

# ---------------- 1135 Crestview ----------------
rep('''        photos=[("1135-crestview-2.webp", "New kitchen with waterfall island at 1135 Crestview Avenue"),
                ("1135-crestview-3.webp", "Kitchen counter and cabinetry detail at 1135 Crestview Avenue"),
                ("1135-crestview-4.webp", "Marble-finish bathroom at 1135 Crestview Avenue")],''',
    '''        photos=[("1135-crestview-2.webp", "Private pool and rear elevation lit at dusk at 1135 Crestview Avenue"),
                ("1135-crestview-3.webp", "Kitchen island with vent hood and double wall ovens at 1135 Crestview Avenue"),
                ("1135-crestview-4.webp", "Kitchen sink wall with quartz counters and stainless dishwasher at 1135 Crestview Avenue")],''')
rep('''            ("1135-crestview-kitchen-ovens.webp", "Renovated kitchen with double wall ovens and full-height cabinetry at 1135 Crestview Avenue"),
            ("1135-crestview-kitchen-island.webp", "Kitchen island with stone countertop and pendant lighting at 1135 Crestview Avenue"),
            ("1135-crestview-living-hardwood.webp", "Living room with new hardwood flooring at 1135 Crestview Avenue"),
            ("1135-crestview-marble-vanity.webp", "Marble-finish bathroom vanity at 1135 Crestview Avenue"),
            ("1135-crestview-marble-bath.webp", "Marble-tiled bathroom with glass shower at 1135 Crestview Avenue"),
            ("1135-crestview-pool-umbrella.webp", "Poolside seating with umbrella in the rear yard at 1135 Crestview Avenue"),
            ("1135-crestview-pool-wide.webp", "Wide view of the restored private pool and deck at 1135 Crestview Avenue"),
            ("1135-crestview-kitchen-2.webp", "Second view of the renovated kitchen and cabinetry at 1135 Crestview Avenue"),''',
    '''            ("1135-crestview-kitchen-island.webp", "Renovated kitchen with a center island, vent hood and double wall ovens at 1135 Crestview Avenue"),
            ("1135-crestview-kitchen-2.webp", "Kitchen sink wall with quartz counters and stainless dishwasher at 1135 Crestview Avenue"),
            ("1135-crestview-marble-vanity.webp", "Living room with new wainscoting and hardwood flooring at 1135 Crestview Avenue"),
            ("1135-crestview-living-hardwood.webp", "Marble-look bathroom with a double vanity and glass shower at 1135 Crestview Avenue"),
            ("1135-crestview-marble-bath.webp", "New laundry room with side entry at 1135 Crestview Avenue"),
            ("1135-crestview-pool-umbrella.webp", "Poolside seating with umbrella in the rear yard at 1135 Crestview Avenue"),
            ("1135-crestview-pool-wide.webp", "Wide view of the restored private pool and deck at 1135 Crestview Avenue"),
            ("1135-crestview-kitchen-ovens.webp", "Private pool and rear elevation lit at dusk at 1135 Crestview Avenue"),''')

# ---------------- 4 Shadowmoor ----------------
rep('''        photos=[("4-shadowmoor-2.webp", "Side elevation and rear deck at 4 Shadowmoor Court"),
                ("4-shadowmoor-3.webp", "Entry foyer at 4 Shadowmoor Court"),
                ("4-shadowmoor-4.webp", "Refinished staircase at 4 Shadowmoor Court")],''',
    '''        photos=[("4-shadowmoor-2.webp", "Backyard lawn and rear yard at 4 Shadowmoor Court"),
                ("4-shadowmoor-3.webp", "Front elevation and entry steps at 4 Shadowmoor Court"),
                ("4-shadowmoor-4.webp", "Renovated kitchen with island and stainless appliances at 4 Shadowmoor Court")],''')
rep('''            ("4-shadowmoor-fireplace-builtins.webp", "Living room fireplace flanked by custom built-ins at 4 Shadowmoor Court"),
            ("4-shadowmoor-open-kitchen.webp", "Open renovated kitchen with island seating at 4 Shadowmoor Court"),
            ("4-shadowmoor-dining.webp", "Formal dining room after renovation at 4 Shadowmoor Court"),
            ("4-shadowmoor-foyer-hall.webp", "Entry foyer and hallway with new trim at 4 Shadowmoor Court"),
            ("4-shadowmoor-hardwood-stairs.webp", "Hardwood staircase with refinished treads at 4 Shadowmoor Court"),''',
    '''            ("4-shadowmoor-4.webp", "Renovated kitchen with island, stainless appliances and hardwood flooring at 4 Shadowmoor Court"),
            ("4-shadowmoor-fireplace-builtins.webp", "Living room fireplace flanked by custom built-ins at 4 Shadowmoor Court"),
            ("4-shadowmoor-open-kitchen.webp", "Main living area opening to the renovated kitchen at 4 Shadowmoor Court"),
            ("4-shadowmoor-dining.webp", "Formal dining room with wainscoting and refinished hardwood at 4 Shadowmoor Court"),
            ("4-shadowmoor-hardwood-stairs.webp", "Hardwood staircase with refinished treads at 4 Shadowmoor Court"),
            ("4-shadowmoor-foyer-hall.webp", "Upstairs landing and hallway with new doors and trim at 4 Shadowmoor Court"),''')

# ---------------- 2008 Rivershyre ----------------
rep('''        photos=[("2008-rivershyre-2.webp", "Room with wainscoting and refinished hardwood at 2008 Rivershyre Drive"),
                ("2008-rivershyre-3.webp", "Staircase and adjoining room at 2008 Rivershyre Drive")],''',
    '''        photos=[("2008-rivershyre-2.webp", "Brick colonial front elevation after renovation at 2008 Rivershyre Drive"),
                ("2008-rivershyre-3.webp", "Front entry with a new door, shutters and landscaping at 2008 Rivershyre Drive")],''')
rep('''            ("2008-rivershyre-kitchen-island.webp", "Renovated kitchen with center island and stone counters at 2008 Rivershyre Drive in Evans"),
            ("2008-rivershyre-kitchen-2.webp", "Second view of the kitchen cabinetry and appliances at 2008 Rivershyre Drive"),
            ("2008-rivershyre-dining-chandelier.webp", "Dining room with chandelier and wainscoting at 2008 Rivershyre Drive"),
            ("2008-rivershyre-hardwood-hall.webp", "Refinished hardwood hallway with new trim carpentry at 2008 Rivershyre Drive"),
            ("2008-rivershyre-bedroom.webp", "Renovated bedroom with fresh paint and refinished floors at 2008 Rivershyre Drive"),''',
    '''            ("2008-rivershyre-bedroom.webp", "Renovated kitchen with a center island, chandelier and refinished hardwood at 2008 Rivershyre Drive in Evans"),
            ("2008-rivershyre-kitchen-2.webp", "Entry foyer with refinished hardwood, wainscoting and a new chandelier at 2008 Rivershyre Drive"),
            ("2008-rivershyre-dining-chandelier.webp", "Front entry, new door and fresh landscaping at 2008 Rivershyre Drive"),
            ("2008-rivershyre-kitchen-island.webp", "Brick colonial front elevation after renovation at 2008 Rivershyre Drive"),
            ("2008-rivershyre-hardwood-hall.webp", "Street view of 2008 Rivershyre Drive after exterior work"),''')

# ---------------- 814 Dunbarton ----------------
rep('''        photos=[("814-dunbarton-2.webp", "Side elevation and deck at 814 Dunbarton Drive at dusk"),
                ("814-dunbarton-3.webp", "Front porch at 814 Dunbarton Drive"),
                ("814-dunbarton-4.webp", "Entry foyer at 814 Dunbarton Drive")],''',
    '''        photos=[("814-dunbarton-2.webp", "814 Dunbarton Drive lit at dusk after exterior renovation"),
                ("814-dunbarton-3.webp", "Front elevation and lawn at 814 Dunbarton Drive"),
                ("814-dunbarton-4.webp", "Front elevation after new siding, trim and windows at 814 Dunbarton Drive")],''')
rep('''            ("814-dunbarton-brick-fireplace.webp", "Living room with restored brick fireplace at 814 Dunbarton Drive in North Augusta"),
            ("814-dunbarton-kitchen-stainless.webp", "Renovated kitchen with stainless appliances and new cabinetry at 814 Dunbarton Drive"),
            ("814-dunbarton-kitchen-2.webp", "Second view of the kitchen counters and backsplash at 814 Dunbarton Drive"),
            ("814-dunbarton-breakfast-nook.webp", "Breakfast nook with natural light at 814 Dunbarton Drive"),
            ("814-dunbarton-marble-vanity.webp", "Marble-topped bathroom vanity at 814 Dunbarton Drive"),
            ("814-dunbarton-dining.webp", "Dining room after renovation at 814 Dunbarton Drive"),''',
    '''            ("814-dunbarton-kitchen-stainless.webp", "Renovated kitchen with stainless appliances and new cabinetry at 814 Dunbarton Drive in North Augusta"),
            ("814-dunbarton-kitchen-2.webp", "Kitchen island and hardwood flooring looking toward the living room at 814 Dunbarton Drive"),
            ("814-dunbarton-breakfast-nook.webp", "Granite counter, undermount sink and new pull-down faucet at 814 Dunbarton Drive"),
            ("814-dunbarton-marble-vanity.webp", "Bathroom vanity with quartz top and marble-look tile at 814 Dunbarton Drive"),
            ("814-dunbarton-4.webp", "Front elevation after new siding, trim and windows at 814 Dunbarton Drive"),
            ("814-dunbarton-brick-fireplace.webp", "814 Dunbarton Drive lit at dusk after exterior renovation"),''')

# ---------------- SERVICE PAGES ----------------
# full home
rep('''            ("4-shadowmoor-open-kitchen.webp", "Open renovated kitchen with island seating at 4 Shadowmoor Court"),
            ("wilkshire-staircase.webp", "Rebuilt staircase with refinished treads and new railing at 2417 Wilkshire Drive"),
            ("2417-wilkshire-marble-foyer.webp", "Marble-tiled entry foyer at 2417 Wilkshire Drive"),''',
    '''            ("4-shadowmoor-open-kitchen.webp", "Main living area opening to the renovated kitchen at 4 Shadowmoor Court"),
            ("wilkshire-staircase.webp", "Rebuilt staircase with refinished treads and new railing at 2417 Wilkshire Drive"),
            ("wilkshire-entryway.webp", "Entry foyer with marble flooring and a new chandelier at 2417 Wilkshire Drive"),''')
rep('''src="assets/portfolio/2417-wilkshire-2.webp" alt="Renovated living room at 2417 Wilkshire Drive, now a Masters Week hospitality rental"''',
    '''src="assets/portfolio/2417-wilkshire-2.webp" alt="Renovated living room with marble flooring at 2417 Wilkshire Drive, now a Masters Week hospitality rental"''')

# kitchen & bath
rep('''            ("1135-crestview-kitchen-ovens.webp", "Renovated kitchen with double wall ovens and full-height cabinetry at 1135 Crestview Avenue"),
            ("wilkshire-freestanding-tub.webp", "Primary bathroom with freestanding soaking tub and marble-look tile at 2417 Wilkshire Drive"),
            ("2-shadowmoor-marble-shower.webp", "Marble-tiled walk-in shower at 2 Shadowmoor Court"),
            ("814-dunbarton-kitchen-stainless.webp", "Renovated kitchen with stainless appliances and new cabinetry at 814 Dunbarton Drive"),''',
    '''            ("1135-crestview-kitchen-island.webp", "Renovated kitchen with a center island, vent hood and double wall ovens at 1135 Crestview Avenue"),
            ("wilkshire-freestanding-tub.webp", "Primary bathroom with freestanding soaking tub and marble-look tile at 2417 Wilkshire Drive"),
            ("wilkshire-walk-in-shower.webp", "Tiled walk-in shower with glass enclosure at 2417 Wilkshire Drive"),
            ("814-dunbarton-kitchen-stainless.webp", "Renovated kitchen with stainless appliances and new cabinetry at 814 Dunbarton Drive"),
            ("814-dunbarton-marble-vanity.webp", "Bathroom vanity with quartz top and marble-look tile at 814 Dunbarton Drive"),
            ("1135-crestview-living-hardwood.webp", "Marble-look bathroom with a double vanity and glass shower at 1135 Crestview Avenue"),''')

# decks & outdoor
rep('''            ("wilkshire-patio.webp", "Rear patio and seating area at 2417 Wilkshire Drive"),
            ("2417-wilkshire-backyard-lawn.webp", "Landscaped backyard lawn at 2417 Wilkshire Drive"),
            ("2417-wilkshire-putting-green.webp", "Backyard putting green at 2417 Wilkshire Drive"),
            ("1135-crestview-pool-wide.webp", "Wide view of the restored private pool and deck at 1135 Crestview Avenue"),''',
    '''            ("2417-wilkshire-marble-master-bath.webp", "Backyard putting green at 2417 Wilkshire Drive"),
            ("2417-wilkshire-putting-green.webp", "Covered patio with bistro seating at 2417 Wilkshire Drive"),
            ("1135-crestview-pool-umbrella.webp", "Pool deck with seating and umbrella at 1135 Crestview Avenue"),
            ("1135-crestview-pool-wide.webp", "Wide view of the restored private pool and deck at 1135 Crestview Avenue"),
            ("4-shadowmoor-2.webp", "Backyard lawn and rear yard at 4 Shadowmoor Court"),''')

# flooring
rep('''        hero="2008-rivershyre-hardwood-hall.webp",
        hero_alt="Refinished hardwood hallway with new trim carpentry at 2008 Rivershyre Drive",
        gallery=[
            ("4-shadowmoor-hardwood-stairs.webp", "Hardwood staircase with refinished treads at 4 Shadowmoor Court"),
            ("1135-crestview-living-hardwood.webp", "Living room with new hardwood flooring at 1135 Crestview Avenue"),
            ("2-shadowmoor-staircase.webp", "Refinished staircase and entry hall at 2 Shadowmoor Court"),
            ("814-dunbarton-brick-fireplace.webp", "Living room with restored brick fireplace and refinished floors at 814 Dunbarton Drive"),''',
    '''        hero="1135-crestview-marble-vanity.webp",
        hero_alt="Living room with new hardwood flooring and custom wainscoting at 1135 Crestview Avenue",
        gallery=[
            ("4-shadowmoor-hardwood-stairs.webp", "Hardwood staircase with refinished treads at 4 Shadowmoor Court"),
            ("2008-rivershyre-kitchen-2.webp", "Entry foyer with refinished hardwood, wainscoting and a new chandelier at 2008 Rivershyre Drive"),
            ("2-shadowmoor-staircase.webp", "Refinished staircase and entry hall at 2 Shadowmoor Court"),
            ("4-shadowmoor-dining.webp", "Dining room with wainscoting and refinished hardwood at 4 Shadowmoor Court"),
            ("2-shadowmoor-living-windows.webp", "Living room with refinished hardwood floors at 2 Shadowmoor Court"),''')

# roofing
rep('''            ("2417-wilkshire-4.webp", "Aerial view of the rear elevation and standing-seam metal roof at 2417 Wilkshire Drive"),''',
    '''            ("2417-wilkshire-4.webp", "Rear elevation and standing-seam metal roof at 2417 Wilkshire Drive at dusk"),''')

io.open(P, "w", encoding="utf-8").write(s)
print("patched", len(orig), "->", len(s))
