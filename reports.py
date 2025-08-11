import pandas as pd

def generate_category_report(df):
    """Generates and prints a summary report of expenses by category."""
    if df.empty:
        print("No data to generate a report.")
        return

    # Filter for expenses
    expenses_df = df[df['Amount'] < 0]

    if expenses_df.empty:
        print("No expenses found to generate a report.")
        return

    # Group by category and sum the amounts
    category_summary = expenses_df.groupby('Category')['Amount'].sum().abs().sort_values(ascending=False)

    print("\n--- Expense Report by Category ---")
    print(category_summary.to_string())
    print("----------------------------------")

def generate_monthly_report(df):
    """Generates and prints a monthly summary of expenses."""
    if df.empty:
        print("No data to generate a report.")
        return

    # Ensure 'Date' column is a proper datetime object
    df['Date'] = pd.to_datetime(df['Date'])
    
    # Filter for expenses
    expenses_df = df[df['Amount'] < 0]
    
    if expenses_df.empty:
        print("No expenses found for monthly report.")
        return

    # Add a 'Year-Month' column for grouping
    expenses_df['Year-Month'] = expenses_df['Date'].dt.to_period('M')
    
    # Group by month and category, then sum the amounts
    monthly_summary = expenses_df.groupby(['Year-Month', 'Category'])['Amount'].sum().abs()
    
    print("\n--- Monthly Expense Report ---")
    print(monthly_summary.unstack(fill_value=0).to_string())
    print("------------------------------")

def generate_balance_report(df):
    """Generates and prints a report of the current total balance."""
    if df.empty:
        print("No transactions found to calculate balance.")
        return

    total_balance = df['Amount'].sum()

    print("\n--- Current Balance Report ---")
    print(f"Total Balance: {total_balance:,.2f}")
    print("------------------------------")