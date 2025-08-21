# app/services/transaction_service.py
from .. import crud

def create_transfer(date: str, amount: float, from_account_id: int, to_account_id: int):
    """
    Creates two transactions to represent a transfer between accounts,
    with validation and self-healing for the 'Transfer' category (handles i18n).
    """
    if from_account_id == to_account_id:
        raise ValueError("Cannot transfer to the same account.")

    from_account = crud.get_account_by_id(from_account_id)
    to_account = crud.get_account_by_id(to_account_id)

    if not from_account or not to_account:
        raise ValueError("Invalid account ID provided.")
    
    # Check for Spanish name first, then English as a fallback.
    transfer_category = crud.get_category_by_name("Transferencias")
    if not transfer_category:
        transfer_category = crud.get_category_by_name("Transfer")

    # If neither exists, create the Spanish version.
    if not transfer_category:
        transfer_category_id = crud.add_category("Transferencias")
    else:
        transfer_category_id = transfer_category['id']
    
    description = f"Transfer from {from_account['name']} to {to_account['name']}"
    
    crud.add_transaction(
        date=date, description=description, amount=-abs(amount), currency='EUR',
        is_recurrent=False, account_id=from_account_id, category_id=transfer_category_id
    )
    crud.add_transaction(
        date=date, description=description, amount=abs(amount), currency='EUR',
        is_recurrent=False, account_id=to_account_id, category_id=transfer_category_id
    )
    return {"status": "success", "message": "Transfer created."}