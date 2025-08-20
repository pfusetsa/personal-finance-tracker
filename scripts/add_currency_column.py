# scripts/add_currency_column.py
import sqlite3
import os

# Get the absolute path to the project's root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'finance.db')

def add_currency_column():
    """Adds a 'currency' column to the transactions table with a default of 'EUR'."""
    print(f"Connecting to database at {DB_PATH}...")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("Checking for 'currency' column in 'transactions' table...")
        cursor.execute("PRAGMA table_info(transactions)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'currency' not in columns:
            print("Column 'currency' not found. Adding it now...")
            # Add the new column and set its default value to 'EUR' for all existing rows
            cursor.execute("ALTER TABLE transactions ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR'")
            conn.commit()
            print("✅ Successfully added the 'currency' column.")
        else:
            print("Column 'currency' already exists. No changes made.")
            
        conn.close()
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    add_currency_column()