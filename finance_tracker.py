import pandas as pd
from reports import generate_category_report, generate_monthly_report, generate_balance_report
from data_handler import add_transaction, load_data

def main_menu():
    """Presents a menu to the user and gets their choice."""
    print("\n--- Personal Finance Tracker ---")
    print("1. Add a new transaction")
    print("2. Generate a category report")
    print("3. Generate a monthly report")
    print("4. Generate a balance report")
    print("5. Exit")

    while True:
        choice = input("Enter your choice: ")
        if choice in ['1', '2', '3', '4', '5']:
            return choice
        else:
            print("Invalid choice. Please enter 1, 2, 3, 4, or 5.")

def main():
    """The main function of our program."""
    while True:
        user_choice = main_menu()
        df = load_data()

        if user_choice == '1':
            add_transaction()
        elif user_choice == '2':
            generate_category_report(df)
        elif user_choice == '3':
            generate_monthly_report(df)
        elif user_choice == '4':
            generate_balance_report(df)
        elif user_choice == '5':
            print("Exiting program. Goodbye!")
            break

if __name__ == "__main__":
    main()