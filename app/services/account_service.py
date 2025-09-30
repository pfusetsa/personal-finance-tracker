import sqlite3
from .. import crud

def get_accounts(user_id: int):
    """Retrieves all accounts for a user."""
    return crud.get_accounts(user_id)

def create_account(name: str, user_id: int):
    """Handles the business logic for creating a new account."""
    try:
        account_id = crud.add_account(name, user_id)
        return {"id": account_id, "name": name}
    except sqlite3.IntegrityError:
        raise ValueError(f"An account with the name '{name}' already exists.")

def update_account(account_id: int, name: str, user_id: int):
    """Handles the business logic for updating an account."""
    try:
        crud.update_account(account_id, name, user_id)
        return True
    except sqlite3.IntegrityError:
        raise ValueError(f"An account with the name '{name}' already exists.")

def delete_account_with_strategy(account_id: int, user_id: int, strategy: str | None, target_account_id: int | None):
    """
    Handles the business logic for deleting an account and its transactions.
    """
    count = crud.get_transaction_count_for_account(account_id, user_id)
    
    if count > 0:
        if not strategy:
            raise ValueError("Deletion strategy is required for accounts with transactions.")
        
        if strategy == 'reassign':
            if not target_account_id:
                raise ValueError("Target account ID is required for reassigning.")
            crud.reassign_transactions_from_account(account_id, target_account_id, user_id)
        elif strategy == 'delete_transactions':
            crud.delete_transactions_by_account(account_id, user_id)
        else:
            raise ValueError("Invalid deletion strategy.")

    # Finally, delete the account itself
    crud.delete_account(account_id, user_id)
    return True

def get_transaction_count_for_account(account_id: int, user_id: int):
    """Gets the number of transactions associated with a specific account."""
    count = crud.get_transaction_count_for_account(account_id, user_id)
    return {"count": count}