# app/crud.py
import pandas as pd

# Hardcoded exchange rates relative to EUR
EXCHANGE_RATES = {
    'EUR': 1.0,
    'USD': 0.92, # 1 EUR = 1.08 USD -> 1 USD = 0.92 EUR
    'GBP': 1.18, # 1 EUR = 0.85 GBP -> 1 GBP = 1.18 EUR
}

def get_db_connection():
    import sqlite3
    import os
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'finance.db')
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --- Schema Function ---
def get_db_schema_string():
    conn = get_db_connection()
    cursor = conn.cursor()
    schema_str = ""
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    for table in tables:
        table_name = table['name']
        schema_str += f"\nTable '{table_name}':\n"
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        for column in columns:
            schema_str += f"  - {column['name']} ({column['type']})\n"
    conn.close()
    return schema_str

# --- Create / Update / Delete ---
def add_transaction(date, description, amount, currency, is_recurrent, account_id, category_id):
    conn = get_db_connection()
    conn.execute("INSERT INTO transactions (date, description, amount, currency, is_recurrent, account_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                 (date, description, amount, currency, is_recurrent, account_id, category_id))
    conn.commit()
    conn.close()

def update_transaction(transaction_id, date, description, amount, currency, is_recurrent, account_id, category_id):
    conn = get_db_connection()
    conn.execute("UPDATE transactions SET date = ?, description = ?, amount = ?, currency = ?, is_recurrent = ?, account_id = ?, category_id = ? WHERE id = ?",
                 (date, description, amount, currency, is_recurrent, account_id, category_id, transaction_id))
    conn.commit()
    conn.close()
    return True

def delete_transaction(transaction_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    conn.commit()
    conn.close()
    return True

# --- Read Functions (Lookups) ---
def get_accounts():
    conn = get_db_connection()
    accounts = conn.execute("SELECT id, name FROM accounts ORDER BY id").fetchall()
    conn.close()
    return [dict(row) for row in accounts]

def get_account_by_id(account_id):
    conn = get_db_connection()
    account = conn.execute("SELECT id, name FROM accounts WHERE id = ?", (account_id,)).fetchone()
    conn.close()
    return dict(account) if account else None

def get_categories():
    conn = get_db_connection()
    categories = conn.execute("SELECT id, name FROM categories ORDER BY id").fetchall()
    conn.close()
    return [dict(row) for row in categories]

# --- Read Functions (Transactions & Reports) ---
def get_all_transactions(page=1, page_size=10):
    conn = get_db_connection()
    offset = (page - 1) * page_size
    query = "SELECT t.id, t.date, t.description, c.name as category, a.name as account, t.amount, t.currency, t.account_id, t.category_id, t.is_recurrent FROM transactions t JOIN categories c ON t.category_id = c.id JOIN accounts a ON t.account_id = a.id ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?;"
    df = pd.read_sql_query(query, conn, params=[page_size, offset])
    total_count = conn.execute("SELECT COUNT(id) FROM transactions").fetchone()[0]
    conn.close()
    return df, total_count

def get_balance_report():
    conn = get_db_connection()
    # This query now calculates a converted_amount in EUR
    query = f"""
    SELECT
        a.name,
        SUM(
            t.amount * CASE t.currency
                WHEN 'EUR' THEN {EXCHANGE_RATES['EUR']}
                WHEN 'USD' THEN {EXCHANGE_RATES['USD']}
                WHEN 'GBP' THEN {EXCHANGE_RATES['GBP']}
                ELSE 1.0
            END
        ) as balance
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    GROUP BY a.name
    ORDER BY a.id;
    """
    df = pd.read_sql_query(query, conn)
    total_balance = df['balance'].sum() if not df.empty else 0
    conn.close()
    return df, total_balance

# --- Chart functions are unchanged for now. They will still calculate based on raw amounts. ---
def get_category_summary_for_chart(start_date: str, end_date: str, transaction_type: str = 'expense'):
    conn = get_db_connection()
    type_filter = "t.amount < 0"
    if transaction_type == 'income': type_filter = "t.amount > 0"
    elif transaction_type == 'both': type_filter = "c.name != 'Transfer'"
    query = f"SELECT c.name as category, SUM(ABS(t.amount)) as total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE {type_filter} AND t.date BETWEEN ? AND ? GROUP BY c.name HAVING total > 0 ORDER BY total DESC;"
    df = pd.read_sql_query(query, conn, params=[start_date, end_date])
    conn.close()
    return df

def get_monthly_income_expense_summary(start_date: str, end_date: str):
    conn = get_db_connection()
    query = "SELECT strftime('%Y-%m', date) as month, SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income, SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses FROM transactions WHERE date BETWEEN ? AND ? GROUP BY month ORDER BY month;"
    df = pd.read_sql_query(query, conn, params=[start_date, end_date])
    conn.close()
    return df

def get_recurrent_summary(start_date: str, end_date: str):
    conn = get_db_connection()
    query = "SELECT c.name as category, SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income, SUM(CASE WHEN t.amount < 0 THEN ABS(amount) ELSE 0 END) as expenses FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.is_recurrent = 1 AND t.date BETWEEN ? AND ? GROUP BY c.name HAVING income > 0 OR expenses > 0 ORDER BY expenses DESC, income DESC;"
    df = pd.read_sql_query(query, conn, params=[start_date, end_date])
    conn.close()
    return df

def get_category_by_name(category_name):
    conn = get_db_connection()
    category = conn.execute("SELECT id, name FROM categories WHERE name = ?", (category_name,)).fetchone()
    conn.close()
    return dict(category) if category else None

def add_category(category_name):
    """Adds a new category and returns its ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO categories (name) VALUES (?)", (category_name,))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()