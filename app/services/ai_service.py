# app/services/ai_service.py
import httpx
import pandas as pd
from datetime import datetime

from .. import crud
from ..config import GEMINI_API_URL, GEMINI_API_KEY

async def call_gemini_api(prompt: str):
    """
    Generic function to call the Gemini API.
    """
    if not GEMINI_API_KEY:
        return "Error: GEMINI_API_KEY is not set."

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            headers = {'Content-Type': 'application/json'}
            response = await client.post(f"{GEMINI_API_URL}?key={GEMINI_API_KEY}", json=payload, headers=headers)
            response.raise_for_status()
            response_json = response.json()
            return response_json['candidates'][0]['content']['parts'][0]['text']
        except (httpx.RequestError, KeyError, IndexError) as e:
            print(f"Error calling Gemini API: {e}")
            return "Error: Could not get a response from the AI model."

async def execute_natural_language_query(user_query: str) -> str:
    """
    Takes a natural language query, converts it to SQL, executes it,
    and formats the result into a natural language response.
    """
    db_schema = crud.get_db_schema_string()
    today = datetime.today().strftime('%Y-%m-%d')

    sql_generation_prompt = f"""
    You are an expert SQLite database engineer. Based on the database schema below, write a single, precise SQL query to answer the user's question.

    Database Schema:
    {db_schema}

    ---
    Here is an example of how to answer a user's question:
    User Question: "What was my total balance in July 2024?"
    SQL Query: SELECT SUM(amount) FROM transactions WHERE strftime('%Y-%m', date) = '2024-07';
    ---

    User Question:
    "{user_query}"

    Rules:
    - Today's date is {today}.
    - "Balance" is the `SUM(amount)` of transactions.
    - "Income" is `SUM(amount)` WHERE amount > 0.
    - "Expenses" is `SUM(ABS(amount))` WHERE amount < 0.
    - For date ranges, use `strftime('%Y-%m', date)`. For "August 2025", use `WHERE strftime('%Y-%m', date) = '2025-08'`.
    - Only output a single, valid SQLite query. Do not include explanations or markdown.
    - If the question cannot be answered, respond with the exact text: "I cannot answer this question."
    """

    generated_sql = await call_gemini_api(sql_generation_prompt)
    generated_sql = generated_sql.strip().replace('`', '').replace('sql', '')

    if "I cannot answer this question" in generated_sql or not generated_sql.upper().startswith("SELECT"):
        return "I'm sorry, I can't answer that question with the available data."

    try:
        conn = crud.get_db_connection()
        result_df = pd.read_sql_query(generated_sql, conn)
        conn.close()
        data_result = result_df.to_string(index=False) if not result_df.empty else "No results found."
    except Exception as e:
        return f"I tried to run a query, but it failed: {e}"

    response_formatting_prompt = f"""
    You are a helpful financial assistant. Based on the user's question and the data result, provide a concise and friendly natural language answer.
    Format all currency amounts in Euros (e.g., 1,234.56 €).

    User Question: "{user_query}"
    Data Result:
    {data_result}

    Answer:
    """

    final_answer = await call_gemini_api(response_formatting_prompt)
    return final_answer