import sqlite3
import pandas as pd
import os
import sys

def get_db_path():
    """Constructs the absolute path to the database file."""
    return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'trakfin.db')

def list_users():
    """Lists all users in the database in a formatted table."""
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        df = pd.read_sql_query("SELECT id, first_name, second_name, surname FROM users ORDER BY id", conn)
        conn.close()
        
        print("--- Current Users in Database ---")
        if df.empty:
            print("No users found.")
        else:
            # Use pandas to_string() for a clean table format
            print(df.to_string(index=False))
        
        print("\nTo delete users, run the script again followed by the user IDs.")
        print("Example: python scripts/delete_user.py 2 3")
        
    except Exception as e:
        print(f"An error occurred while listing users: {e}")

def delete_users(user_ids_to_delete):
    """Deletes specified users and all their associated data."""
    db_path = get_db_path()
    
    print(f"Preparing to delete users with IDs: {', '.join(user_ids_to_delete)}")
    
    child_tables = ['accounts', 'categories', 'transactions', 'settings']
    
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        for user_id in user_ids_to_delete:
            print(f"\nProcessing user_id: {user_id}...")
            for table in child_tables:
                cursor.execute(f"DELETE FROM {table} WHERE user_id = ?", (user_id,))
                print(f"  - Deleted {cursor.rowcount} records from '{table}'")
            
            cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
            if cursor.rowcount > 0:
                print(f"  - Successfully deleted user {user_id} from 'users' table.")
            else:
                print(f"  - User with ID {user_id} not found in 'users' table.")

        conn.commit()
        print("\nDeletion complete.")

    except sqlite3.Error as e:
        if conn: conn.rollback()
        print(f"An error occurred: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    user_ids = sys.argv[1:]
    if not user_ids:
        # If no IDs are provided as arguments, list the users.
        list_users()
    else:
        # If IDs are provided, proceed with deletion.
        delete_users(user_ids)