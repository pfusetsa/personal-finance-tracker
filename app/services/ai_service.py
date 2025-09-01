# app/services/ai_service.py
import httpx
import pandas as pd
from datetime import datetime
from .. import crud
from ..config import GEMINI_API_URL, GEMINI_API_KEY

async def call_gemini_api(payload):
    if not GEMINI_API_KEY:
        return "Error: GEMINI_API_KEY is not set."
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            headers = {'Content-Type': 'application/json'}
            response = await client.post(f"{GEMINI_API_URL}?key={GEMINI_API_KEY}", json=payload, headers=headers)
            response.raise_for_status()
            response_json = response.json()
            return response_json['candidates'][0]['content']['parts'][0]['text']
        except (httpx.RequestError, KeyError, IndexError) as e:
            print(f"Error calling Gemini API: {e}")
            return "Error: Could not get a response from the AI model."

async def execute_natural_language_query(user_query: str, history: list, user_id: int):
    db_schema = crud.get_db_schema_string() # Calls the correct function name
    today = datetime.today().strftime('%Y-%m-%d')
    
    # Format history for the prompt
    history_string = "\n".join([f"{item['sender']}: {item['text']}" for item in history])
    
    system_instruction = f"""
You are TrakFin AI, a friendly and expert financial assistant for the TrakFin app.
Your goal is to help the user understand their finances by answering their questions.
You can query their financial database using SQLite. Today's date is {today}.
The user you are helping has the user_id: {user_id}.

**CRITICAL SECURITY RULE:** You MUST include a `WHERE user_id = {user_id}` clause in EVERY SQLite query you generate to ensure you only access this user's data. Do not query for any other user_id.

**INTERPRETATION RULE:** In the `transactions` table, a negative `amount` signifies an **expense** (money spent), and a positive `amount` signifies **income** (money received). When reporting on total 'spending' or 'expenses', you should look for negative amounts but present the final sum as a positive number (e.g., "You spent 453.00 €").

DATABASE SCHEMA:
{db_schema}

When the user asks a question, first decide if you need to query the database.
1.  If the question is about their financial data (spending, income, balance, categories), you MUST generate a SQLite query that follows the security rule above.
    - Your only output should be the SQLite query, wrapped in `[SQL]` tags. Example: `[SQL]SELECT SUM(amount) FROM transactions WHERE user_id = {user_id};[/SQL]`
    - Use the chat history to understand context for follow-up questions (e.g., "what about last month?").
2.  If the question is a greeting or general financial advice, just answer conversationally. Do not use `[SQL]` tags.

Chat History (for context):
{history_string}
"""
    
    # Construct the Gemini API payload with a simplified history structure
    contents = [
        {"role": "user", "parts": [{"text": system_instruction}]},
        {"role": "model", "parts": [{"text": "Understood. I am TrakFin AI, ready to help."}]}
    ]
    # Add the current user query last
    contents.append({"role": "user", "parts": [{"text": user_query}]})
    
    payload = {"contents": contents}
    
    ai_response = await call_gemini_api(payload)
    ai_response = ai_response.strip()

    if ai_response.startswith("[SQL]") and ai_response.endswith("[/SQL]"):
        sql_query = ai_response.replace("[SQL]", "").replace("[/SQL]", "").strip()
        print(f"🤖 TrakFin AI Generated SQL: {sql_query}")
        
        try:
            conn = crud.get_db_connection()
            result_df = pd.read_sql_query(sql_query, conn)
            conn.close()
            data_result = result_df.to_string(index=False) if not result_df.empty else "No results found."
        except Exception as e:
            return f"I tried to run a query, but it failed. Please ask your question differently. (Error: {e})"
            
        formatting_prompt = f"The user originally asked: '{user_query}'. You decided to run the SQL query: '{sql_query}'. The result from the database is: \n{data_result}\n. Based on this data, please present a final, friendly answer to the user. Format all currency amounts in Euros (e.g., 1,234.56 €)."
        
        # Create a new, clean payload for the final formatting step
        final_payload = {"contents": [{"role": "user", "parts": [{"text": formatting_prompt}]}]}
        final_answer = await call_gemini_api(final_payload)
        return final_answer
    else:
        return ai_response