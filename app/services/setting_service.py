from .. import crud

def get_transfer_category_setting(user_id: int):
    """Retrieves the transfer category setting for a user."""
    category_id = crud.get_setting('transfer_category_id', user_id)
    if category_id is None:
        raise ValueError("Transfer category setting not found for this user.")
    return {"value": category_id}

def update_transfer_category_setting(user_id: int, value: str, original_value: str | None, migration_strategy: str | None):
    """Updates the transfer category setting and handles transaction migration."""
    if migration_strategy == 'move_all' and original_value:
        crud.recategorize_transactions(
            from_category_id=int(original_value),
            to_category_id=int(value),
            user_id=user_id
        )
    crud.update_setting('transfer_category_id', value, user_id)
    return {"status": "success", "message": "Setting updated."}