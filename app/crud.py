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
def add_transaction(date, description, amount, currency, is_recurrent, account_id, category_id, transfer_id=None):
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO transactions (date, description, amount, currency, is_recurrent, account_id, category_id, transfer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (date, description, amount, currency, is_recurrent, account_id, category_id, transfer_id)
    )
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
    # First, check if this transaction is part of a transfer
    cursor = conn.cursor()
    cursor.execute("SELECT transfer_id FROM transactions WHERE id = ?", (transaction_id,))
    result = cursor.fetchone()
    transfer_id = result['transfer_id'] if result else None

    if transfer_id:
        # If it's a transfer, delete both linked transactions
        conn.execute("DELETE FROM transactions WHERE transfer_id = ?", (transfer_id,))
    else:
        # Otherwise, just delete the single transaction
        conn.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    
    conn.commit()
    conn.close()
    return True
    
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

def get_category_by_name(category_name):
    conn = get_db_connection()
    category = conn.execute("SELECT id, name FROM categories WHERE name = ?", (category_name,)).fetchone()
    conn.close()
    return dict(category) if category else None

# --- Read Functions (Transactions & Reports) ---
def get_all_transactions(
    page=1, page_size=10, account_ids=None, category_ids=None, start_date=None, end_date=None, 
    search_query=None, is_recurrent=None, amount_min=None, amount_max=None,
    sort_by='date', sort_order='desc'
):
    conn = get_db_connection()
    base_query = "FROM transactions t JOIN categories c ON t.category_id = c.id JOIN accounts a ON t.account_id = a.id"
    where_clauses = []
    params = []
    
    if account_ids:
        placeholders = ','.join('?' for _ in account_ids)
        where_clauses.append(f"t.account_id IN ({placeholders})")
        params.extend(account_ids)
    if category_ids:
        placeholders = ','.join('?' for _ in category_ids)
        where_clauses.append(f"t.category_id IN ({placeholders})")
        params.extend(category_ids)
    if start_date:
        where_clauses.append("t.date >= ?")
        params.append(start_date)
    if end_date:
        where_clauses.append("t.date <= ?")
        params.append(end_date)
    if search_query:
        where_clauses.append("t.description LIKE ?")
        params.append(f"%{search_query}%")
    if is_recurrent is not None:
        where_clauses.append("t.is_recurrent = ?")
        params.append(is_recurrent)
    if amount_min is not None:
        where_clauses.append("t.amount >= ?")
        params.append(amount_min)
    if amount_max is not None:
        where_clauses.append("t.amount <= ?")
        params.append(amount_max)
    
    where_statement = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    valid_sort_columns = {'date': 't.date', 'amount': 't.amount'}
    sort_column = valid_sort_columns.get(sort_by, 't.date')
    order = 'DESC' if sort_order.lower() == 'desc' else 'ASC'
    order_by_statement = f"ORDER BY {sort_column} {order}, t.id {order}"
    count_query = f"SELECT COUNT(t.id) {base_query} {where_statement};"
    total_count = conn.execute(count_query, params).fetchone()[0]
    offset = (page - 1) * page_size
    select_statement = "SELECT t.id, t.date, t.description, c.name as category, a.name as account, t.amount, t.currency, t.account_id, t.category_id, t.is_recurrent, t.transfer_id"
    paginated_query = f"{select_statement} {base_query} {where_statement} {order_by_statement} LIMIT ? OFFSET ?;"
    paginated_params = params + [page_size, offset]
    df = pd.read_sql_query(paginated_query, conn, params=paginated_params)
    conn.close()
    return df, total_count

