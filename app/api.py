# app/api.py

from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
from typing import Optional
from datetime import date

from fastapi.middleware.cors import CORSMiddleware

from . import crud

# --- Pydantic Models ---
class TransactionCreate(BaseModel):
    date: date
    description: str
    amount: float
    is_recurrent: bool
    account_id: int
    category_id: int

class TransferCreate(BaseModel):
    date: date
    amount: float
    from_account_id: int
    to_account_id: int

class ChatQuery(BaseModel):
    query: str

# --- FastAPI App Instance & CORS ---
app = FastAPI(
    title="Personal Finance Tracker API",
    description="API for managing personal finances, built with FastAPI.",
    version="1.0.0",
)

origins = ["http://localhost", "http://localhost:8080", "http://127.0.0.1:8000", "null"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Personal Finance Tracker API!"}

@app.get("/accounts/")
def get_all_accounts():
    return crud.get_accounts()

@app.get("/categories/")
def get_all_categories():
    return crud.get_categories()

@app.get("/transactions/")
def get_all_transactions(page: int = 1, page_size: int = 10):
    transactions_df, total_count = crud.get_all_transactions(page, page_size)
    return {
        "transactions": transactions_df.to_dict(orient="records"),
        "total_count": total_count,
        "page": page,
        "page_size": page_size
    }

@app.get("/reports/balance/")
def get_balance_report():
    report_df, total_balance = crud.get_balance_report()
    return {"balances_by_account": report_df.to_dict(orient="records"), "total_balance": total_balance}

@app.get("/reports/monthly/")
def get_monthly_report():
    report_df = crud.get_monthly_report_df()
    report_df = report_df.reset_index()
    return report_df.to_dict(orient="records")

@app.get("/reports/category/")
def get_category_report(account_id: Optional[int] = None):
    report_df = crud.get_category_report_df(account_id)
    return report_df.to_dict(orient="records")

@app.get("/reports/category-summary/")
def get_category_summary_for_chart(start_date: date, end_date: date, transaction_type: str = 'expense'):
    """Endpoint to get data formatted for the doughnut chart."""
    report_df = crud.get_category_summary_for_chart(str(start_date), str(end_date), transaction_type)
    return report_df.to_dict(orient="records")

@app.get("/reports/monthly-income-expense-summary/")
def get_monthly_income_expense_summary(start_date: date, end_date: date):
    """Endpoint to get data for the monthly income vs. expense bar chart."""
    report_df = crud.get_monthly_income_expense_summary(str(start_date), str(end_date))
    return report_df.to_dict(orient="records")

@app.get("/reports/recurrent-summary/")
def get_recurrent_summary(start_date: date, end_date: date):
    """Endpoint to get data for the recurrent transactions chart."""
    report_df = crud.get_recurrent_summary(str(start_date), str(end_date))
    return report_df.to_dict(orient="records")

@app.post("/transactions/")
def create_transaction(transaction: TransactionCreate):
    try:
        crud.add_transaction(date=transaction.date, description=transaction.description, amount=transaction.amount, is_recurrent=transaction.is_recurrent, account_id=transaction.account_id, category_id=transaction.category_id)
        return {"status": "success", "message": "Transaction created."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/transactions/{transaction_id}")
def update_transaction(transaction_id: int, transaction: TransactionCreate):
    """Updates an existing transaction."""
    success = crud.update_transaction(
        transaction_id=transaction_id,
        date=transaction.date,
        description=transaction.description,
        amount=transaction.amount,
        is_recurrent=transaction.is_recurrent,
        account_id=transaction.account_id,
        category_id=transaction.category_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found or could not be updated.")
    return {"status": "success", "message": "Transaction updated."}

@app.delete("/transactions/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int):
    """Deletes a transaction."""
    success = crud.delete_transaction(transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    return Response(status_code=204)


@app.post("/transfers/")
def create_transfer(transfer: TransferCreate):
    try:
        from_name = next(acc['name'] for acc in crud.get_accounts() if acc['id'] == transfer.from_account_id)
        to_name = next(acc['name'] for acc in crud.get_accounts() if acc['id'] == transfer.to_account_id)
        description = f"Transfer from {from_name} to {to_name}"
        crud.add_transfer(date=transfer.date, description=description, amount=transfer.amount, from_account_id=transfer.from_account_id, to_account_id=transfer.to_account_id)
        return {"status": "success", "message": "Transfer created."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/chat/")
async def handle_chat(query: ChatQuery):
    """
    Handles a natural language query from the user by converting it to SQL.
    """
    try:
        response_text = await crud.execute_natural_language_query(query.query)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")