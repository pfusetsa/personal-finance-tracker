import sqlite3
from fastapi import FastAPI, HTTPException, Response, Query, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from fastapi.middleware.cors import CORSMiddleware
from . import crud
from .services import transaction_service, ai_service

# --- Pydantic Models ---
class AccountUpdate(BaseModel): name: str
class CategoryUpdate(BaseModel): name: str
class UserCreate(BaseModel): first_name: str; second_name: Optional[str] = None; surname: str
class TransactionCreate(BaseModel): date: date; description: str; amount: float; currency: str; is_recurrent: bool; account_id: int; category_id: int
class TransferCreate(BaseModel): date: date; description: str; amount: float; from_account_id: int; to_account_id: int
class TransferUpdate(BaseModel): date: date; amount: float; from_account_id: int; to_account_id: int
class ChatQuery(BaseModel): query: str; history: Optional[List] = []
class SettingUpdate(BaseModel): value: str; original_value: Optional[str] = None; migration_strategy: Optional[str] = None
class AccountDeleteOptions(BaseModel): strategy: str; target_account_id: Optional[int] = None
class CategoryDeleteOptions(BaseModel): strategy: Optional[str] = None; target_category_id: Optional[int] = None; new_transfer_category_id: Optional[int] = None
class TransactionInstruction(BaseModel): transaction_id: int; action: str; target_category_id: Optional[int] = None
class BatchProcessRequest(BaseModel): instructions: List[TransactionInstruction]

async def get_current_user_id(x_user_id: int = Header(...)):
    if x_user_id is None: raise HTTPException(status_code=400, detail="X-User-ID header is missing")
    return x_user_id

app = FastAPI(title="TrakFin API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# --- Users ---
@app.get("/users/")
def get_all_users(): return crud.get_users()
@app.post("/users/", status_code=201)
def create_new_user(user: UserCreate): return {"id": crud.create_user(user.first_name, user.second_name, user.surname), **user.dict()}


# --- Reports (Directly from CRUD) ---
@app.get("/reports/balance/")
def get_balance_report(user_id: int = Depends(get_current_user_id)):
    report_df, total_balance = crud.get_balance_report(user_id)
    return {"balances_by_account": report_df.to_dict(orient="records"), "total_balance": total_balance}

@app.get("/reports/balance-evolution/")
def get_balance_evolution(user_id: int = Depends(get_current_user_id)):
    report_df = crud.get_balance_evolution_report(user_id)
    return report_df.to_dict(orient="records")

@app.get("/reports/category-summary/")
def get_category_summary_for_chart(start_date: date, end_date: date, transaction_type: str = 'expense', user_id: int = Depends(get_current_user_id)):
    report_df = crud.get_category_summary_for_chart(user_id=user_id, start_date=str(start_date), end_date=str(end_date), transaction_type=transaction_type)
    return report_df.to_dict(orient="records")

@app.get("/reports/monthly-income-expense-summary/")
def get_monthly_income_expense_summary(start_date: date, end_date: date, user_id: int = Depends(get_current_user_id)):
    report_df = crud.get_monthly_income_expense_summary(user_id=user_id, start_date=str(start_date), end_date=str(end_date))
    return report_df.to_dict(orient="records")

@app.get("/reports/recurrent-summary/")
def get_recurrent_summary(start_date: date, end_date: date, user_id: int = Depends(get_current_user_id)):
    report_df = crud.get_recurrent_summary(user_id=user_id, start_date=str(start_date), end_date=str(end_date))
    return report_df.to_dict(orient="records")


# --- API Endpoints ------------------------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {"message": "Welcome to the Personal Finance Tracker API!"}


# --- Accounts ------------------------------------------------------------------------------------------
@app.get("/accounts/")
def get_all_accounts(user_id: int = Depends(get_current_user_id)):
    return crud.get_accounts(user_id)

@app.post("/accounts/", status_code=201)
def create_account(account: AccountUpdate, user_id: int = Depends(get_current_user_id)):
    try:
        account_id = crud.add_account(account.name, user_id)
        new_account = {"id": account_id, "name": account.name}
        return new_account
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail={"key": "account_exists", "params": {"name": account.name}})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/accounts/{account_id}")
def update_account(account_id: int, account: AccountUpdate, user_id: int = Depends(get_current_user_id)):
    try:
        crud.update_account(account_id, account.name, user_id)
        return {"status": "success", "message": "Account updated."}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail={"key": "account_exists", "params": {"name": account.name}})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/accounts/{account_id}", status_code=204)
