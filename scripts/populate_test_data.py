# Find and replace the entire content of this file
import sqlite3
import os
import sys
import random
from datetime import date, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import crud

def clear_user_data(conn, user_id):
    print(f"Clearing old data for user_id: {user_id}...")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM accounts WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM categories WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM settings WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    print("Old data cleared.")

def main():
    conn = crud.get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE first_name = 'Test' AND surname = 'User'")
    existing_user = cursor.fetchone()
    if existing_user:
        clear_user_data(conn, existing_user[0])

    print("Creating 'Test User'...")
    user_id = crud.create_user(first_name="Test", second_name=None, surname="User")
    
    print("Creating accounts...")
    accounts = {
        'checking': crud.add_account("Checking Account", user_id),
        'savings': crud.add_account("Savings Account", user_id),
        'credit': crud.add_account("Credit Card", user_id),
    }

    print("Creating categories...")
    categories = {
        'salary': crud.add_category("Salary", user_id),
        'groceries': crud.add_category("Groceries", user_id),
        'rent': crud.add_category("Rent", user_id),
        'transport': crud.add_category("Transport", user_id),
        'eating_out': crud.add_category("Eating Out", user_id),
        'shopping': crud.add_category("Shopping", user_id),
        'utilities': crud.add_category("Utilities", user_id),
        'transfer': crud.add_category("Internal Transfer", user_id),
    }
    crud.update_setting("transfer_category_id", categories['transfer'], user_id)
    
    print("Generating transactions...")
    today = date.today()
    
    # --- Key Transactions ---
    # Salary (last 3 months)
    for i in range(3):
        crud.add_transaction(today - timedelta(days=15 + i*30), "Monthly Salary", 3000, 'EUR', True, accounts['checking'], categories['salary'], user_id)
    # Rent (last 3 months)
    for i in range(3):
        crud.add_transaction(today - timedelta(days=25 + i*30), "Monthly Rent", -850, 'EUR', True, accounts['checking'], categories['rent'], user_id)

    # --- Randomized Transactions ---
    random_expenses = [
        ("Groceries", -75.50, categories['groceries']), ("Lunch", -15.80, categories['eating_out']),
        ("Coffee", -4.20, categories['eating_out']), ("Metro Pass", -30.00, categories['transport']),
        ("Online Shopping", -120.00, categories['shopping']), ("Electricity Bill", -88.90, categories['utilities']),
        ("Gas Bill", -45.00, categories['utilities']), ("Dinner with friends", -55.75, categories['eating_out']),
        ("New T-shirt", -29.99, categories['shopping']), ("Taxi ride", -12.50, categories['transport'])
    ]

    for _ in range(40):
        desc, amount, cat_id = random.choice(random_expenses)
        rand_date = today - timedelta(days=random.randint(1, 365))
        rand_account = random.choice([accounts['checking'], accounts['credit']])
        crud.add_transaction(rand_date, desc, amount, 'EUR', False, rand_account, cat_id, user_id)
        
    # Add a transfer
    transfer_id = "test-transfer-01"
    crud.add_transaction(today - timedelta(days=30), "Transfer to Savings", 500, 'EUR', False, accounts['savings'], categories['transfer'], user_id, transfer_id=transfer_id)
    crud.add_transaction(today - timedelta(days=30), "Transfer to Savings", -500, 'EUR', False, accounts['checking'], categories['transfer'], user_id, transfer_id=transfer_id)
    
    conn.close()
    print(f"✅ Test data populated successfully with ~50 transactions!")

if __name__ == "__main__":
    main()