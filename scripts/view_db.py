# view_db.py
import sqlite3
import pandas as pd
import os

DB_FILE = 'finance.db'

def view_database_tables(db_file):
    """Connects to the SQLite DB and prints the contents of each table."""
    if not os.path.exists(db_file):
        print(f"Error: Database file '{db_file}' not found.")
        return

    print(f"--- Viewing data from '{db_file}' ---")
    
    try:
        conn = sqlite3.connect(db_file)
        
        # List of all tables in the database
        tables = ['accounts', 'categories', 'transactions']
        
        for table_name in tables:
            print(f"\n--- Contents of '{table_name}' table ---")
            # Use pandas to read the SQL query into a DataFrame for nice formatting
            df = pd.read_sql_query(f"SELECT * FROM {table_name}", conn)
            
            if df.empty:
                print("Table is empty.")
            else:
                # to_string() ensures all rows are printed
                print(df.to_string())
        
        conn.close()
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    view_database_tables(DB_FILE)