def delete_account(account_id: int, options: Optional[AccountDeleteOptions] = None, user_id: int = Depends(get_current_user_id)):
    count = crud.get_transaction_count_for_account(account_id, user_id)
    if count > 0:
        if not options:
            raise HTTPException(status_code=400, detail={"key": "deletion_strategy_required"})
        if options.strategy == 'reassign':
            crud.reassign_transactions_from_account(account_id, options.target_account_id, user_id)
        elif options.strategy == 'delete_transactions':
            crud.delete_transactions_by_account(account_id, user_id)
    crud.delete_account(account_id, user_id)
    return Response(status_code=204)

@app.get("/accounts/{account_id}/transaction_count")
def get_account_transaction_count(account_id: int, user_id: int = Depends(get_current_user_id)):
    count = crud.get_transaction_count_for_account(account_id, user_id)
    return {"count": count}


# --- Categories ------------------------------------------------------------------------------------------
@app.get("/categories/")
def get_all_categories(user_id: int = Depends(get_current_user_id)):
    return crud.get_categories(user_id)

@app.post("/categories/", status_code=201)
def create_category(category: CategoryUpdate, user_id: int = Depends(get_current_user_id)):
    try:
        category_id = crud.add_category(category.name, user_id)
        new_category = {"id": category_id, "name": category.name}
        return new_category
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail={"key": "category_exists", "params": {"name": category.name}})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/categories/{category_id}")
def update_category(category_id: int, category: CategoryUpdate, user_id: int = Depends(get_current_user_id)):
    try:
        crud.update_category(category_id, category.name, user_id)
        return {"status": "success", "message": "Category updated."}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail={"key": "category_exists", "params": {"name": category.name}})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: int, options: Optional[CategoryDeleteOptions] = None, user_id: int = Depends(get_current_user_id)):
    current_transfer_cid_str = crud.get_setting('transfer_category_id', user_id)
    is_transfer_category = current_transfer_cid_str and int(current_transfer_cid_str) == category_id

    if is_transfer_category:
        if not options or not options.new_transfer_category_id:
            raise HTTPException(status_code=400, detail="A new transfer category ID must be provided to delete the active one.")
        if options.new_transfer_category_id == category_id:
            raise HTTPException(status_code=400, detail="The new transfer category cannot be the same as the one being deleted.")
        
        crud.update_setting('transfer_category_id', options.new_transfer_category_id, user_id)

    count = crud.get_transaction_count_for_category(category_id, user_id)
    if count > 0:
        if not options:
            raise HTTPException(status_code=400, detail={"key": "deletion_strategy_required"})
        
        if options.strategy == 'recategorize':
            if not options.target_category_id:
                raise HTTPException(status_code=400, detail={"key": "target_category_required"})
            if category_id == options.target_category_id:
                raise HTTPException(status_code=400, detail={"key": "target_category_is_same"})
            crud.recategorize_transactions(category_id, options.target_category_id, user_id)
        
        elif options.strategy == 'delete_transactions':
            crud.delete_transactions_by_category(category_id, user_id)
        
        else:
            raise HTTPException(status_code=400, detail={"key": "invalid_strategy"})

    crud.delete_category(category_id, user_id)
    return Response(status_code=204)

@app.get("/categories/{category_id}/transaction_count")
def get_category_transaction_count(category_id: int, user_id: int = Depends(get_current_user_id)):
    count = crud.get_transaction_count_for_category(category_id, user_id)
    return {"count": count}



