# app/api.py
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
from typing import Optional
from datetime import date
from fastapi.middleware.cors import CORSMiddleware
import sqlite3

from . import crud
from .services import transaction_service, ai_service # Import services

# --- Pydantic Models ---
class TransactionCreate(BaseModel):
    date: date
    description: str
    amount: float
    currency: str
    is_recurrent: bool
    account_id: int
    category_id: int

class TransferCreate(BaseModel):
    date: date
    description: str # Add this line
    amount: float
    from_account_id: int
    to_account_id: int

class ChatQuery(BaseModel):
    query: str
    history: Optional[list] = []

class CategoryDeleteOptions(BaseModel):
    strategy: str  # 'recategorize' or 'delete_transactions'
    target_category_id: Optional[int] = None

class AccountUpdate(BaseModel):
    name: str

class CategoryDeleteOptions(BaseModel):
    strategy: str  # 'recategorize' or 'delete_transactions'
    target_category_id: Optional[int] = None

class CategoryUpdate(BaseModel):
    name: str

class AccountDeleteOptions(BaseModel):
    strategy: str  # 'reassign' or 'delete_transactions'
    target_account_id: Optional[int] = None

# --- FastAPI App Instance & CORS ---
app = FastAPI(
    title="Personal Finance Tracker API",
    description="API for managing personal finances, built with FastAPI.",
    version="1.0.0",
)

origins = ["http://localhost:5173", "http://localhost", "http://localhost:8080", "http://127.0.0.1:8000", "null"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Personal Finance Tracker API!"}

# --- Lookups ---
@app.get("/accounts/")
def get_all_accounts():
    return crud.get_accounts()

@app.get("/accounts/{account_id}/transaction_count")
def get_account_transaction_count(account_id: int):
    count = crud.get_transaction_count_for_account(account_id)
    return {"count": count}

@app.get("/categories/")
def get_all_categories():
    return crud.get_categories()

@app.post("/categories/", status_code=201)
def create_category(category: CategoryUpdate):
    try:
        category_id = crud.add_category(category.name)
        new_category = {"id": category_id, "name": category.name}
        return new_category
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail={"key": "category_exists", "params": {"name": category.name}})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/categories/{category_id}")
def update_category(category_id: int, category: CategoryUpdate):
    try:
        crud.update_category(category_id, category.name)
        return {"status": "success", "message": "Category updated."}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail={"key": "category_exists", "params": {"name": category.name}})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/categories/{category_id}/transaction_count")
def get_category_transaction_count(category_id: int):
    count = crud.get_transaction_count_for_category(category_id)
    return {"count": count}

@app.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: int, options: Optional[CategoryDeleteOptions] = None):
    count = crud.get_transaction_count_for_category(category_id)
    
    if count > 0:
        if not options:
            raise HTTPException(status_code=400, detail={"key": "deletion_strategy_required"})
        
        if options.strategy == 'recategorize':
            if not options.target_category_id:
                raise HTTPException(status_code=400, detail={"key": "target_category_required"})
            if category_id == options.target_category_id:
                raise HTTPException(status_code=400, detail={"key": "target_category_is_same"})
            crud.recategorize_transactions(category_id, options.target_category_id)
        
        elif options.strategy == 'delete_transactions':
            crud.delete_transactions_by_category(category_id)
        
        else:
            raise HTTPException(status_code=400, detail={"key": "invalid_strategy"})

    crud.delete_category(category_id)
    return Response(status_code=204)

# --- Transactions ---
@app.get("/transactions/")
def get_all_transactions(
    page: int = 1, 
    page_size: int = 10,
    account_id: Optional[int] = None,
    category_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    recurrent: Optional[bool] = None,
    amount_min: Optional[float] = None, # New
    amount_max: Optional[float] = None, # New
    sort_by: Optional[str] = 'date',
    sort_order: Optional[str] = 'desc'
):
    transactions_df, total_count = crud.get_all_transactions(
        page=page, page_size=page_size, 
        account_id=account_id, category_id=category_id, 
        start_date=str(start_date) if start_date else None, 
        end_date=str(end_date) if end_date else None, 
        search_query=search,
        is_recurrent=recurrent,
        amount_min=amount_min,
        amount_max=amount_max,
        sort_by=sort_by, sort_order=sort_order
    )
    return {
        "transactions": transactions_df.to_dict(orient="records"),
        "total_count": total_count,
        "page": page,
        "page_size": page_size
    }

