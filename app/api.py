# app/api.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date

from . import crud

# --- Pydantic Models for Request Data ---
# These models define the structure and data types for incoming API requests.
# FastAPI uses them to validate data automatically.

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

# Create an instance of the FastAPI class
app = FastAPI(
    title="Personal Finance Tracker API",
    description="API for managing personal finances, built with FastAPI.",
    version="1.0.0",
)

# --- API Endpoints ---

@app.get("/")
def read_root():
    """A default root endpoint to confirm the API is running."""
    return {"message": "Welcome to the Personal Finance Tracker API!"}

# --- GET Endpoints (Reading Data) ---

@app.get("/accounts/")
def get_all_accounts():
    """Fetches all financial accounts from the database."""
    return crud.get_accounts()

@app.get("/categories/")
def get_all_categories():
    """Fetches all transaction categories from the database."""
    return crud.get_categories()

@app.get("/transactions/")
def get_all_transactions(limit: int = 50):
    """Fetches the most recent transactions."""
    transactions_df = crud.get_all_transactions_df(limit)
    return transactions_df.to_dict(orient="records")

@app.get("/reports/balance/")
def get_balance_report():
    """Generates and returns the current balance report."""
    report_df, total_balance = crud.get_balance_report()
    return {
        "balances_by_account": report_df.to_dict(orient="records"),
        "total_balance": total_balance
    }

@app.get("/reports/monthly/")
def get_monthly_report():
    """Generates and returns the monthly expense report."""
    report_df = crud.get_monthly_report_df()
    # Resetting index to make the 'month' column available in the JSON
    report_df = report_df.reset_index()
    return report_df.to_dict(orient="records")

@app.get("/reports/category/")
def get_category_report(account_id: Optional[int] = None):
    """
    Generates the category expense report.
    Optionally filters by account_id.
    """
    report_df = crud.get_category_report_df(account_id)
    return report_df.to_dict(orient="records")

# --- POST Endpoints (Creating Data) ---

@app.post("/transactions/")
def create_transaction(transaction: TransactionCreate):
    """
    Creates a new transaction.
    The request body must match the TransactionCreate model.
    """
    try:
        crud.add_transaction(
            date=transaction.date,
            description=transaction.description,
            amount=transaction.amount,
            is_recurrent=transaction.is_recurrent,
            account_id=transaction.account_id,
            category_id=transaction.category_id
        )
        return {"status": "success", "message": "Transaction created."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/transfers/")
def create_transfer(transfer: TransferCreate):
    """
    Creates a new transfer between accounts.
    The request body must match the TransferCreate model.
    """
    try:
        from_name = next(acc['name'] for acc in crud.get_accounts() if acc['id'] == transfer.from_account_id)
        to_name = next(acc['name'] for acc in crud.get_accounts() if acc['id'] == transfer.to_account_id)
        description = f"Transfer from {from_name} to {to_name}"

        crud.add_transfer(
            date=transfer.date,
            description=description,
            amount=transfer.amount,
            from_account_id=transfer.from_account_id,
            to_account_id=transfer.to_account_id
        )
        return {"status": "success", "message": "Transfer created."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))