def get_balance_report():
    conn = get_db_connection()
    # This version uses our original, hardcoded EXCHANGE_RATES dictionary
    query = f"""
    SELECT
        a.name,
        COALESCE(SUM(
            t.amount * CASE t.currency
                WHEN 'EUR' THEN {EXCHANGE_RATES['EUR']}
                WHEN 'USD' THEN {EXCHANGE_RATES['USD']}
                WHEN 'GBP' THEN {EXCHANGE_RATES['GBP']}
                ELSE 1.0
            END
        ), 0) as balance
    FROM accounts a
    LEFT JOIN transactions t ON a.id = t.account_id
    GROUP BY a.name
    ORDER BY a.name;
    """
    df = pd.read_sql_query(query, conn)
    total_balance = df['balance'].sum() if not df.empty else 0
    conn.close()
    return df, total_balance

def get_balance_evolution_report():
    conn = get_db_connection()
    query = f"""
    WITH daily_changes AS (
        SELECT date, SUM(amount * CASE currency
            WHEN 'EUR' THEN {EXCHANGE_RATES['EUR']} WHEN 'USD' THEN {EXCHANGE_RATES['USD']}
            WHEN 'GBP' THEN {EXCHANGE_RATES['GBP']} ELSE 1.0 END
        ) as change FROM transactions GROUP BY date
    )
    SELECT date, SUM(change) OVER (ORDER BY date) as cumulative_balance FROM daily_changes ORDER BY date;
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

# --- Chart Functions ---
def get_category_summary_for_chart(start_date: str, end_date: str, transaction_type: str = 'expense'):

    conn = get_db_connection()
    transfer_category_id = get_setting('transfer_category_id')

    query = """
        SELECT
            c.name as category,
            SUM(t.amount) as total
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.date BETWEEN ? AND ?
    """
    params = [start_date, end_date]

    if transfer_category_id:
        query += " AND t.category_id != ?"
        params.append(transfer_category_id)

    if transaction_type == 'income':
        query += " AND t.amount > 0"
    elif transaction_type == 'expense':
        query += " AND t.amount < 0"
        
    query += " GROUP BY c.name HAVING total != 0 ORDER BY ABS(total) DESC;"
    
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    return df

def get_monthly_income_expense_summary(start_date: str, end_date: str):

    conn = get_db_connection()
    transfer_category_id = get_setting('transfer_category_id')
    
    query = """
        SELECT
            strftime('%Y-%m', t.date) as month,
            SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
            SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as expenses
        FROM transactions t
        WHERE t.date BETWEEN ? AND ?
    """
    params = [start_date, end_date]

    if transfer_category_id:
        query += " AND t.category_id != ?"
        params.append(transfer_category_id)
        
    query += " GROUP BY month ORDER BY month;"

    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    return df

def get_recurrent_summary(start_date: str, end_date: str):

    conn = get_db_connection()
    transfer_category_id = get_setting('transfer_category_id')

    query = """
        SELECT c.name as category,
            SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
            SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as expenses
        FROM transactions t JOIN categories c ON t.category_id = c.id
        WHERE t.is_recurrent = 1 AND t.date BETWEEN ? AND ?
    """
    params = [start_date, end_date]
    
    if transfer_category_id:
        query += " AND t.category_id != ?"
        params.append(transfer_category_id)

    query += " GROUP BY c.name HAVING income > 0 OR expenses > 0 ORDER BY expenses DESC, income DESC;"

    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    return df

def update_category(category_id, name):
    """Updates an existing category's name."""
    conn = get_db_connection()
    try:
        conn.execute("UPDATE categories SET name = ? WHERE id = ?", (name, category_id))
        conn.commit()
        return True
    finally:
        conn.close()

def delete_category(category_id):
    """Deletes a category from the database."""
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM categories WHERE id = ?", (category_id,))
        conn.commit()
        return True
    finally:
        conn.close()

def get_transaction_count_for_category(category_id):
    """Counts how many transactions are associated with a specific category."""
    conn = get_db_connection()
    count = conn.execute("SELECT COUNT(id) FROM transactions WHERE category_id = ?", (category_id,)).fetchone()[0]
    conn.close()
    return count

