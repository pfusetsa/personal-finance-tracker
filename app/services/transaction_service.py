# app/services/transaction_service.py
from .. import crud

# Replace the existing create_transfer function with this one
def create_transfer(date: str, description: str, amount: float, from_account_id: int, to_account_id: int):
    """
    Creates two transactions to represent a transfer between accounts.
    """
    if from_account_id == to_account_id:
        raise ValueError("Cannot transfer to the same account.")

    transfer_category = crud.get_category_by_name("Transferencias")
    if not transfer_category:
        transfer_category = crud.get_category_by_name("Transfer")
    if not transfer_category:
        transfer_category_id = crud.add_category("Transferencias")
    else:
        transfer_category_id = transfer_category['id']
    
    # Use the description provided by the frontend for both transactions
    crud.add_transaction(
        date=date, description=description, amount=-abs(amount), currency='EUR',
        is_recurrent=False, account_id=from_account_id, category_id=transfer_category_id
    )
    crud.add_transaction(
        date=date, description=description, amount=abs(amount), currency='EUR',
        is_recurrent=False, account_id=to_account_id, category_id=transfer_category_id
    )
    return {"status": "success", "message": "Transfer created."}