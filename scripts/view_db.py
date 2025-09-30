import sqlite3
import pandas as pd
import os
import sys

def view_table(table_name='transactions'):
    """Connects to the database and prints the contents of a specified table."""
    try:
        # Construct the absolute path to the database file
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'trakfin.db')
        
        if not os.path.exists(db_path):
            print(f"Error: Database file not found at {db_path}")
            return

        conn = sqlite3.connect(db_path)
        
        # Use pandas to read the table into a DataFrame for nice formatting
        df = pd.read_sql_query(f"SELECT * FROM {table_name}", conn)
        
        conn.close()
        
        if df.empty:
            print(f"Table '{table_name}' is empty or does not exist.")
        else:
            # Print the entire DataFrame without truncation
            with pd.option_context('display.max_rows', None, 'display.max_columns', None, 'display.width', 1000):
                print(f"--- Contents of '{table_name}' table ---")
                print(df)

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # You can optionally pass a table name as a command-line argument
    # Example: python scripts/view_db.py categories
    if len(sys.argv) > 1:
        view_table(sys.argv[1])
    else:
        view_table()