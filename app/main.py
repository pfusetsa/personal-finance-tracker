# app/main.py

from app import crud
from datetime import datetime

def print_main_menu():
    """Prints the main menu options to the console."""
    print("\n--- ✅ Personal Finance Tracker ---")
    print("1. Add Transaction")
    print("2. Add Transfer")
    print("3. View All Transactions")
    print("4. View Balance Report")
    print("5. View Monthly Expense Report")
    print("6. View Category Expense Report")
    print("7. Exit")
    print("------------------------------------")

def get_user_choice(prompt, valid_choices):
    """A helper function to get and validate user input."""
    while True:
        choice = input(prompt).strip()
        if choice in valid_choices:
            return choice
        else:
            print(f"Invalid input. Please enter one of {valid_choices}.")

def handle_add_transaction():
    """Guides the user through adding a new transaction."""
    print("\n--- Add New Transaction ---")
    
    accounts = crud.get_accounts()
    for acc in accounts:
        print(f"  {acc['id']}: {acc['name']}")
    account_id = get_user_choice("Select account ID: ", [str(acc['id']) for acc in accounts])

    categories = crud.get_categories()
    for cat in categories:
        print(f"  {cat['id']}: {cat['name']}")
    category_id = get_user_choice("Select category ID: ", [str(cat['id']) for cat in categories])

    date_str = input("Enter date (YYYY-MM-DD, or leave blank for today): ").strip()
    date = datetime.today().strftime('%Y-%m-%d') if not date_str else date_str

    description = input("Enter description: ").strip()
    
    while True:
        try:
            amount = float(input("Enter amount (use negative for expenses, e.g., -50.25): "))
            break
        except ValueError:
            print("Invalid amount. Please enter a number.")

    is_recurrent_str = get_user_choice("Is this recurrent? (y/n): ", ['y', 'n', 'Y', 'N'])
    is_recurrent = is_recurrent_str.lower() == 'y'
    
    crud.add_transaction(date, description, amount, is_recurrent, int(account_id), int(category_id))

def handle_add_transfer():
    """Guides the user through adding a new transfer between accounts."""
    print("\n--- Add New Transfer ---")
    accounts = crud.get_accounts()
    account_ids = [str(acc['id']) for acc in accounts]

    for acc in accounts:
        print(f"  {acc['id']}: {acc['name']}")
    
    from_id = get_user_choice("Select account to transfer FROM: ", account_ids)
    
    while True:
        to_id = get_user_choice("Select account to transfer TO: ", account_ids)
        if to_id != from_id:
            break
        print("Cannot transfer to the same account. Please select a different account.")

    while True:
        try:
            amount = float(input("Enter amount to transfer: "))
            if amount > 0:
                break
            print("Please enter a positive amount.")
        except ValueError:
            print("Invalid amount. Please enter a number.")
            
    date_str = input("Enter date (YYYY-MM-DD, or leave blank for today): ").strip()
    date = datetime.today().strftime('%Y-%m-%d') if not date_str else date_str
    
    from_name = next(acc['name'] for acc in accounts if str(acc['id']) == from_id)
    to_name = next(acc['name'] for acc in accounts if str(acc['id']) == to_id)
    description = f"Transfer from {from_name} to {to_name}"

    crud.add_transfer(date, description, amount, int(from_id), int(to_id))

def handle_view_all_transactions():
    """Fetches and displays the N most recent transactions."""
    print("\n--- Last 50 Transactions ---")
    df = crud.get_all_transactions_df(limit=50)
    print(df.to_string(index=False))

def handle_balance_report():
    """Fetches and displays the balance report."""
    print("\n--- Balance Report ---")
    df, total_balance = crud.get_balance_report()
    print(df.to_string(index=False))
    print("----------------------")
    print(f"Total Balance: {total_balance:,.2f}€")

def handle_monthly_report():
    """Fetches and displays the monthly expense report."""
    print("\n--- Monthly Expense Report (by Category) ---")
    df = crud.get_monthly_report_df()
    print(df.to_string())
    
def handle_category_report():
    """Fetches and displays the expense report by category."""
    print("\n--- Expense Report by Category ---")
    accounts = crud.get_accounts()
    print("Filter by account (optional):")
    print("  0: All Accounts")
    for acc in accounts:
        print(f"  {acc['id']}: {acc['name']}")
    
    valid_ids = ['0'] + [str(acc['id']) for acc in accounts]
    account_id_str = get_user_choice("Select account ID to filter by (or 0 for all): ", valid_ids)
    account_id = int(account_id_str) if account_id_str != '0' else None
    
    df = crud.get_category_report_df(account_id)
    print(df.to_string(index=False))

def main():
    """The main function and loop for the application."""
    while True:
        print_main_menu()
        choice = get_user_choice("Enter your choice: ", ['1', '2', '3', '4', '5', '6', '7'])
        
        if choice == '1':
            handle_add_transaction()
        elif choice == '2':
            handle_add_transfer()
        elif choice == '3':
            handle_view_all_transactions()
        elif choice == '4':
            handle_balance_report()
        elif choice == '5':
            handle_monthly_report()
        elif choice == '6':
            handle_category_report()
        elif choice == '7':
            print("Goodbye! 👋")
            break

if __name__ == "__main__":
    main()