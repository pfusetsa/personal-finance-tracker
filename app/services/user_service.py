from .. import crud
from typing import Optional

def get_all_users():
    """Retrieves all users."""
    return crud.get_users()

def create_new_user(first_name: str, second_name: Optional[str], surname: str, preferred_currency: str):
    """Creates a new user, sets currency, and populates default hybrid categories."""
    user_id = crud.create_user(first_name, second_name, surname)
    
    crud.update_setting(user_id=user_id, key='preferred_currency', value=preferred_currency)
    
    default_categories = [
        {"name": "Groceries", "key": "category_groceries"},
        {"name": "Salary", "key": "category_salary"},
        {"name": "Rent", "key": "category_rent"},
        {"name": "Utilities", "key": "category_utilities"},
        {"name": "Restaurants", "key": "category_restaurants"},
        {"name": "Transport", "key": "category_transport"},
        {"name": "Shopping", "key": "category_shopping"},
        {"name": "Entertainment", "key": "category_entertainment"},
        {"name": "Internal Transfers", "key": "category_internal_transfer"}
    ]
    
    transfer_category_id = None
    for cat in default_categories:
        new_cat_id = crud.add_category(
            category_name=cat["name"], 
            user_id=user_id, 
            i18n_key=cat["key"]
        )
        if cat["key"] == "category_internal_transfer":
            transfer_category_id = new_cat_id
            
    if transfer_category_id:
        crud.update_setting(user_id=user_id, key='transfer_category_id', value=str(transfer_category_id))
    
    return {"id": user_id, "first_name": first_name, "second_name": second_name, "surname": surname}