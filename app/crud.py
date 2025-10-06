import pandas as pd
from typing import Optional
import sqlite3
import os
from contextlib import contextmanager

# Hardcoded exchange rates relative to EUR
EXCHANGE_RATES = {
    'EUR': 1.0,
    'USD': 0.92, # 1 EUR = 1.08 USD -> 1 USD = 0.92 EUR
    'GBP': 1.18, # 1 EUR = 0.85 GBP -> 1 GBP = 1.18 EUR
}

@contextmanager
def get_db_connection():
    """Provides a database connection using a context manager."""
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'trakfin.db')
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH, timeout=10)
        conn.row_factory = sqlite3.Row
        yield conn
    finally:
        if conn:
            conn.close()
             


# --- Users ------------------------------------------------------------------------------------------------------
def create_user(first_name: str, second_name: Optional[str], surname: str):
    """Adds a new user to the database and returns their ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (first_name, second_name, surname) VALUES (?, ?, ?)",
            (first_name, second_name, surname)
        )
        conn.commit()
        user_id = cursor.lastrowid
        return user_id

def get_users():
    """Retrieves all users from the database."""
    with get_db_connection() as conn:
        users = conn.execute("SELECT id, first_name, second_name, surname FROM users ORDER BY first_name, surname").fetchall()
        return [dict(row) for row in users]


# --- Schema Function ------------------------------------------------------------------------------------------------------
def get_db_schema_string():
    with get_db_connection() as conn:
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
        return schema_str


# --- Accounts ------------------------------------------------------------------------------------------------------
def add_account(name, user_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO accounts (name, user_id) VALUES (?, ?)", (name, user_id))
        conn.commit()
        account_id = cursor.lastrowid
        return account_id

def get_accounts(user_id):
    with get_db_connection() as conn:
        accounts = conn.execute("SELECT id, name FROM accounts WHERE user_id = ? ORDER BY name COLLATE NOCASE", (user_id,)).fetchall()
        return [dict(row) for row in accounts]

def get_account_by_id(account_id, user_id):
    with get_db_connection() as conn:
        account = conn.execute("SELECT id, name FROM accounts WHERE id = ? AND user_id = ?", (account_id, user_id)).fetchone()
        return dict(account) if account else None

def update_account(account_id, name, user_id):
    with get_db_connection() as conn:
        conn.execute("UPDATE accounts SET name = ? WHERE id = ? AND user_id = ?", (name, account_id, user_id))
        conn.commit()
        return True

def delete_account(account_id, user_id):
    with get_db_connection() as conn:
        conn.execute("DELETE FROM accounts WHERE id = ? AND user_id = ?", (account_id, user_id))
        conn.commit()
        return True

def get_transaction_count_for_account(account_id, user_id):
    with get_db_connection() as conn:
        count = conn.execute("SELECT COUNT(id) FROM transactions WHERE account_id = ? AND user_id = ?", (account_id, user_id)).fetchone()[0]
        return count

def reassign_transactions_from_account(from_account_id, to_account_id, user_id):
    with get_db_connection() as conn:
        conn.execute("UPDATE transactions SET account_id = ? WHERE account_id = ? AND user_id = ?", (to_account_id, from_account_id, user_id))
        conn.commit()

def delete_transactions_by_account(account_id, user_id):
    with get_db_connection() as conn:
        conn.execute("DELETE FROM transactions WHERE account_id = ? AND user_id = ?", (account_id, user_id))
        conn.commit()


# --- Categories ------------------------------------------------------------------------------------------------------
def add_category(category_name: str, user_id: int, i18n_key: str | None = None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO categories (name, user_id, i18n_key) VALUES (?, ?, ?)", 
            (category_name, user_id, i18n_key)
        )
        conn.commit()
        category_id = cursor.lastrowid
        return category_id

def get_categories(user_id):
    with get_db_connection() as conn:
        categories = conn.execute(
            "SELECT id, name, i18n_key FROM categories WHERE user_id = ? ORDER BY name COLLATE NOCASE", 
            (user_id,)
        ).fetchall()
        return [dict(row) for row in categories]

def get_category_by_name(category_name, user_id):
    with get_db_connection() as conn:
        category = conn.execute("SELECT id, name FROM categories WHERE name = ? AND user_id = ?", (category_name, user_id)).fetchone()
        return dict(category) if category else None

def update_category(category_id: int, name: str, user_id: int, i18n_key: str | None):
    with get_db_connection() as conn:
        conn.execute(
            "UPDATE categories SET name = ?, i18n_key = ? WHERE id = ? AND user_id = ?", 
            (name, i18n_key, category_id, user_id)
        )
        conn.commit()
        return True

def delete_category(category_id, user_id):
    with get_db_connection() as conn:
        conn.execute("DELETE FROM categories WHERE id = ? AND user_id = ?", (category_id, user_id))
        conn.commit()
        return True

def get_transaction_count_for_category(category_id, user_id):
    with get_db_connection() as conn:
        count = conn.execute("SELECT COUNT(id) FROM transactions WHERE category_id = ? AND user_id = ?", (category_id, user_id)).fetchone()[0]
        return count

def recategorize_transactions(from_category_id, to_category_id, user_id):
    with get_db_connection() as conn:
        conn.execute("UPDATE transactions SET category_id = ? WHERE category_id = ? AND user_id = ?", (to_category_id, from_category_id, user_id))
        conn.commit()     

def delete_transactions_by_category(category_id, user_id):
    with get_db_connection() as conn:
        conn.execute("DELETE FROM transactions WHERE category_id = ? AND user_id = ?", (category_id, user_id))
        conn.commit()     


# --- Setting Functions ------------------------------------------------------------------------------------------------------
def get_setting(key, user_id):
    with get_db_connection() as conn:
        value = conn.execute("SELECT value FROM settings WHERE key = ? AND user_id = ?", (key, user_id)).fetchone()
        return value[0] if value else None

def update_setting(key, value, user_id):
    with get_db_connection() as conn:
        conn.execute("INSERT OR REPLACE INTO settings (key, value, user_id) VALUES (?, ?, ?)", (key, str(value), user_id))
        conn.commit()


# --- Transactions ------------------------------------------------------------------------------------------------------
def add_transaction(date, description, amount, currency, is_recurrent, account_id, category_id, user_id, transfer_id=None, recurrence_end_date=None, recurrence_id=None, status='confirmed', recurrence_num=None, recurrence_unit=None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO transactions 
               (date, description, amount, currency, is_recurrent, account_id, category_id, user_id, transfer_id, recurrence_end_date, recurrence_id, status, recurrence_num, recurrence_unit) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (date, description, amount, currency, is_recurrent, account_id, category_id, user_id, transfer_id, recurrence_end_date, recurrence_id, status, recurrence_num, recurrence_unit)
        )
        new_id = cursor.lastrowid
        conn.commit()
        return new_id

def update_transaction(transaction_id: int, user_id: int, updates: dict):
    """Dynamically updates specific fields of a transaction."""
    with get_db_connection() as conn:
        # Filter out any keys with a value of None, so we don't overwrite fields
        valid_updates = {k: v for k, v in updates.items() if v is not None}
        
        if not valid_updates:
            return True # Nothing to update

        set_clause = ", ".join([f"{key} = ?" for key in valid_updates.keys()])
        params = list(valid_updates.values())
        params.extend([transaction_id, user_id])
        
        query = f"UPDATE transactions SET {set_clause} WHERE id = ? AND user_id = ?"
        conn.execute(query, params)
        conn.commit()
    return True

def delete_transaction(transaction_id, user_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT transfer_id, recurrence_id FROM transactions WHERE id = ? AND user_id = ?", (transaction_id, user_id))
        result = cursor.fetchone()
        
        if not result:
            return True # Transaction doesn't exist or was already deleted

        transfer_id = result['transfer_id']
        recurrence_id = result['recurrence_id']

        if recurrence_id:
            # First, delete all 'pending' transactions in the series
            conn.execute(
                "DELETE FROM transactions WHERE recurrence_id = ? AND user_id = ? AND status = 'pending'",
                (recurrence_id, user_id)
            )
            # Then, delete the specific transaction the user clicked on (if it wasn't already pending)
            conn.execute(
                "DELETE FROM transactions WHERE id = ? AND user_id = ?",
                (transaction_id, user_id)
            )
        elif transfer_id:
            # If it's a transfer, delete both sides
            conn.execute("DELETE FROM transactions WHERE transfer_id = ? AND user_id = ?", (transfer_id, user_id))
        else:
            # Otherwise, just delete the single transaction
            conn.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?", (transaction_id, user_id))
        
        conn.commit()
        return True
    
def delete_pending_transactions_by_recurrence_id(recurrence_id: str, user_id: int):
    """Deletes all 'pending' transactions belonging to a specific recurrence series."""
    with get_db_connection() as conn:
        conn.execute(
            "DELETE FROM transactions WHERE recurrence_id = ? AND user_id = ? AND status = 'pending'",
            (recurrence_id, user_id)
        )
        conn.commit()

def get_all_transactions(
    user_id, page=1, page_size=10, account_ids=None, category_ids=None, start_date=None, end_date=None, 
    search_query=None, is_recurrent=None, amount_min=None, amount_max=None,
    sort_by='date', sort_order='desc'
):
    with get_db_connection() as conn:
        base_query = "FROM transactions t JOIN categories c ON t.category_id = c.id JOIN accounts a ON t.account_id = a.id"
        where_clauses = ["t.user_id = ?", "(t.status = 'confirmed' OR t.date <= date('now'))"]
        params = [user_id]
        
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
        select_statement = "SELECT t.id, t.date, t.description, c.name as category_name, c.i18n_key as category_i18n_key, a.name as account, t.amount, t.currency, t.account_id, t.category_id, t.is_recurrent, t.transfer_id, t.status, t.recurrence_id"
        paginated_query = f"{select_statement} {base_query} {where_statement} {order_by_statement} LIMIT ? OFFSET ?;"
        paginated_params = params + [page_size, offset]
        
        df = pd.read_sql_query(paginated_query, conn, params=paginated_params)
        
        return df, total_count
    
def get_transaction_by_id(transaction_id: int, user_id: int):
    """Fetches a single transaction by its ID."""
    with get_db_connection() as conn:
        transaction = conn.execute("SELECT * FROM transactions WHERE id = ? AND user_id = ?", (transaction_id, user_id)).fetchone()
        return dict(transaction) if transaction else None


# --- Trasnfer ------------------------------------------------------------------------------------------------------    
def get_transfer(transfer_id: str, user_id: int):
    with get_db_connection() as conn:
        transfer_rows = conn.execute("SELECT * FROM transactions WHERE transfer_id = ? AND user_id = ? ORDER BY amount DESC", (transfer_id, user_id)).fetchall()
        
        
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

def update_transfer(transfer_id: str, date, amount: float, from_account_id: int, to_account_id: int, user_id: int):
    with get_db_connection() as conn:
        transactions = conn.execute("SELECT id, amount FROM transactions WHERE transfer_id = ? AND user_id = ?", (transfer_id, user_id)).fetchall()
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
        
        return True
    
def process_batch_instructions(instructions: list, user_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("BEGIN TRANSACTION;")
            processed_ids = []
            for instruction in instructions:
                action = instruction.get('action')
                tx_id = instruction.get('transaction_id')
                if action == 'delete':
                    cursor.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id))
                elif action == 'recategorize':
                    target_id = instruction.get('target_category_id')
                    cursor.execute(
                        "UPDATE transactions SET category_id = ? WHERE id = ? AND user_id = ?",
                        (target_id, tx_id, user_id)
                    )
                processed_ids.append(tx_id)
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            return {"status": "success", "processed_ids": processed_ids}


# --- Reports & Charts ------------------------------------------------------------------------------------------------------
def get_balance_report(user_id):
    with get_db_connection() as conn:
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
        LEFT JOIN transactions t ON a.id = t.account_id AND t.user_id = a.user_id AND t.status = 'confirmed'
        WHERE a.user_id = ?
        GROUP BY a.name
        ORDER BY a.name;
        """
        df = pd.read_sql_query(query, conn, params=[user_id])
        total_balance = df['balance'].sum() if not df.empty else 0
        return df, total_balance

