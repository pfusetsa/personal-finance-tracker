import uuid
from datetime import date
from dateutil.relativedelta import relativedelta
from .. import crud

def get_all_transactions(user_id: int, page: int, page_size: int, **filters):
    """Applies filtering and pagination to retrieve transactions."""
    df, total_count = crud.get_all_transactions(
        user_id=user_id,
        page=page,
        page_size=page_size,
        account_ids=filters.get('account_ids'),
        category_ids=filters.get('category_ids'),
        start_date=filters.get('start_date'),
        end_date=filters.get('end_date'),
        search_query=filters.get('search_query'),
        is_recurrent=filters.get('is_recurrent'),
        amount_min=filters.get('amount_min'),
        amount_max=filters.get('amount_max'),
        sort_by=filters.get('sort_by', 'date'),
        sort_order=filters.get('sort_order', 'desc')
    )
    
    transactions_list = df.to_dict(orient="records")
    for tx in transactions_list:
        tx['category'] = {
            'name': tx.pop('category_name', None),
            'i18n_key': tx.pop('category_i18n_key', None)
        }
        
    return {
        "transactions": transactions_list,
        "total_count": total_count,
        "page": page,
        "page_size": page_size
    }

def create_transaction_with_recurrence(transaction_data: dict, user_id: int):
    """
    Handles all transaction creation logic: simple, claiming a pending one,
    linking to a series, or creating a new series.
    """
    update_id = transaction_data.get('update_pending_id')
    
    # --- FLOW 1: User is "claiming" a pending transaction ---
    if update_id:
        updates = transaction_data.copy()
        updates['status'] = 'confirmed'
        updates.pop('update_pending_id', None)
        crud.update_transaction(transaction_id=update_id, user_id=user_id, updates=updates)
        return crud.get_transaction_by_id(update_id, user_id)

    # --- FLOW 2: User is creating a new transaction (recurrent or not) ---
    is_recurrent = transaction_data.get('is_recurrent', False)
    
    master_data = {
        "date": transaction_data.get('date'),
        "description": transaction_data.get('description'),
        "amount": transaction_data.get('amount'),
        "currency": transaction_data.get('currency'),
        "is_recurrent": is_recurrent,
        "account_id": transaction_data.get('account_id'),
        "category_id": transaction_data.get('category_id'),
        "user_id": user_id,
        "status": 'confirmed',
        "recurrence_id": transaction_data.get('recurrence_id')
    }

    new_id = crud.add_transaction(**master_data)
    
    is_new_series = is_recurrent and not transaction_data.get('recurrence_id')
    if is_new_series:
        master_tx = crud.get_transaction_by_id(new_id, user_id)
        _generate_series_from_master(master_tx, user_id, transaction_data)
    
    return crud.get_transaction_by_id(new_id, user_id)

def update_transaction_with_recurrence(transaction_id: int, transaction_data: dict, user_id: int):
    """Updates a transaction, handling all recurrence toggle logic based on user specification."""
    original_tx = crud.get_transaction_by_id(transaction_id, user_id)
    if not original_tx:
        raise ValueError("Transaction not found.")

    is_rule_change = transaction_data.get('recurrence_unit') is not None or transaction_data.get('recurrence_num') is not None

    # CASE 1: The user is simply confirming a pending transaction.
    if original_tx.get('status') == 'pending' and not is_rule_change:
        transaction_data['status'] = 'confirmed'
        crud.update_transaction(transaction_id, user_id, transaction_data)
        return crud.get_transaction_by_id(transaction_id, user_id)

    was_recurrent = original_tx.get('is_recurrent', False)
    recurrence_id = original_tx.get('recurrence_id')
    is_now_recurrent = transaction_data.get('is_recurrent', False)

    # --- Rule: Toggling from Recurrent OFF ---
    if was_recurrent and not is_now_recurrent:
        # Clear recurrence fields for this specific transaction
        transaction_data['recurrence_id'] = None
        transaction_data['recurrence_num'] = None
        transaction_data['recurrence_unit'] = None
        transaction_data['recurrence_end_date'] = None
        
        if recurrence_id:
            confirmed_count = crud.count_confirmed_transactions_in_series(recurrence_id, user_id)
            if confirmed_count <= 1:
                # This was the last confirmed one, so delete the pending series
                crud.delete_pending_transactions_by_recurrence_id(recurrence_id, user_id)
    # Update the main transaction record in the database
    crud.update_transaction(transaction_id, user_id, transaction_data)
    
    if (is_now_recurrent and not was_recurrent) or (was_recurrent and is_now_recurrent and is_rule_change):
        confirmed_count = crud.count_confirmed_transactions_in_series(recurrence_id, user_id) if recurrence_id else 0
        if confirmed_count <= 1:
            if recurrence_id:
                crud.delete_pending_transactions_by_recurrence_id(recurrence_id, user_id)
            
            updated_tx = crud.get_transaction_by_id(transaction_id, user_id)
            if updated_tx:
                _generate_series_from_master(updated_tx, user_id, transaction_data)
    return crud.get_transaction_by_id(transaction_id, user_id)

