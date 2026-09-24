import os
from database import engine, SessionLocal, Base
import models

def seed():
    print("Creating all tables in keyhaus_db if not exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(models.SwitchPersona).count() > 0:
            print("Database already contains switches. Clearing existing demo rows to seed exact V4 data...")
            db.query(models.SwitchPersona).delete()
            db.query(models.Keycap).delete()
            db.query(models.Cable).delete()
            db.query(models.SiteTranslation).delete()
            db.commit()

        print("Seeding Switch Personas...")
        switches = [
            models.SwitchPersona(
                id="office",
                label="Office",
                tagline="Silent & Focused",
                switch_name="Gateron Silent Pink",
                switch_spec="Linear · 45g · Ultra-quiet",
                badge="SILENT",
                price=45.0,
                description="Engineered for open offices and focused deep work. Near-zero operating noise with a factory-dampened stem and pre-lubed bore. Long typing sessions feel effortless at 45g.",
                features=["45g actuation", "Dampened stem", "Pre-lubed", "SMD LED compat."],
                image="/uploads/switch_office.jpg",
                accent="#60a5fa",
                accent_dim="rgba(96,165,250,0.15)",
                order_index=0,
            ),
            models.SwitchPersona(
                id="gamer",
                label="Gamer",
                tagline="Speed & Precision",
                switch_name="Gateron Yellow Pro",
                switch_spec="Linear · 35g · 1.0mm pre-travel",
                badge="FAST",
                price=45.0,
                description="Lowest pre-travel actuation in its class. Factory-lubed linear motion eliminates any scratch. Built for competitive play where every millisecond of input lag matters.",
                features=["35g actuation", "1.0mm pre-travel", "Factory lubed", "N-key rollover"],
                image="/uploads/switch_gamer.jpg",
                accent="#f87171",
                accent_dim="rgba(248,113,113,0.15)",
                order_index=1,
            ),
            models.SwitchPersona(
                id="typist",
                label="Typist",
                tagline="Sound & Thock",
                switch_name="Holy Panda X",
                switch_spec="Tactile · 67g · Thocky bump",
                badge="THOCK",
                price=65.0,
                description="The sound profile that sparked a thousand ASMR videos. A defined tactile bump at 2.0mm delivers auditory and physical confirmation of every keystroke.",
                features=["67g actuation", "Rounded tactile bump", "Long-pole stem", "Thocky resonance"],
                image="/uploads/switch_typist.jpg",
                accent="#a78bfa",
                accent_dim="rgba(167,139,250,0.15)",
                order_index=2,
            ),
            models.SwitchPersona(
                id="designer",
                label="Designer",
                tagline="Feedback & Flow",
                switch_name="Boba U4T",
                switch_spec="Tactile · 62g · Fast + Feedback",
                badge="PRECISE",
                price=55.0,
                description="Sharp tactile bump that never interrupts flow state. Cerakote-coated housing creates a refined, muted sound signature — clean feedback without the drama.",
                features=["62g actuation", "Sharp tactile bump", "Cerakote housing", "Muted sound sig."],
                image="/uploads/switch_designer.jpg",
                accent="#34d399",
                accent_dim="rgba(52,211,153,0.15)",
                order_index=3,
            ),
        ]
        db.add_all(switches)

        print("Seeding Keycaps...")
        keycaps = [
            models.Keycap(
                id="arctic-white",
                name="Arctic White",
                subtitle="PBT Double-shot · Cherry Profile",
                badge="BESTSELLER",
                price=89.0,
                description="Ultra-clean legends with zero shine-through. PBT texture that only improves with age.",
                image="/uploads/keycap_arctic_white.jpg",
                accent="#e8e8e8",
                order_index=0,
            ),
            models.Keycap(
                id="midnight-void",
                name="Midnight Void",
                subtitle="ABS · Laser-engraved · SA Profile",
                badge="",
                price=79.0,
                description="Stealth matte finish with barely-there legends. For setups that prefer to disappear.",
                image="/uploads/keycap_midnight_void.jpg",
                accent="#4a4a6a",
                order_index=1,
            ),
            models.Keycap(
                id="forest-sage",
                name="Forest Sage",
                subtitle="PBT Dye-sublimated · SA Profile",
                badge="NEW",
                price=95.0,
                description="Muted earth tones with botanical-inspired colorway. Pairs beautifully with brass and walnut.",
                image="/uploads/keycap_forest_sage.jpg",
                accent="#3d6b38",
                order_index=2,
            ),
            models.Keycap(
                id="neon-pulse",
                name="Neon Pulse",
                subtitle="ABS · Double-shot · OEM Profile",
                badge="",
                price=85.0,
                description="High-contrast RGB-transparent legends. Engineered for backlit builds that demand attention.",
                image="/uploads/keycap_neon_pulse.jpg",
                accent="#e84393",
                order_index=3,
            ),
        ]
        db.add_all(keycaps)

        print("Seeding Cables...")
        cables = [
            models.Cable(
                id="cosmos-coil",
                name="Cosmos Coil",
                subtitle="Coiled · Paracord Sleeved · USB-C",
                badge="ARTISAN",
                price=55.0,
                description="Hand-built coiled cable with custom GX16 aviator connector and milled brass barrel ends.",
                image="/uploads/cable_cosmos_coil.jpg",
                accent="#CAFF00",
                order_index=0,
            ),
            models.Cable(
                id="void-braided",
                name="Void Braided",
                subtitle="Straight · Techflex · USB-C to USB-A",
                badge="",
                price=28.0,
                description="No-frills quality. 1.8m techflex braid, triple-shielded core, zero cable drag.",
                image="/uploads/cable_void_braided.jpg",
                accent="#6b7280",
                order_index=1,
            ),
            models.Cable(
                id="aurora-coil",
                name="Aurora Coil",
                subtitle="Coiled · Transparent Sleeving · USB-C",
                badge="NEW",
                price=48.0,
                description="Crystal-clear sleeving reveals the internal helix. Pairs with any keycap colorway seamlessly.",
                image="/uploads/cable_aurora_coil.jpg",
                accent="#a5f3fc",
                order_index=2,
            ),
        ]
        db.add_all(cables)

        print("Seeding Site Translations & Configurations...")
        translations = {
            "brandName": "Keyhaus",
            "brandSubtitle": "Build Studio",
            "switchesTitle": "Choose your switches",
            "switchesSubtitle": "Four archetypes. Pick the one that fits how you work.",
            "keycapsTitle": "Choose your keycaps",
            "keycapsSubtitle": "Select one to customize and add to your build.",
            "cableTitle": "Choose your cable",
            "cableSubtitle": "Select one to customize and add to your build.",
            "bundleHintText": "Complete the full build and save 15% on your entire order.",
            "summaryTitle": "Your Build",
            "bundleDiscountTitle": "15% Bundle Discount Applied",
            "checkoutBtn": "Proceed to Checkout →",
            "startOverBtn": "Start Over",
            "addContinueBtn": "Add {name} + Continue to {next} →",
            "addOnlyBtn": "Add {item} only, exit flow",
            "skipBtn": "Skip {item}, continue without →",
            "customizeBtn": "Customize Design",
            "switchSpecsLabel": "Switch specs",
            "buildSoFarLabel": "Your build so far",
            "adminBtn": "Admin",
        }
        for k, v in translations.items():
            db.add(models.SiteTranslation(key=k, value=v))

        db.commit()
        print("Successfully seeded all data into keyhaus_db!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
