import sqlite3
from .. import crud

def get_categories(user_id: int):
    """Retrieves all categories for a user."""
    return crud.get_categories(user_id)

def create_category(name: str, user_id: int):
    """Handles the business logic for creating a new category."""
    try:
        category_id = crud.add_category(name, user_id)
        return {"id": category_id, "name": name}
    except sqlite3.IntegrityError:
        raise ValueError(f"A category with the name '{name}' already exists.")

def update_category(category_id: int, name: str, user_id: int):
    """Handles the business logic for updating a category."""
    try:
        crud.update_category(category_id, name, user_id, i18n_key=None)
        return True
    except sqlite3.IntegrityError:
        raise ValueError(f"A category with the name '{name}' already exists.")

def delete_category_with_strategy(category_id: int, user_id: int, strategy: str | None, target_category_id: int | None, new_transfer_category_id: int | None):
    """
    Handles the business logic for deleting a category.
    """
    current_transfer_cid_str = crud.get_setting('transfer_category_id', user_id)
    is_transfer_category = current_transfer_cid_str and int(current_transfer_cid_str) == category_id

    if is_transfer_category:
        if not new_transfer_category_id:
            raise ValueError("A new transfer category ID must be provided to delete the active one.")
        if new_transfer_category_id == category_id:
            raise ValueError("The new transfer category cannot be the same as the one being deleted.")
        crud.update_setting('transfer_category_id', new_transfer_category_id, user_id)

    count = crud.get_transaction_count_for_category(category_id, user_id)
    if count > 0:
        if not strategy:
            raise ValueError("Deletion strategy is required for categories with transactions.")
        
        if strategy == 'recategorize':
            if not target_category_id:
                raise ValueError("Target category ID is required for recategorizing.")
            if category_id == target_category_id:
                raise ValueError("Cannot recategorize to the same category.")
            crud.recategorize_transactions(category_id, target_category_id, user_id)
        elif strategy == 'delete_transactions':
            crud.delete_transactions_by_category(category_id, user_id)
        else:
            raise ValueError("Invalid deletion strategy.")

    crud.delete_category(category_id, user_id)
    return True

def get_transaction_count_for_category(category_id: int, user_id: int):
    """Gets the number of transactions associated with a specific category."""
    count = crud.get_transaction_count_for_category(category_id, user_id)
    return {"count": count}