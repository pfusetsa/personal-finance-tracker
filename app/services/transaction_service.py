# app/services/transaction_service.py
from .. import crud

def create_transfer(date: str, amount: float, from_account_id: int, to_account_id: int):
    """
    Creates two transactions to represent a transfer between accounts.
    """
    from_account = crud.get_account_by_id(from_account_id)
    to_account = crud.get_account_by_id(to_account_id)

    if not from_account or not to_account:
        raise ValueError("Invalid account ID provided.")

    description = f"Transfer from {from_account['name']} to {to_account['name']}"

    # Create the two opposing transactions
    crud.add_transaction(
        date=date,
        description=f"To {to_account['name']}",
        amount=-abs(amount),
        is_recurrent=False,
        account_id=from_account_id,
        category_name="Transfer" # Using a consistent category name
    )
    crud.add_transaction(
        date=date,
        description=f"From {from_account['name']}",
        amount=abs(amount),
        is_recurrent=False,
        account_id=to_account_id,
        category_name="Transfer"
    )
    return {"status": "success", "message": "Transfer created."}