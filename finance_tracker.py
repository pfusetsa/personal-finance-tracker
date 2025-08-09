import pandas as pd

def main_menu():
    """Presents a menu to the user and gets their choice."""
    print("\n--- Personal Finance Tracker ---")
    print("1. Add a new transaction")
    print("2. View a report")
    print("3. Exit")

    while True:
        choice = input("Enter your choice: ")
        if choice in ['1', '2', '3']:
            return choice
        else:
            print("Invalid choice. Please enter 1, 2, or 3.")

def main():
    """The main function of our program."""
    while True:
        user_choice = main_menu()

        if user_choice == '1':
            add_transaction() # Call the new function here
        elif user_choice == '2':
            print("Viewing a report...")
            # We will add code here later
        elif user_choice == '3':
            print("Exiting program. Goodbye!")
            break

def add_transaction():
    """Prompts the user for a new transaction and saves it to a CSV file."""
    try:
        date = input("Enter date (YYYY-MM-DD): ")
        description = input("Enter a description: ")
        category = input("Enter a category (e.g., Food, Salary): ")
        amount = float(input("Enter the amount (e.g., 50.00 for income, -25.50 for expense): "))

        # Create a dictionary to hold the new transaction data
        new_transaction = {
            'Date': [date],
            'Description': [description],
            'Category': [category],
            'Amount': [amount]
        }
        
        # Create a DataFrame from the dictionary
        new_df = pd.DataFrame(new_transaction)
        
        # Define the name of our data file
        filename = 'transactions.csv'
        
        # Try to read the existing file. If it doesn't exist, start a new one.
        try:
            existing_df = pd.read_csv(filename)
            updated_df = pd.concat([existing_df, new_df], ignore_index=True)
            updated_df.to_csv(filename, index=False)
            print("Transaction successfully added to existing file.")
        except FileNotFoundError:
            new_df.to_csv(filename, index=False)
            print("Transaction successfully added to a new file.")
            
    except ValueError:
        print("Invalid input. Please make sure the amount is a number.")

if __name__ == "__main__":
    main()