# scripts/add_settings_table.py
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'finance.db')

def add_settings_table():
    print(f"Connecting to database at {DB_PATH}...")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Create the new settings table if it doesn't exist
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
        """)
        
        # Set an initial default value for the transfer category ID.
        # We'll try to find 'Transferencias' and use its ID.
        cursor.execute("SELECT id FROM categories WHERE name = 'Transferencias'")
        transfer_category = cursor.fetchone()
        
        if transfer_category:
            default_id = transfer_category[0]
            # INSERT OR IGNORE won't overwrite an existing setting
            cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ('transfer_category_id', str(default_id)))
            print(f"Default transfer category ID set to {default_id}.")
        
        conn.commit()
        conn.close()
        print("✅ Settings table is ready.")
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    add_settings_table()