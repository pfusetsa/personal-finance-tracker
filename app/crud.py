# app/crud.py

from .database import get_db_connection
import pandas as pd
import httpx
import os
from datetime import datetime

# IMPORTANT: You need to get a Gemini API key from Google AI Studio
# and set it as an environment variable or paste it here.
# For example: API_KEY = "YOUR_GEMINI_API_KEY"
API_KEY = "" 
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={API_KEY}"

def get_db_schema():
    """Inspects the database and returns its schema as a string."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    schema_str = ""
    for table in tables:
        table_name = table['name']
        schema_str += f"Table '{table_name}':\n"
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        for column in columns:
            schema_str += f"  - {column['name']} ({column['type']})\n"
    
    conn.close()
    return schema_str

async def call_gemini_api(prompt):
    """Generic function to call the Gemini API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {'Content-Type': 'application/json'}
        
        response = await client.post(GEMINI_API_URL, json=payload, headers=headers)
        
        if response.status_code == 200:
            response_json = response.json()
            # Safely access the text part of the response
            try:
                return response_json['candidates'][0]['content']['parts'][0]['text']
            except (KeyError, IndexError):
                return "Error: Could not parse Gemini API response."
        else:
            return f"Error: Failed to call Gemini API. Status: {response.status_code}, Response: {response.text}"

async def execute_natural_language_query(user_query: str) -> str:
    """
    Takes a natural language query, converts it to SQL using an LLM,
    executes the SQL, and formats the result using an LLM.
    """
    db_schema = get_db_schema()
    today = datetime.today().strftime('%Y-%m-%d')

    # Step 1: Generate SQL from the natural language query
    sql_generation_prompt = f"""
    You are an expert SQLite database engineer. Your task is to write a single, precise SQL query to answer the user's question based on the provided database schema.

    Database Schema:
    {db_schema}

    User Question:
    "{user_query}"

    Rules:
    - Today's date is {today}.
    - Only output a single, valid SQLite query.
    - Do not include any explanations, comments, or markdown formatting like ```sql.
    - If the question cannot be answered with the given schema, return "I cannot answer this question."
    """
    
    generated_sql = await call_gemini_api(sql_generation_prompt)
    generated_sql = generated_sql.strip().replace('`', '') # Clean up the response

    if "I cannot answer this question" in generated_sql or not generated_sql.upper().startswith("SELECT"):
        return "I'm sorry, I can't answer that question with the available data."

    # Step 2: Execute the generated SQL query
    try:
        conn = get_db_connection()
        # Use pandas to execute the query and get a nice format
        result_df = pd.read_sql_query(generated_sql, conn)
        conn.close()
        data_result = result_df.to_string(index=False)
    except Exception as e:
        return f"I encountered an error trying to get your data: {e}"

    # Step 3: Format the result into a natural language response
    response_formatting_prompt = f"""
    You are a helpful financial assistant. Based on the user's question and the data result from the database, provide a concise, natural language answer.

    User Question: "{user_query}"
    Data Result:
    {data_result}

    Answer:
    """
    
    final_answer = await call_gemini_api(response_formatting_prompt)
    return final_answer

# --- The rest of the file remains the same ---
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
        transfer_category = cursor.execute("SELECT id FROM categories WHERE name = 'Transferencias'").fetchone()
        if not transfer_category:
            print("❌ Error: 'Transferencias' category not found in the database.")
            return
        transfer_category_id = transfer_category['id']
        cursor.execute("BEGIN")
        cursor.execute("INSERT INTO transactions (date, description, amount, is_recurrent, account_id, category_id) VALUES (?, ?, ?, ?, ?, ?)",(date, f"To {description}", -abs(amount), False, from_account_id, transfer_category_id))
        cursor.execute("INSERT INTO transactions (date, description, amount, is_recurrent, account_id, category_id) VALUES (?, ?, ?, ?, ?, ?)",(date, f"From {description}", abs(amount), False, to_account_id, transfer_category_id))
        conn.commit()
        print("Transfer recorded successfully. ✅")
    except Exception as e:
        conn.rollback() 
        print(f"❌ Error adding transfer: {e}")
    finally:
        conn.close()

def get_accounts():
    """Returns a list of all accounts, ordered by their ID."""
    conn = get_db_connection()
    accounts = conn.execute("SELECT id, name FROM accounts ORDER BY id").fetchall()
    conn.close()
    return accounts

def get_categories():
    """Returns a list of all categories, ordered by their ID."""
    conn = get_db_connection()
    categories = conn.execute("SELECT id, name FROM categories ORDER BY id").fetchall()
    conn.close()
    return categories

def get_balance_report():
    """Calculates and returns the balance for each account and the total balance."""
    conn = get_db_connection()
    query = "SELECT a.name, SUM(t.amount) as balance FROM transactions t JOIN accounts a ON t.account_id = a.id GROUP BY a.name ORDER BY a.id;"
    df = pd.read_sql_query(query, conn)
    conn.close()
    total_balance = df['balance'].sum()
    return df, total_balance

def get_monthly_report_df():
    """Returns a pandas DataFrame of expenses per category per month."""
    conn = get_db_connection()
    query = "SELECT strftime('%Y-%m', date) as month, c.name as category, SUM(t.amount) as total_expenses FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.amount < 0 GROUP BY month, category ORDER BY month, category;"
    df = pd.read_sql_query(query, conn)
    conn.close()
    df['total_expenses'] = df['total_expenses'].abs()
    pivot_df = df.pivot(index='month', columns='category', values='total_expenses').fillna(0)
    return pivot_df

def get_category_report_df(account_id=None):
    """Returns a DataFrame of expenses broken down by category."""
    conn = get_db_connection()
    base_query = "SELECT c.name as category, SUM(t.amount) as total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.amount < 0"
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
    query = "SELECT t.date, t.description, c.name as category, a.name as account, t.amount FROM transactions t JOIN categories c ON t.category_id = c.id JOIN accounts a ON t.account_id = a.id ORDER BY t.date DESC, t.id DESC LIMIT ?;"
    df = pd.read_sql_query(query, conn, params=[limit])
    conn.close()
    return df