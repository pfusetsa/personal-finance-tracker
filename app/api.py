import sqlite3
from fastapi import FastAPI, HTTPException, Response, Query, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import date as date_type
from fastapi.middleware.cors import CORSMiddleware
from .services import account_service, ai_service, transaction_service, category_service, report_service, setting_service, user_service

# --- Pydantic Models ---
class AccountUpdate(BaseModel): name: str
class CategoryUpdate(BaseModel): name: str
class UserCreate(BaseModel): first_name: str; second_name: Optional[str] = None; surname: str
class TransactionCreate(BaseModel): date: date_type; description: str; amount: float; currency: str; is_recurrent: bool; account_id: int; category_id: int; recurrence_num: Optional[int] = None; recurrence_unit: Optional[str] = None; recurrence_end_date: Optional[date_type] = None
class TransferCreate(BaseModel): date: date_type; description: str; amount: float; from_account_id: int; to_account_id: int
class TransferUpdate(BaseModel): date: date_type; amount: float; from_account_id: int; to_account_id: int
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
def get_all_users():
    return user_service.get_all_users()

@app.post("/users/", status_code=201)
def create_new_user(user: UserCreate):
    return user_service.create_new_user(user.first_name, user.second_name, user.surname)


# --- Reports ---
@app.get("/reports/balance/")
def get_balance_report(user_id: int = Depends(get_current_user_id)):
    return report_service.get_balance_report(user_id)

@app.get("/reports/balance-evolution/")
def get_balance_evolution(user_id: int = Depends(get_current_user_id)):
    return report_service.get_balance_evolution_report(user_id)

@app.get("/reports/category-summary/")
def get_category_summary_for_chart(start_date: date_type, end_date: date_type, transaction_type: str = 'expense', user_id: int = Depends(get_current_user_id)):
    return report_service.get_category_summary_report(
        user_id=user_id, start_date=start_date, end_date=end_date, transaction_type=transaction_type
    )

@app.get("/reports/monthly-income-expense-summary/")
def get_monthly_income_expense_summary(start_date: date_type, end_date: date_type, user_id: int = Depends(get_current_user_id)):
    return report_service.get_monthly_income_expense_report(
        user_id=user_id, start_date=start_date, end_date=end_date
    )

@app.get("/reports/recurrent-summary/")
def get_recurrent_summary(start_date: str, end_date: str, user_id: int = Depends(get_current_user_id)):
    # The service function already handles string dates, so we just pass them through.
    return report_service.get_recurrent_summary_report(
        user_id=user_id, start_date=start_date, end_date=end_date
    )


# --- API Endpoints ------------------------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {"message": "Welcome to the Personal Finance Tracker API!"}


# --- Accounts ------------------------------------------------------------------------------------------
@app.get("/accounts/")
def get_all_accounts(user_id: int = Depends(get_current_user_id)):
    return account_service.get_accounts(user_id)

