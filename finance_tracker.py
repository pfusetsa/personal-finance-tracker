import pandas as pd
from reports import generate_category_report, generate_monthly_report

def main_menu():
    """Presents a menu to the user and gets their choice."""
    print("\n--- Personal Finance Tracker ---")
    print("1. Add a new transaction")
    print("2. Generate a category report")
    print("3. Generate a monthly report")
    print("4. Exit")

    while True:
        choice = input("Enter your choice: ")
        if choice in ['1', '2', '3', '4']:
            return choice
        else:
            print("Invalid choice. Please enter 1, 2, 3, or 4.")

def add_transaction():
    """Prompts the user for a new transaction and saves it to a CSV file."""
    # ... (rest of the add_transaction function remains unchanged)
    try:
        # Get the transaction type first
        while True:
            trans_type = input("Is this an 'income' or 'expense'? ").lower()
            if trans_type in ['income', 'expense']:
                break
            else:
                print("Invalid input. Please enter 'income' or 'expense'.")
                
        date = input("Enter date (YYYY-MM-DD): ")
        description = input("Enter a description: ")
        category = input("Enter a category (e.g., Food, Salary): ")
        amount = float(input("Enter the amount: "))
        
        # Make expenses negative automatically
        if trans_type == 'expense':
            amount = -abs(amount)
        
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

def load_data(filename='transactions.csv'):
    """Loads the transaction data from a CSV file into a DataFrame."""
    try:
        df = pd.read_csv(filename)
        print("Data loaded successfully.")
        return df
    except FileNotFoundError:
        print(f"Error: The file '{filename}' was not found.")
        return pd.DataFrame()

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
            print("Exiting program. Goodbye!")
            break

if __name__ == "__main__":
    main()