# --- Transactions ------------------------------------------------------------------------------------------
@app.get("/transactions/")
def get_all_transactions(
    user_id: int = Depends(get_current_user_id), 
    page: int = 1,
    page_size: int = 10,
    account_ids: Optional[list[int]] = Query(None),
    category_ids: Optional[list[int]] = Query(None),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    recurrent: Optional[bool] = None,
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
    sort_by: Optional[str] = 'date',
    sort_order: Optional[str] = 'desc'
):
    transactions_df, total_count = crud.get_all_transactions(
        user_id=user_id,
        page=page, page_size=page_size, 
        account_ids=account_ids,
        category_ids=category_ids,
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
def create_transaction(transaction: TransactionCreate, user_id: int = Depends(get_current_user_id)):
    try:
        crud.add_transaction(
            date=transaction.date,
            description=transaction.description,
            amount=transaction.amount,
            currency=transaction.currency,
            is_recurrent=transaction.is_recurrent,
            account_id=transaction.account_id,
            category_id=transaction.category_id,
            user_id=user_id
        )
        return {"status": "success", "message": "Transaction created."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/transactions/{transaction_id}")
def update_transaction(transaction_id: int, transaction: TransactionCreate, user_id: int = Depends(get_current_user_id)):
    try:
        crud.update_transaction(
            transaction_id=transaction_id, date=transaction.date, description=transaction.description,
            amount=transaction.amount, currency=transaction.currency, is_recurrent=transaction.is_recurrent,
            account_id=transaction.account_id, category_id=transaction.category_id, user_id=user_id
        )
        return {"status": "success", "message": "Transaction updated."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@app.delete("/transactions/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, user_id: int = Depends(get_current_user_id)):
    crud.delete_transaction(transaction_id, user_id)
    return Response(status_code=204)


# --- Transfers ------------------------------------------------------------------------------------------
@app.post("/transfers/")
def create_transfer(transfer: TransferCreate, user_id: int = Depends(get_current_user_id)):
    try:
        return transaction_service.create_transfer(
            date=str(transfer.date),
            description=transfer.description,
            amount=transfer.amount,
            from_account_id=transfer.from_account_id,
            to_account_id=transfer.to_account_id,
            user_id=user_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/transfers/{transfer_id}")
def get_transfer_details(transfer_id: str, user_id: int = Depends(get_current_user_id)):
    transfer = crud.get_transfer(transfer_id, user_id)
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found.")
    return transfer

@app.put("/transfers/{transfer_id}")
def update_transfer(transfer_id: str, transfer: TransferUpdate, user_id: int = Depends(get_current_user_id)):
    try:
        crud.update_transfer(
            transfer_id=transfer_id,
            date=transfer.date,
            amount=transfer.amount,
            from_account_id=transfer.from_account_id,
            to_account_id=transfer.to_account_id,
            user_id=user_id
        )
        return {"status": "success", "message": "Transfer updated."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/transactions/batch-process")
def batch_process_transactions(request: BatchProcessRequest, user_id: int = Depends(get_current_user_id)):
    try:
        result = crud.process_batch_instructions([i.dict() for i in request.instructions], user_id=user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")


# --- Settings ------------------------------------------------------------------------------------------
@app.get("/settings/transfer_category_id")
def get_transfer_category_setting(user_id: int = Depends(get_current_user_id)):
    category_id = crud.get_setting('transfer_category_id', user_id)
    if category_id is None:
        raise HTTPException(status_code=404, detail="Transfer category setting not found for this user.")
    return {"value": category_id}

@app.put("/settings/transfer_category_id")
def update_transfer_category_setting(setting: SettingUpdate, user_id: int = Depends(get_current_user_id)):
    try:
        if setting.migration_strategy == 'move_all' and setting.original_value:
            crud.recategorize_transactions(
                from_category_id=int(setting.original_value),
                to_category_id=int(setting.value),
                user_id=user_id
            )
        crud.update_setting('transfer_category_id', setting.value, user_id)
        return {"status": "success", "message": "Setting updated."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- AI Chat ------------------------------------------------------------------------------------------
@app.post("/chat/")
async def handle_chat(query: ChatQuery, user_id: int = Depends(get_current_user_id)):
    try:
        response_text = await ai_service.execute_natural_language_query(query.query, query.history, user_id)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")