@app.post("/accounts/", status_code=201)
def create_account(account: AccountUpdate, user_id: int = Depends(get_current_user_id)):
    try:
        new_account = account_service.create_account(account.name, user_id)
        return new_account
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/accounts/{account_id}")
def update_account(account_id: int, account: AccountUpdate, user_id: int = Depends(get_current_user_id)):
    try:
        account_service.update_account(account_id, account.name, user_id)
        return {"status": "success", "message": "Account updated."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/accounts/{account_id}", status_code=204)
def delete_account(account_id: int, options: Optional[AccountDeleteOptions] = None, user_id: int = Depends(get_current_user_id)):
    try:
        strategy = options.strategy if options else None
        target_id = options.target_account_id if options else None
        
        account_service.delete_account_with_strategy(
            account_id=account_id,
            user_id=user_id,
            strategy=strategy,
            target_account_id=target_id
        )
        return Response(status_code=204)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/accounts/{account_id}/transaction_count")
def get_account_transaction_count(account_id: int, user_id: int = Depends(get_current_user_id)):
    return account_service.get_transaction_count_for_account(account_id, user_id)



# --- Categories ------------------------------------------------------------------------------------------
@app.get("/categories/")
def get_all_categories(user_id: int = Depends(get_current_user_id)):
    return category_service.get_categories(user_id)

@app.post("/categories/", status_code=201)
def create_category(category: CategoryUpdate, user_id: int = Depends(get_current_user_id)):
    try:
        new_category = category_service.create_category(category.name, user_id)
        return new_category
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/categories/{category_id}")
def update_category(category_id: int, category: CategoryUpdate, user_id: int = Depends(get_current_user_id)):
    try:
        category_service.update_category(category_id, category.name, user_id)
        return {"status": "success", "message": "Category updated."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: int, options: Optional[CategoryDeleteOptions] = None, user_id: int = Depends(get_current_user_id)):
    try:
        strategy = options.strategy if options else None
        target_id = options.target_category_id if options else None
        new_transfer_id = options.new_transfer_category_id if options else None

        category_service.delete_category_with_strategy(
            category_id=category_id,
            user_id=user_id,
            strategy=strategy,
            target_category_id=target_id,
            new_transfer_category_id=new_transfer_id
        )
        return Response(status_code=204)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/categories/{category_id}/transaction_count")
def get_category_transaction_count(category_id: int, user_id: int = Depends(get_current_user_id)):
    return category_service.get_transaction_count_for_category(category_id, user_id)



# --- Transactions ------------------------------------------------------------------------------------------
@app.get("/transactions/")
def get_all_transactions(
    user_id: int = Depends(get_current_user_id), 
    page: int = 1,
    page_size: int = 10,
    account_ids: Optional[list[int]] = Query(None),
    category_ids: Optional[list[int]] = Query(None),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    recurrent: Optional[bool] = None,
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
    sort_by: Optional[str] = 'date',
    sort_order: Optional[str] = 'desc'
):
    filters = {
        "account_ids": account_ids,
        "category_ids": category_ids,
        "start_date": start_date,
        "end_date": end_date,
        "search_query": search,
        "is_recurrent": recurrent,
        "amount_min": amount_min,
        "amount_max": amount_max,
        "sort_by": sort_by,
        "sort_order": sort_order
    }
    return transaction_service.get_all_transactions(user_id, page, page_size, **filters)


@app.post("/transactions/", status_code=201)
def create_transaction(transaction: TransactionCreate, user_id: int = Depends(get_current_user_id)):
    try:
        transaction_dict = transaction.model_dump()
        # --- FIX: Convert date objects to strings ---
        if transaction_dict.get('date'):
            transaction_dict['date'] = str(transaction_dict['date'])
        if transaction_dict.get('recurrence_end_date'):
            transaction_dict['recurrence_end_date'] = str(transaction_dict['recurrence_end_date'])
        # --- END FIX ---

        new_transaction = transaction_service.create_transaction_with_recurrence(
            transaction_data=transaction_dict,
            user_id=user_id
        )
        return new_transaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

@app.put("/transactions/{transaction_id}")
def update_transaction(transaction_id: int, transaction: TransactionCreate, user_id: int = Depends(get_current_user_id)):
    try:
        transaction_dict = transaction.model_dump()
        if transaction_dict.get('date'):
            transaction_dict['date'] = str(transaction_dict['date'])
        if transaction_dict.get('recurrence_end_date'):
            transaction_dict['recurrence_end_date'] = str(transaction_dict['recurrence_end_date'])

        updated_transaction = transaction_service.update_transaction_with_recurrence(
            transaction_id=transaction_id,
            transaction_data=transaction_dict,
            user_id=user_id
        )
        return updated_transaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
    
@app.delete("/transactions/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, user_id: int = Depends(get_current_user_id)):
    transaction_service.delete_transaction(transaction_id, user_id)
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
    try:
        return transaction_service.get_transfer_details(transfer_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.put("/transfers/{transfer_id}")
def update_transfer(transfer_id: str, transfer: TransferUpdate, user_id: int = Depends(get_current_user_id)):
    try:
        transaction_service.update_transfer(
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
        result = transaction_service.batch_process_transactions([i.model_dump() for i in request.instructions], user_id=user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")



# --- Settings ------------------------------------------------------------------------------------------
@app.get("/settings/transfer_category_id")
def get_transfer_category_setting(user_id: int = Depends(get_current_user_id)):
    try:
        return setting_service.get_transfer_category_setting(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.put("/settings/transfer_category_id")
def update_transfer_category_setting(setting: SettingUpdate, user_id: int = Depends(get_current_user_id)):
    try:
        return setting_service.update_transfer_category_setting(
            user_id=user_id,
            value=setting.value,
            original_value=setting.original_value,
            migration_strategy=setting.migration_strategy
        )
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