def recategorize_transactions(from_category_id, to_category_id):
    """Updates all transactions from one category to another."""
    conn = get_db_connection()
    try:
        conn.execute("UPDATE transactions SET category_id = ? WHERE category_id = ?", (to_category_id, from_category_id))
        conn.commit()
    finally:
        conn.close()

def delete_transactions_by_category(category_id):
    """Deletes all transactions associated with a specific category."""
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM transactions WHERE category_id = ?", (category_id,))
        conn.commit()
    finally:
        conn.close()

def add_account(name):
    """Adds a new account and returns its ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO accounts (name) VALUES (?)", (name,))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def update_account(account_id, name):
    """Updates an existing account's name."""
    conn = get_db_connection()
    try:
        conn.execute("UPDATE accounts SET name = ? WHERE id = ?", (name, account_id))
        conn.commit()
        return True
    finally:
        conn.close()

def delete_account(account_id):
    """Deletes an account from the database."""
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
        conn.commit()
        return True
    finally:
        conn.close()

def get_transaction_count_for_account(account_id):
    """Counts how many transactions are associated with a specific account."""
    conn = get_db_connection()
    count = conn.execute("SELECT COUNT(id) FROM transactions WHERE account_id = ?", (account_id,)).fetchone()[0]
    conn.close()
    return count

def reassign_transactions_from_account(from_account_id, to_account_id):
    """Updates all transactions from one account to another."""
    conn = get_db_connection()
    try:
        conn.execute("UPDATE transactions SET account_id = ? WHERE account_id = ?", (to_account_id, from_account_id))
        conn.commit()
    finally:
        conn.close()

def delete_transactions_by_account(account_id):
    """Deletes all transactions associated with a specific account."""
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM transactions WHERE account_id = ?", (account_id,))
        conn.commit()
    finally:
        conn.close()

def get_setting(key):
    """Retrieves a setting value from the database."""
    conn = get_db_connection()
    value = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    conn.close()
    return value[0] if value else None

def update_setting(key, value):
    """Updates or inserts a setting value."""
    conn = get_db_connection()
    conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(value)))
    conn.commit()
    conn.close()

def get_transfer(transfer_id: str):
    """Retrieves both transactions for a given transfer_id."""
    conn = get_db_connection()
    transfer_rows = conn.execute("SELECT * FROM transactions WHERE transfer_id = ? ORDER BY amount DESC", (transfer_id,)).fetchall()
    conn.close()
    
    if len(transfer_rows) != 2:
        return None
        
    income_tx = dict(transfer_rows[0])
    expense_tx = dict(transfer_rows[1])
    
    return {
        "transfer_id": transfer_id,
        "date": income_tx['date'],
        "amount": income_tx['amount'],
        "from_account_id": expense_tx['account_id'],
        "to_account_id": income_tx['account_id'],
    }

def update_transfer(transfer_id: str, date, amount: float, from_account_id: int, to_account_id: int):
    """Updates the two transactions that make up a transfer."""
    conn = get_db_connection()
    # Get the IDs of the two transactions
    transactions = conn.execute("SELECT id, amount FROM transactions WHERE transfer_id = ?", (transfer_id,)).fetchall()
    if len(transactions) != 2:
        raise ValueError("Transfer not found or is inconsistent.")
        
    expense_tx_id = next(tx['id'] for tx in transactions if tx['amount'] < 0)
    income_tx_id = next(tx['id'] for tx in transactions if tx['amount'] > 0)

    # Update the expense transaction
    conn.execute("UPDATE transactions SET date = ?, amount = ?, account_id = ? WHERE id = ?",
                 (date, -abs(amount), from_account_id, expense_tx_id))
    # Update the income transaction
    conn.execute("UPDATE transactions SET date = ?, amount = ?, account_id = ? WHERE id = ?",
                 (date, abs(amount), to_account_id, income_tx_id))
    
    conn.commit()
    conn.close()
    return True