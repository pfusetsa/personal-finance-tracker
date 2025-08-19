# app/crud.py

from .database import get_db_connection
import pandas as pd
import httpx
import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={API_KEY}"

def get_db_schema():
    """Inspects the database and returns its schema as a string."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    schema_str = "Here are the table schemas:\n"
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    for table in tables:
        table_name = table['name']
        schema_str += f"\nTable '{table_name}':\n"
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        for column in columns:
            schema_str += f"  - Column '{column['name']}' has type '{column['type']}'\n"
    
    conn.close()
    return schema_str

async def call_gemini_api(prompt):
    """
    Generic function to call the Gemini API with retry logic for 503 errors.
    """
    if not API_KEY:
        return "Error: GEMINI_API_KEY is not set in your .env file."

    max_retries = 3
    base_delay = 1  # in seconds

    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(max_retries):
            try:
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                headers = {'Content-Type': 'application/json'}
                
                response = await client.post(GEMINI_API_URL, json=payload, headers=headers)
                
                if response.status_code == 503:
                    print(f"⚠️ API is overloaded. Retrying in {base_delay * (2 ** attempt)}s... (Attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(base_delay * (2 ** attempt))
                    continue

                response.raise_for_status()

                response_json = response.json()
                try:
                    return response_json['candidates'][0]['content']['parts'][0]['text']
                except (KeyError, IndexError):
                    return "Error: Could not parse Gemini API response."

            except httpx.RequestError as e:
                return f"Error: A network error occurred: {e}"
            except Exception as e:
                return f"An unexpected error occurred: {e}"
        
        return "Error: The AI model is currently unavailable after multiple retries. Please try again later."


async def execute_natural_language_query(user_query: str) -> str:
    """
    Takes a natural language query, converts it to SQL, executes it,
    and formats the result into a natural language response.
    """
    db_schema = get_db_schema()
    today = datetime.today().strftime('%Y-%m-%d')

    sql_generation_prompt = f"""
    You are an expert SQLite database engineer. Based on the database schema below, write a single, precise SQL query to answer the user's question.

    Database Schema:
    {db_schema}

    User Question:
    "{user_query}"

    Important Rules:
    - Today's date is {today}.
    - "Income" or "earnings" refers to transactions where the 'amount' is greater than 0.
    - "Spending" or "expenses" refers to transactions where the 'amount' is less than 0. When summing expenses, sum the absolute values to get a positive number.
    - For questions about "this month" or "last month", use strftime functions with date('now').
    - Only output a single, valid SQLite query.
    - DO NOT include any explanations, comments, or markdown formatting like ```sql.
    - If the question cannot be answered, your only response should be the exact text: "I cannot answer this question."
    """
    
    generated_sql = await call_gemini_api(sql_generation_prompt)
    generated_sql = generated_sql.strip().replace('`', '').replace('sql', '')

    print(f"🤖 AI Generated SQL: {generated_sql}")

    if "I cannot answer this question" in generated_sql or not generated_sql.upper().startswith("SELECT"):
        return "I'm sorry, I can't answer that question with the available data."

    try:
        conn = get_db_connection()
        result_df = pd.read_sql_query(generated_sql, conn)
        conn.close()
        data_result = result_df.to_string(index=False) if not result_df.empty else "No results found."
    except Exception as e:
        return f"I tried to run a query, but it failed: {e}"

    response_formatting_prompt = f"""
    You are a helpful financial assistant. Based on the user's original question and the data result from the database, provide a concise and friendly natural language answer.

    User Question: "{user_query}"
    Data Result:
    {data_result}

    Important Rules:
    - CRITICAL: All financial amounts MUST be formatted in Euros. The currency symbol (€) must come AFTER the number with a space (e.g., 1,234.56 €).

    Answer:
    """
    
    final_answer = await call_gemini_api(response_formatting_prompt)
    return final_answer

# --- C.R.U.D. Functions ---

def add_transaction(date, description, amount, is_recurrent, account_id, category_id):
    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO transactions (date, description, amount, is_recurrent, account_id, category_id) VALUES (?, ?, ?, ?, ?, ?)", (date, description, amount, is_recurrent, account_id, category_id))
        conn.commit()
    finally:
        conn.close()