@app.post("/transactions/")
def create_transaction(transaction: TransactionCreate):
    try:
        crud.add_transaction(
            date=transaction.date,
            description=transaction.description,
            amount=transaction.amount,
            currency=transaction.currency,
            is_recurrent=transaction.is_recurrent,
            account_id=transaction.account_id,
            category_id=transaction.category_id
        )
        return {"status": "success", "message": "Transaction created."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/transactions/{transaction_id}")
def update_transaction(transaction_id: int, transaction: TransactionCreate):
    try:
        crud.update_transaction(
            transaction_id=transaction_id, date=transaction.date, description=transaction.description,
            amount=transaction.amount, currency=transaction.currency, is_recurrent=transaction.is_recurrent,
            account_id=transaction.account_id, category_id=transaction.category_id
        )
        return {"status": "success", "message": "Transaction updated."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/transactions/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int):
    crud.delete_transaction(transaction_id)
    return Response(status_code=204)

# --- Transfers ---
@app.post("/transfers/")
def create_transfer(transfer: TransferCreate):
    try:
        # Call the service layer for business logic
        return transaction_service.create_transfer(
            date=str(transfer.date),
            description=transfer.description, # Add this line
            amount=transfer.amount,
            from_account_id=transfer.from_account_id,
            to_account_id=transfer.to_account_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- AI Chat ---
@app.post("/chat/")
async def handle_chat(query: ChatQuery):
    try:
        response_text = await ai_service.execute_natural_language_query(query.query, query.history)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

# --- Reports (Directly from CRUD) ---
@app.get("/reports/balance/")
def get_balance_report():
    report_df, total_balance = crud.get_balance_report()
    return {"balances_by_account": report_df.to_dict(orient="records"), "total_balance": total_balance}

@app.get("/reports/category-summary/")
def get_category_summary_for_chart(start_date: date, end_date: date, transaction_type: str = 'expense'):
    report_df = crud.get_category_summary_for_chart(str(start_date), str(end_date), transaction_type)
    return report_df.to_dict(orient="records")

@app.get("/reports/monthly-income-expense-summary/")
def get_monthly_income_expense_summary(start_date: date, end_date: date):
    report_df = crud.get_monthly_income_expense_summary(str(start_date), str(end_date))
    return report_df.to_dict(orient="records")

@app.get("/reports/recurrent-summary/")
def get_recurrent_summary(start_date: date, end_date: date):
    report_df = crud.get_recurrent_summary(str(start_date), str(end_date))
    return report_df.to_dict(orient="records")

@app.get("/reports/balance-evolution/")
def get_balance_evolution():
    report_df = crud.get_balance_evolution_report()
    return report_df.to_dict(orient="records")

# --- Accounts ---
@app.post("/accounts/", status_code=201)
def create_account(account: AccountUpdate):
    try:
        account_id = crud.add_account(account.name)
        new_account = {"id": account_id, "name": account.name}
        return new_account
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail={"key": "account_exists", "params": {"name": account.name}})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/accounts/{account_id}")
def update_account(account_id: int, account: AccountUpdate):
    try:
        crud.update_account(account_id, account.name)
        return {"status": "success", "message": "Account updated."}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail={"key": "account_exists", "params": {"name": account.name}})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/accounts/{account_id}", status_code=204)
def delete_account(account_id: int, options: Optional[AccountDeleteOptions] = None):
    count = crud.get_transaction_count_for_account(account_id)
    
    if count > 0:
        if not options:
            raise HTTPException(status_code=400, detail={"key": "deletion_strategy_required"})
        
        if options.strategy == 'reassign':
            if not options.target_account_id:
                raise HTTPException(status_code=400, detail={"key": "target_account_required"})
            if account_id == options.target_account_id:
                raise HTTPException(status_code=400, detail={"key": "target_account_is_same"})
            crud.reassign_transactions_from_account(account_id, options.target_account_id)
        
        elif options.strategy == 'delete_transactions':
            crud.delete_transactions_by_account(account_id)
        
        else:
            raise HTTPException(status_code=400, detail={"key": "invalid_strategy"})

    # Finally, delete the now-empty account
    crud.delete_account(account_id)
    return Response(status_code=204)