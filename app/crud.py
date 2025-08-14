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
    # This SQL query joins the transactions and accounts tables, groups by account name,
    # and sums the amounts for each account.
    query = """
        SELECT
            a.name,
            SUM(t.amount) as balance
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        GROUP BY a.name
        ORDER BY a.name;
    """
    # pandas is still great for reading query results into a nicely formatted table.
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    total_balance = df['balance'].sum()
    return df, total_balance

def get_monthly_report_df():
    """
    Returns a pandas DataFrame of expenses per category per month.
    This is a perfect example of how much heavy lifting the database can do for us.
    """
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
    
    # We still use pandas here for its powerful `pivot` functionality to format the report.
    df['total_expenses'] = df['total_expenses'].abs()
    pivot_df = df.pivot(index='month', columns='category', values='total_expenses').fillna(0)
    return pivot_df

def get_category_report_df(account_id=None):
    """
    Returns a DataFrame of expenses broken down by category.
    Optionally filters for a specific account.
    """
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
        
    base_query += " GROUP BY c.name ORDER BY total ASC" # ASC because expenses are negative
    
    df = pd.read_sql_query(base_query, conn, params=params)
    df['total'] = df['total'].abs() # Make the final numbers positive for display
    conn.close()
    return df