def get_balance_evolution_report(user_id):
    with get_db_connection() as conn:
        query = f"""
        WITH daily_changes AS (
            SELECT date, SUM(amount * CASE currency
                WHEN 'EUR' THEN {EXCHANGE_RATES['EUR']} WHEN 'USD' THEN {EXCHANGE_RATES['USD']}
                WHEN 'GBP' THEN {EXCHANGE_RATES['GBP']} ELSE 1.0 END
            ) as change FROM transactions WHERE user_id = ? AND status = 'confirmed' GROUP BY date
        )
        SELECT date, SUM(change) OVER (ORDER BY date) as cumulative_balance FROM daily_changes ORDER BY date;
        """
        df = pd.read_sql_query(query, conn, params=[user_id])
        return df

def get_category_summary_for_chart(user_id, start_date: str, end_date: str, transaction_type: str = 'expense'):
    with get_db_connection() as conn:
        base_query = """
            SELECT c.name as category, SUM(t.amount) as total
            FROM transactions t INNER JOIN categories c ON t.category_id = c.id
        """
        where_clauses = ["t.user_id = ?", "t.status = 'confirmed'"]
        params = [user_id]
        
        if start_date: where_clauses.append("t.date >= ?"); params.append(start_date)
        if end_date: where_clauses.append("t.date <= ?"); params.append(end_date)
        
        transfer_category_id = get_setting('transfer_category_id', user_id)
        if transfer_category_id:
            where_clauses.append("t.category_id != ?"); params.append(transfer_category_id)

        if transaction_type == 'income': where_clauses.append("t.amount > 0")
        elif transaction_type == 'expense': where_clauses.append("t.amount < 0")

        where_statement = "WHERE " + " AND ".join(where_clauses)
        group_by_statement = " GROUP BY c.name HAVING total != 0 ORDER BY ABS(total) DESC"
        
        final_query = base_query + where_statement + group_by_statement
        df = pd.read_sql_query(final_query, conn, params=params)
        
        return df

