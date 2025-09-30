import uuid
from datetime import date
from dateutil.relativedelta import relativedelta
from .. import crud

def create_transaction_with_recurrence(transaction_data: dict, user_id: int):
    """Creates a master transaction and, if it's recurrent, generates the full series."""
    is_recurrent = transaction_data.get('is_recurrent', False)
    
    # Use .get() for safety, providing default None
    master_data = {
        "date": transaction_data.get('date'),
        "description": transaction_data.get('description'),
        "amount": transaction_data.get('amount'),
        "currency": transaction_data.get('currency'),
        "is_recurrent": is_recurrent,
        "account_id": transaction_data.get('account_id'),
        "category_id": transaction_data.get('category_id'),
        "user_id": user_id
    }

    if not is_recurrent:
        new_id = crud.add_transaction(**master_data)
        return crud.get_transaction_by_id(new_id, user_id)

    master_data['status'] = 'confirmed'
    master_tx_id = crud.add_transaction(**master_data)
    master_tx = crud.get_transaction_by_id(master_tx_id, user_id)

    _generate_series_from_master(master_tx, user_id, transaction_data)
    
    return master_tx

def update_transaction_with_recurrence(transaction_id: int, transaction_data: dict, user_id: int):
    """
    Updates a transaction. Handles toggling recurrence on or off.
    """
    # Get the state of the transaction *before* the update
    original_tx = crud.get_transaction_by_id(transaction_id, user_id)
    if not original_tx:
        raise ValueError("Transaction not found.")

    was_recurrent = original_tx.get('is_recurrent', False)
    is_now_recurrent = transaction_data.get('is_recurrent', False)

    # --- Main Update Logic ---
    # Clear out old recurrence fields if toggling off
    if was_recurrent and not is_now_recurrent:
        transaction_data['recurrence_id'] = None
        transaction_data['recurrence_num'] = None
        transaction_data['recurrence_unit'] = None
        transaction_data['recurrence_end_date'] = None
        
        # Delete the associated pending transactions
        if original_tx.get('recurrence_id'):
            crud.delete_pending_transactions_by_recurrence_id(original_tx['recurrence_id'], user_id)

    # Update the main transaction record in the database
    crud.update_transaction(transaction_id, user_id, transaction_data)
    
    # --- Generate New Series if Toggling On ---
    updated_tx = crud.get_transaction_by_id(transaction_id, user_id)
    if is_now_recurrent and not was_recurrent:
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


# Not used for now
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