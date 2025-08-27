# In app/services/transaction_service.py
import uuid
from .. import crud

def create_transfer(date: str, description: str, amount: float, from_account_id: int, to_account_id: int):
    """
    Creates two transactions to represent a transfer between accounts,
    linking them with a unique transfer_id.
    """
    if from_account_id == to_account_id:
        raise ValueError("Cannot transfer to the same account.")
    
    transfer_category_id_str = crud.get_setting('transfer_category_id')
    if not transfer_category_id_str:
        raise ValueError("Transfer category is not configured. Please set it in the application settings.")
    
    transfer_category_id = int(transfer_category_id_str)
    transfer_id = str(uuid.uuid4()) # Generate a unique ID for the transfer

    # Add the transfer_id to both transactions
    crud.add_transaction(
        date=date, description=description, amount=-abs(amount), currency='EUR',
        is_recurrent=False, account_id=from_account_id, category_id=transfer_category_id,
        transfer_id=transfer_id
    )
    crud.add_transaction(
        date=date, description=description, amount=abs(amount), currency='EUR',
        is_recurrent=False, account_id=to_account_id, category_id=transfer_category_id,
        transfer_id=transfer_id
    )
    return {"status": "success", "message": "Transfer created."}