def get_monthly_income_expense_summary(user_id, start_date: str, end_date: str):
    with get_db_connection() as conn:
        base_query = """
            SELECT
                strftime('%Y-%m', t.date) as month,
                SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
                SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as expenses
            FROM transactions t
        """
        where_clauses = ["t.user_id = ?", "t.status = 'confirmed'"]
        params = [user_id]

        if start_date: where_clauses.append("t.date >= ?"); params.append(start_date)
        if end_date: where_clauses.append("t.date <= ?"); params.append(end_date)

        transfer_category_id = get_setting('transfer_category_id', user_id)
        if transfer_category_id:
            where_clauses.append("t.category_id != ?"); params.append(transfer_category_id)
            
        where_statement = "WHERE " + " AND ".join(where_clauses)
        # FIX: Using the full expression instead of the alias 'month'
        group_by_statement = " GROUP BY strftime('%Y-%m', t.date) ORDER BY strftime('%Y-%m', t.date)"
        
        final_query = base_query + where_statement + group_by_statement
        df = pd.read_sql_query(final_query, conn, params=params)
        
        return df

def get_recurrent_summary(user_id, start_date: str, end_date: str):
    with get_db_connection() as conn:
        base_query = """
            SELECT c.name as category,
                SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
                SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as expenses
            FROM transactions t INNER JOIN categories c ON t.category_id = c.id
        """
        where_clauses = ["t.is_recurrent = 1", "t.user_id = ?", "t.status = 'confirmed'"]
        params = [user_id]

        if start_date: where_clauses.append("t.date >= ?"); params.append(start_date)
        if end_date: where_clauses.append("t.date <= ?"); params.append(end_date)

        transfer_category_id = get_setting('transfer_category_id', user_id)
        if transfer_category_id:
            where_clauses.append("t.category_id != ?"); params.append(transfer_category_id)

        where_statement = "WHERE " + " AND ".join(where_clauses)
        group_by_statement = " GROUP BY c.name HAVING income > 0 OR expenses > 0 ORDER BY expenses DESC, income DESC"

        final_query = base_query + where_statement + group_by_statement
        df = pd.read_sql_query(final_query, conn, params=params)
        
        return df