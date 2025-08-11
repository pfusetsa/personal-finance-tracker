import pandas as pd

def add_transaction():
    """
    Prompts the user for a new transaction and saves it to a CSV file.
    Includes validation for category and account from predefined lists.
    """
    try:
        # Predefined categories and accounts
        categories = ['Alquiler & Gastos', 'Internet', 'Oxfam', 'Insparya', 'Mensualidades Apple', 'Suscripciones', 'Deporte', 'Transferencias', 'Compra super', 'Restauración', 'Regalos', 'Euromillones', 'Libros', 'Ropa', 'Ocio', 'Viajes', 'Nómina', 'Intereses', 'Otros ingresos', 'Otros gastos']
        accounts = ['Revolut', 'BBVA', 'Pensiones', 'MyInvestor']

        # Get transaction type
        while True:
            trans_type = input("¿Es un 'ingreso' o 'gasto'? ").lower()
            if trans_type in ['ingreso', 'gasto']:
                break
            print("Entrada inválida. Por favor, introduce 'ingreso' o 'gasto'.")
        
        fecha = input("Introduce la fecha (YYYY-MM-DD): ")
        descripcion = input("Introduce una descripción: ")

        # Validate category input
        while True:
            categoria = input(f"Introduce una categoría {tuple(categories)}: ")
            if categoria in categories:
                break
            print("Categoría inválida. Por favor, selecciona una de la lista.")

        cantidad = float(input("Introduce la cantidad: "))

        # Validate account input
        while True:
            cuenta = input(f"Introduce la cuenta {tuple(accounts)}: ")
            if cuenta in accounts:
                break
            print("Cuenta inválida. Por favor, selecciona una de la lista.")
        
        # Validate recurrence input
        while True:
            recurrente = input("¿Es recurrente? ('Sí' o 'No'): ").lower()
            if recurrente in ['sí', 'no', 'si', 'no']:
                recurrente = 'Sí' if recurrente in ['sí', 'si'] else 'No'
                break
            print("Entrada inválida. Por favor, introduce 'Sí' o 'No'.")

        # Make expenses negative automatically
        if trans_type == 'gasto':
            cantidad = -abs(cantidad)
        
        # Create a dictionary to hold the new transaction data
        new_transaction = {
            'Fecha': [fecha],
            'Descripción': [descripcion],
            'Categoría': [categoria],
            'Cantidad': [cantidad],
            'Cuenta': [cuenta],
            'Recurrente': [recurrente]
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
            print("Transacción añadida con éxito al archivo existente.")
        except FileNotFoundError:
            new_df.to_csv(filename, index=False)
            print("Transacción añadida con éxito a un nuevo archivo.")
            
    except ValueError:
        print("Entrada inválida. Por favor, asegúrate de que la cantidad es un número.")

def add_transfer():
    """Prompts the user for a transfer between accounts and saves it as two transactions."""
    try:
        accounts = ['Revolut', 'BBVA', 'Pensiones', 'MyInvestor']

        fecha = input("Introduce la fecha (YYYY-MM-DD): ")
        descripcion = input("Introduce una descripción (p.ej., 'Transferencia'): ")
        
        while True:
            from_account = input(f"Introduce la cuenta para transferir DESDE {tuple(accounts)}: ")
            if from_account in accounts:
                break
            print("Cuenta inválida. Por favor, selecciona una de la lista.")

        while True:
            to_account = input(f"Introduce la cuenta para transferir A {tuple(accounts)}: ")
            if to_account in accounts and to_account != from_account:
                break
            print("Cuenta inválida. Por favor, selecciona una de la lista y asegúrate de que es diferente de la cuenta de origen.")

        cantidad = float(input("Introduce la cantidad a transferir: "))
        
        # Transfers are never recurrent
        recurrente = 'No'

        # Create two transaction entries
        transfer_out = {
            'Fecha': [fecha],
            'Descripción': [descripcion],
            'Categoría': ['Transferencia Saliente'],
            'Cantidad': [-abs(cantidad)],
            'Cuenta': [from_account],
            'Recurrente': [recurrente]
        }
        
        transfer_in = {
            'Fecha': [fecha],
            'Descripción': [descripcion],
            'Categoría': ['Transferencia Entrante'],
            'Cantidad': [abs(cantidad)],
            'Cuenta': [to_account],
            'Recurrente': [recurrente]
        }
        
        # Combine the two new transactions into a single DataFrame
        new_df = pd.DataFrame(transfer_out)
        new_df = pd.concat([new_df, pd.DataFrame(transfer_in)], ignore_index=True)
        
        # Define the name of our data file
        filename = 'transactions.csv'
        
        # Append the new transactions to the file
        try:
            existing_df = pd.read_csv(filename)
            updated_df = pd.concat([existing_df, new_df], ignore_index=True)
            updated_df.to_csv(filename, index=False)
            print("Transferencia añadida con éxito al archivo existente.")
        except FileNotFoundError:
            new_df.to_csv(filename, index=False)
            print("Transferencia añadida con éxito a un nuevo archivo.")
            
    except ValueError:
        print("Entrada inválida. Por favor, asegúrate de que la cantidad es un número.")

def load_data(filename='transactions.csv'):
    """Loads the transaction data from a CSV file into a DataFrame."""
    try:
        df = pd.read_csv(filename)
        # Ensure Recurrente is of type string
        df['Recurrente'] = df['Recurrente'].astype(str)
        print("Datos cargados con éxito.")
        return df
    except FileNotFoundError:
        print(f"Error: El archivo '{filename}' no fue encontrado.")
        return pd.DataFrame(columns=['Fecha', 'Descripción', 'Categoría', 'Cantidad', 'Cuenta', 'Recurrente'])