def add_transfer(date, description, amount, from_account_id, to_account_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        transfer_category = cursor.execute("SELECT id FROM categories WHERE name = 'Transferencias'").fetchone()
        if not transfer_category: return
        transfer_category_id = transfer_category['id']
        cursor.execute("BEGIN")
        cursor.execute("INSERT INTO transactions (date, description, amount, is_recurrent, account_id, category_id) VALUES (?, ?, ?, ?, ?, ?)",(date, f"To {description}", -abs(amount), False, from_account_id, transfer_category_id))
        cursor.execute("INSERT INTO transactions (date, description, amount, is_recurrent, account_id, category_id) VALUES (?, ?, ?, ?, ?, ?)",(date, f"From {description}", abs(amount), False, to_account_id, transfer_category_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
    finally:
        conn.close()

def update_transaction(transaction_id, date, description, amount, is_recurrent, account_id, category_id):
    """Updates an existing transaction in the database."""
    conn = get_db_connection()
    try:
        conn.execute(
            """
            UPDATE transactions
            SET date = ?, description = ?, amount = ?, is_recurrent = ?, account_id = ?, category_id = ?
            WHERE id = ?
            """,
            (date, description, amount, is_recurrent, account_id, category_id, transaction_id)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"❌ Error updating transaction: {e}")
        return False
    finally:
        conn.close()

def delete_transaction(transaction_id):
    """Deletes a transaction from the database by its ID."""
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"❌ Error deleting transaction: {e}")
        return False
    finally:
        conn.close()

def get_accounts():
    conn = get_db_connection()
    accounts = conn.execute("SELECT id, name FROM accounts ORDER BY id").fetchall()
    conn.close()
    return accounts

def get_categories():
    conn = get_db_connection()
    categories = conn.execute("SELECT id, name FROM categories ORDER BY id").fetchall()
    conn.close()
    return categories

def get_balance_report():
    conn = get_db_connection()
    df = pd.read_sql_query("SELECT a.name, SUM(t.amount) as balance FROM transactions t JOIN accounts a ON t.account_id = a.id GROUP BY a.name ORDER BY a.id;", conn)
    conn.close()
    return df, df['balance'].sum()

def get_monthly_report_df():
    conn = get_db_connection()
    df = pd.read_sql_query("SELECT strftime('%Y-%m', date) as month, c.name as category, SUM(t.amount) as total_expenses FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.amount < 0 GROUP BY month, category ORDER BY month, category;", conn)
    conn.close()
    df['total_expenses'] = df['total_expenses'].abs()
    return df.pivot(index='month', columns='category', values='total_expenses').fillna(0)

def get_category_report_df(account_id=None):
    conn = get_db_connection()
    query = "SELECT c.name as category, SUM(t.amount) as total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.amount < 0"
    params = []
    if account_id:
        query += " AND t.account_id = ?"
        params.append(account_id)
    query += " GROUP BY c.name ORDER BY total ASC"
    df = pd.read_sql_query(query, conn, params=params)
    df['total'] = df['total'].abs()
    conn.close()
    return df

def get_all_transactions(page=1, page_size=10):
    """Returns a paginated DataFrame of transactions, including their IDs and total count."""
    conn = get_db_connection()
    offset = (page - 1) * page_size
    query = "SELECT t.id, t.date, t.description, c.name as category, a.name as account, t.amount, t.account_id, t.category_id, t.is_recurrent FROM transactions t JOIN categories c ON t.category_id = c.id JOIN accounts a ON t.account_id = a.id ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?;"
    df = pd.read_sql_query(query, conn, params=[page_size, offset])
    total_count = conn.execute("SELECT COUNT(id) FROM transactions").fetchone()[0]
    conn.close()
    return df, total_count

def get_category_summary_for_chart(start_date: str, end_date: str, transaction_type: str = 'expense'):
    """Calculates total amounts per category for a given period and transaction type."""
    conn = get_db_connection()
    
    type_filter = "t.amount < 0" # Default to expenses
    if transaction_type == 'income':
        type_filter = "t.amount > 0"
    elif transaction_type == 'both':
        type_filter = "c.name != 'Transferencias'"

    query = f"""
        SELECT
            c.name as category,
            SUM(ABS(t.amount)) as total
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE {type_filter} AND t.date BETWEEN ? AND ?
        GROUP BY c.name
        HAVING total > 0
        ORDER BY total DESC;
    """
    df = pd.read_sql_query(query, conn, params=[start_date, end_date])
    conn.close()
    return df

def get_monthly_income_expense_summary(start_date: str, end_date: str):
    """Calculates total income and expenses per month for a given date range."""
    conn = get_db_connection()
    
    query = """
        SELECT
            strftime('%Y-%m', date) as month,
            SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
        FROM transactions
        WHERE date BETWEEN ? AND ?
        GROUP BY month
        ORDER BY month;
    """
    df = pd.read_sql_query(query, conn, params=[start_date, end_date])
    conn.close()
    return df

def get_recurrent_summary(start_date: str, end_date: str):
    """Calculates total recurrent income and expenses per category for a given date range."""
    conn = get_db_connection()
    query = """
        SELECT
            c.name as category,
            SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
            SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as expenses
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.is_recurrent = 1 AND t.date BETWEEN ? AND ?
        GROUP BY c.name
        HAVING income > 0 OR expenses > 0
        ORDER BY expenses DESC, income DESC;
    """
    df = pd.read_sql_query(query, conn, params=[start_date, end_date])
    conn.close()
    return df