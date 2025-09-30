from .. import crud
from typing import Optional

def get_all_users():
    """Retrieves all users."""
    return crud.get_users()

def create_new_user(first_name: str, second_name: Optional[str], surname: str):
    """Creates a new user and returns the complete user object."""
    user_id = crud.create_user(first_name, second_name, surname)
    return {"id": user_id, "first_name": first_name, "second_name": second_name, "surname": surname}