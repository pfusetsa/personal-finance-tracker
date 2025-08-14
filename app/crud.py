# app/crud.py

from .database import get_db_connection
import pandas as pd

# --- Data Creation Functions ---

def add_transaction(date, description, amount, is_recurrent, account_id, category_id):
    """Adds a single transaction to the database."""
    conn = get_db_connection()
    try:
        conn.execute(
            """
            INSERT INTO transactions (date, description, amount, is_recurrent, account_id, category_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (date, description, amount, is_recurrent, account_id, category_id)
        )
        conn.commit()
        print("Transaction added successfully. ✅")
    except Exception as e:
        print(f"❌ Error adding transaction: {e}")
    finally:
        conn.close()

def add_transfer(date, description, amount, from_account_id, to_account_id):
    """Adds a transfer, which consists of two transactions."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Find the 'Transferencias' category ID.
        # In a real-world app, this might be handled more robustly.
        transfer_category = cursor.execute(
            "SELECT id FROM categories WHERE name = 'Transferencias'"
        ).fetchone()

        if not transfer_category:
            print("❌ Error: 'Transferencias' category not found in the database.")
            return

        transfer_category_id = transfer_category['id']
        
        # We use a database transaction to ensure both operations succeed or fail together.
        cursor.execute("BEGIN")
        
        # 1. The withdrawal
        cursor.execute(
            """
            INSERT INTO transactions (date, description, amount, is_recurrent, account_id, category_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (date, f"To {description}", -abs(amount), False, from_account_id, transfer_category_id)
        )
        
        # 2. The deposit
        cursor.execute(
            """
            INSERT INTO transactions (date, description, amount, is_recurrent, account_id, category_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (date, f"From {description}", abs(amount), False, to_account_id, transfer_category_id)
        )
        
        conn.commit()
        print("Transfer recorded successfully. ✅")
        
    except Exception as e:
        conn.rollback() # Roll back changes if any error occurs
        print(f"❌ Error adding transfer: {e}")
    finally:
        conn.close()


# --- Data Reading / Reporting Functions ---

def get_accounts():
    """Returns a list of all accounts."""
    conn = get_db_connection()
    accounts = conn.execute("SELECT id, name FROM accounts ORDER BY name").fetchall()
    conn.close()
    return accounts

def get_categories():
    """Returns a list of all categories."""
    conn = get_db_connection()
    categories = conn.execute("SELECT id, name FROM categories ORDER BY name").fetchall()
    conn.close()
    return categories

def get_balance_report():
    """Calculates and returns the balance for each account and the total balance."""
    conn = get_db_connection()
    query = """
        SELECT
            a.name,
            SUM(t.amount) as balance
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        GROUP BY a.name
        ORDER BY a.name;
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    total_balance = df['balance'].sum()
    return df, total_balance

def get_monthly_report_df():
    """Returns a pandas DataFrame of expenses per category per month."""
    conn = get_db_connection()
    query = """
        SELECT
            strftime('%Y-%m', date) as month,
            c.name as category,
            SUM(t.amount) as total_expenses
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.amount < 0
        GROUP BY month, category
        ORDER BY month, category;
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    df['total_expenses'] = df['total_expenses'].abs()
    pivot_df = df.pivot(index='month', columns='category', values='total_expenses').fillna(0)
    return pivot_df

def get_category_report_df(account_id=None):
    """Returns a DataFrame of expenses broken down by category."""
    conn = get_db_connection()
    
    base_query = """
        SELECT
            c.name as category,
            SUM(t.amount) as total
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.amount < 0
    """
    params = []
    if account_id:
        base_query += " AND t.account_id = ?"
        params.append(account_id)
        
    base_query += " GROUP BY c.name ORDER BY total ASC"
    
    df = pd.read_sql_query(base_query, conn, params=params)
    df['total'] = df['total'].abs()
    conn.close()
    return df

def get_all_transactions_df(limit=50):
    """Returns a DataFrame with the N most recent transactions."""
    conn = get_db_connection()
    query = """
        SELECT
            t.date,
            t.description,
            c.name as category,
            a.name as account,
            t.amount
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        JOIN accounts a ON t.account_id = a.id
        ORDER BY t.date DESC, t.id DESC
        LIMIT ?;
    """
    df = pd.read_sql_query(query, conn, params=[limit])
    conn.close()
    return df