def _generate_series_from_master(master_tx: dict, user_id: int, recurrence_rules: dict):
    """Internal helper to generate and save a series of pending transactions."""
    new_recurrence_id = str(uuid.uuid4())
    frequency_num = recurrence_rules.get('recurrence_num', 1)
    frequency_unit = recurrence_rules.get('recurrence_unit')
    end_date_str = recurrence_rules.get('recurrence_end_date')

    if not frequency_unit:
        crud.update_transaction(master_tx['id'], user_id, {"recurrence_id": new_recurrence_id})
        return

    start_date = date.fromisoformat(master_tx['date'])
    if end_date_str:
        end_date = date.fromisoformat(end_date_str)
    else:
        # If no end date is provided, default to generating for the next 5 years.
        end_date = start_date + relativedelta(years=5)

    unit = 'years' if frequency_unit == 'yearly' else frequency_unit # Handles your frontend change
    delta_args = {unit: frequency_num}
    delta = relativedelta(**delta_args)

    crud.update_transaction(
        master_tx['id'],
        user_id,
        {"recurrence_id": new_recurrence_id}
    )

    current_date = start_date + delta
    while current_date <= end_date:
        crud.add_transaction(
            date=str(current_date),
            description=master_tx.get('description'),
            amount=master_tx.get('amount'),
            currency=master_tx.get('currency'),
            is_recurrent=True,
            account_id=master_tx.get('account_id'),
            category_id=master_tx.get('category_id'),
            user_id=user_id,
            recurrence_id=new_recurrence_id,
            status='pending'
        )
        current_date += delta

def delete_transaction(transaction_id: int, user_id: int):
    """Handles the business logic for deleting a transaction based on the new rules."""
    original_tx = crud.get_transaction_by_id(transaction_id, user_id)
    if not original_tx:
        return True # Already deleted, so success

    # Handle transfers first, as they are a special case
    if original_tx.get('transfer_id'):
        crud.delete_entire_transfer(original_tx['transfer_id'], user_id)
        return True

    recurrence_id = original_tx.get('recurrence_id')
    if recurrence_id:
        confirmed_count = crud.count_confirmed_transactions_in_series(recurrence_id, user_id)
        
        # If this is the last confirmed transaction in the series
        if confirmed_count <= 1 and original_tx.get('status') == 'confirmed':
            # Delete the entire series (this transaction + all pending)
            crud.delete_entire_series(recurrence_id, user_id)
        else:
            # Just delete this single transaction, leave the rest of the series
            crud.delete_transaction_by_id(transaction_id, user_id)
    else:
        # It's a simple non-recurrent, non-transfer transaction
        crud.delete_transaction_by_id(transaction_id, user_id)
        
    return True

# --- Transfers ---
def get_transfer_details(transfer_id: str, user_id: int):
    """Retrieves the details of a specific transfer."""
    transfer = crud.get_transfer(transfer_id, user_id)
    if not transfer:
        raise ValueError("Transfer not found.")
    return transfer

def create_transfer(date: str, description: str, amount: float, from_account_id: int, to_account_id: int, user_id: int):
    if from_account_id == to_account_id:
        raise ValueError("Cannot transfer to the same account.")
    transfer_category_id_str = crud.get_setting('transfer_category_id', user_id)
    if not transfer_category_id_str:
        raise ValueError("Transfer category is not configured.")
    transfer_category_id = int(transfer_category_id_str)
    transfer_id = str(uuid.uuid4())
    crud.add_transaction(date=date, description=description, amount=-abs(amount), currency='EUR', is_recurrent=False, account_id=from_account_id, category_id=transfer_category_id, user_id=user_id, transfer_id=transfer_id)
    crud.add_transaction(date=date, description=description, amount=abs(amount), currency='EUR', is_recurrent=False, account_id=to_account_id, category_id=transfer_category_id, user_id=user_id, transfer_id=transfer_id)
    return {"status": "success", "message": "Transfer created."}

def update_transfer(transfer_id: str, date: date, amount: float, from_account_id: int, to_account_id: int, user_id: int):
    """Updates an existing transfer."""
    return crud.update_transfer(transfer_id, date, amount, from_account_id, to_account_id, user_id)

def batch_process_transactions(instructions: list, user_id: int):
    """Processes a batch of instructions (e.g., delete, recategorize) for transactions."""
    return crud.process_batch_instructions(instructions, user_id)

def get_all_recurrence_series(user_id: int):
    """Retrieves all master recurrent transactions and formats the category data."""
    series_list = crud.get_master_recurrent_transactions(user_id)
    for series in series_list:
        # Create the nested category object the frontend expects
        series['category'] = {
            'name': series.pop('category_name', None),
            'i18n_key': series.pop('category_i18n_key', None)
        }
    return series_list

def get_pending_transactions_for_series(recurrence_id: str, user_id: int):
    """Retrieves all pending transactions for a given recurrence series."""
    return crud.get_pending_transactions_by_recurrence_id(recurrence_id, user_id)

def get_confirmed_count_for_series(recurrence_id: str, user_id: int):
    """Gets the count of confirmed transactions in a specific recurrence series."""
    count = crud.count_confirmed_transactions_in_series(recurrence_id, user_id)
    return {"count": count}

def get_due_pending_transactions(user_id: int):
    """Retrieves all due pending transactions and formats the category data."""
    transactions_list = crud.get_due_pending_transactions(user_id)
    for tx in transactions_list:
        tx['category'] = {
            'name': tx.pop('category_name', None),
            'i18n_key': tx.pop('category_i18n_key', None)
        }
    return transactions_list