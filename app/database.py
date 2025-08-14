# app/database.py

import sqlite3
import os

# Find the absolute path of the project's root directory
# This makes sure we can find the database file no matter where we run the script from
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'finance.db')

def get_db_connection():
    """
    Creates and returns a connection to the SQLite database.
    The connection is configured to return rows that act like dictionaries.
    """
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database file not found at {DB_PATH}. Please run the migration script first.")
        
    conn = sqlite3.connect(DB_PATH)
    # This line makes the database return rows that can be accessed by column name
    conn.row_factory = sqlite3.Row
    return conn