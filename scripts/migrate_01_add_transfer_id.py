# scripts/migrate_01_add_transfer_id.py
import sqlite3
import os

# Correctly locate the database from the project root
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'finance.db')

def migrate():
    print("Connecting to database...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Adding 'transfer_id' column to 'transactions' table...")
    try:
        cursor.execute("ALTER TABLE transactions ADD COLUMN transfer_id TEXT;")
        print("✅ Column added successfully.")
    except sqlite3.OperationalError as e:
        # This makes the script safe to run more than once
        if "duplicate column name" in str(e):
            print("👍 Column 'transfer_id' already exists.")
        else:
            raise e
            
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()