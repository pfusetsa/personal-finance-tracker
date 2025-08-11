import pandas as pd

def generate_category_report(df):
    """Generates and prints a summary report of expenses by category."""
    if df.empty:
        print("No hay datos para generar un informe.")
        return

    # Optional filter by account
    accounts = df['Cuenta'].unique()
    print("Cuentas disponibles:", ", ".join(accounts))
    account_filter = input("Introduce una cuenta para filtrar (o presiona Enter para todas): ")
    
    if account_filter:
        df = df[df['Cuenta'] == account_filter]
        if df.empty:
            print(f"No se encontraron transacciones para la cuenta: {account_filter}")
            return

    # Filter for expenses (assuming negative values are expenses)
    expenses_df = df[df['Cantidad'] < 0]

    if expenses_df.empty:
        print("No se encontraron gastos para generar un informe.")
        return
        
    # Group by category and sum the amounts
    category_summary = expenses_df.groupby('Categoría')['Cantidad'].sum().abs().sort_values(ascending=False)

    print(f"\n--- Informe de Gastos por Categoría ({account_filter if account_filter else 'Todas las Cuentas'}) ---")
    print(category_summary.to_string())
    print("----------------------------------")

def generate_monthly_report(df):
    """Generates and prints a monthly summary of expenses."""
    if df.empty:
        print("No hay datos para generar un informe.")
        return

    # Ensure 'Fecha' column is a proper datetime object
    df['Fecha'] = pd.to_datetime(df['Fecha'])
    
    # Filter for expenses
    expenses_df = df[df['Cantidad'] < 0]
    
    if expenses_df.empty:
        print("No se encontraron gastos para el informe mensual.")
        return

    # Add a 'Year-Month' column for grouping
    expenses_df['Year-Month'] = expenses_df['Fecha'].dt.to_period('M')
    
    # Group by month and category, then sum the amounts
    monthly_summary = expenses_df.groupby(['Year-Month', 'Categoría'])['Cantidad'].sum().abs()
    
    print("\n--- Informe Mensual de Gastos ---")
    print(monthly_summary.unstack(fill_value=0).to_string())
    print("------------------------------")

def generate_balance_report(df):
    """Generates and prints a report of the current total balance."""
    if df.empty:
        print("No se encontraron transacciones para calcular el saldo.")
        return

    # Group by account and sum the amounts to get a balance for each
    account_balances = df.groupby('Cuenta')['Cantidad'].sum()
    total_balance = df['Cantidad'].sum()

    print("\n--- Informe de Saldo Actual ---")
    print(account_balances.to_string(header=False)) # Display balances per account
    print("-" * 28)
    print(f"Saldo Total: {total_balance:,.2f}")
    print("------------------------------")