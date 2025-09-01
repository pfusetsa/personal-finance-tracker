# scripts/debug_reports.py
import sqlite3
import pandas as pd
import os
import sys

# Add the app directory to the path to import crud
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import crud

def run_debug():
    """
    Directly runs the chart queries against the database to diagnose issues.
    """
    print("--- TrakFin Report Debugger ---")
    try:
        user_id_str = input("Enter the user_id for your 'Test User' (usually 1): ")
        user_id = int(user_id_str)
    except (ValueError, EOFError):
        print("Invalid input. Exiting.")
        return

    print(f"\nRunning queries for user_id: {user_id}")
    print("-" * 30)

    # Re-create the exact conditions and queries from crud.py
    start_date = '1970-01-01'
    end_date = '2025-12-31' # Use a future date to ensure all data is included
    
    conn = None
    try:
        conn = crud.get_db_connection()

        # --- Test 1: Monthly Income/Expense Summary ---
        print("\n[TEST 1] Running get_monthly_income_expense_summary query...")
        try:
            df_monthly = crud.get_monthly_income_expense_summary(user_id, start_date, end_date)
            print("Query executed successfully.")
            if not df_monthly.empty:
                print("RESULT: Data found.")
                print(df_monthly.to_string())
            else:
                print("RESULT: Query returned an empty table.")
        except Exception as e:
            print(f"ERROR executing query: {e}")

        print("-" * 30)

        # --- Test 2: Category Summary ---
        print("\n[TEST 2] Running get_category_summary_for_chart query...")
        try:
            df_category = crud.get_category_summary_for_chart(user_id, start_date, end_date)
            print("Query executed successfully.")
            if not df_category.empty:
                print("RESULT: Data found.")
                print(df_category.to_string())
            else:
                print("RESULT: Query returned an empty table.")
        except Exception as e:
            print(f"ERROR executing query: {e}")

        print("-" * 30)

        # --- Test 3: Recurrent Summary ---
        print("\n[TEST 3] Running get_recurrent_summary query...")
        try:
            df_recurrent = crud.get_recurrent_summary(user_id, start_date, end_date)
            print("Query executed successfully.")
            if not df_recurrent.empty:
                print("RESULT: Data found.")
                print(df_recurrent.to_string())
            else:
                print("RESULT: Query returned an empty table.")
        except Exception as e:
            print(f"ERROR executing query: {e}")
        
        print("-" * 30)
        print("\nDebug script finished.")

    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    run_debug()