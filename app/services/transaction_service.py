# app/services/transaction_service.py
from .. import crud

def create_transfer(date: str, description: str, amount: float, from_account_id: int, to_account_id: int):
    """
    Creates two transactions to represent a transfer between accounts,
    using the user-configured transfer category ID from settings.
    """
    if from_account_id == to_account_id:
        raise ValueError("Cannot transfer to the same account.")
    
    # Get the configured transfer category ID from settings
    transfer_category_id_str = crud.get_setting('transfer_category_id')
    if not transfer_category_id_str:
        raise ValueError("Transfer category is not configured. Please set it in the application settings.")
    
    transfer_category_id = int(transfer_category_id_str)

    # The rest of the logic proceeds using the fetched ID
    crud.add_transaction(
        date=date, description=description, amount=-abs(amount), currency='EUR',
        is_recurrent=False, account_id=from_account_id, category_id=transfer_category_id
    )
    crud.add_transaction(
        date=date, description=description, amount=abs(amount), currency='EUR',
        is_recurrent=False, account_id=to_account_id, category_id=transfer_category_id
    )
    return {"status": "success", "message": "Transfer created."}