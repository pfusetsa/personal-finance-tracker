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

def generate_account_evolution_report(df):
    """Generates a report showing the evolution of each account's balance over a time range."""
    if df.empty:
        print("No hay datos para generar un informe de evolución.")
        return

    try:
        start_date_str = input("Introduce la fecha de inicio (YYYY-MM-DD): ")
        end_date_str = input("Introduce la fecha de fin (YYYY-MM-DD): ")
        
        # Convert date strings to datetime objects
        df['Fecha'] = pd.to_datetime(df['Fecha'])
        start_date = pd.to_datetime(start_date_str)
        end_date = pd.to_datetime(end_date_str)

        # Filter data for the specified time range
        filtered_df = df[(df['Fecha'] >= start_date) & (df['Fecha'] <= end_date)]

        if filtered_df.empty:
            print("\nNo se encontraron transacciones en el rango de fechas especificado.")
            return

        # Calculate net change for each account within the period
        account_evolution = filtered_df.groupby('Cuenta')['Cantidad'].sum()

        # Calculate initial balance for context (before start date)
        initial_balances = df[df['Fecha'] < start_date].groupby('Cuenta')['Cantidad'].sum()
        
        print(f"\n--- Evolución de Cuentas ({start_date_str} a {end_date_str}) ---")
        for account in df['Cuenta'].unique():
            initial = initial_balances.get(account, 0)
            change = account_evolution.get(account, 0)
            final = initial + change
            
            print(f"Cuenta: {account}")
            print(f"  Saldo Inicial: {initial:,.2f}€")
            print(f"  Cambio Neto: {change:,.2f}€")
            print(f"  Saldo Final: {final:,.2f}€")
            print("-" * 28)
            
    except ValueError:
        print("Entrada de fecha inválida. Por favor, utiliza el formato YYYY-MM-DD.")