# migrate_csv_to_db.py

import sqlite3
import pandas as pd
import os

# --- CONFIGURATION ---
DB_FILE = 'finance.db'
FINANCE_XLSX = 'Finanzas.xlsx'
TRANSACTIONS_CSV = 'transactions.csv'

def create_database_and_tables(db_file):
    """Creates the SQLite database and all necessary tables."""
    print(f"Setting up database at '{db_file}'...")
    if os.path.exists(db_file):
        os.remove(db_file)
        print("Removed existing database file for a fresh start.")
    
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        cursor.execute('''
        CREATE TABLE accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
        ''')
        cursor.execute('''
        CREATE TABLE categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
        ''')
        cursor.execute('''
        CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            description TEXT,
            amount REAL NOT NULL,
            is_recurrent BOOLEAN NOT NULL,
            account_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            FOREIGN KEY (account_id) REFERENCES accounts (id),
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )
        ''')
        conn.commit()
        conn.close()
        print("Database and tables created successfully. ✅")
    except sqlite3.Error as e:
        print(f"Database error during creation: {e}")
        raise

def migrate_accounts_from_excel(db_file, excel_file):
    """Migrates accounts from the 'Cuentas' sheet, filtering for specific accounts."""
    print("Migrating accounts from 'Cuentas' sheet...")
    try:
        # --- THIS IS THE FIX ---
        # Define the specific accounts we want to import.
        allowed_accounts = ['Revolut', 'BBVA', 'Pensiones', 'MyInvestor']
        
        # header=1 tells pandas the second row of the sheet is the header.
        df = pd.read_excel(excel_file, sheet_name='Cuentas', header=1)
        
        # Select just the 'Entidad' column and drop any empty rows.
        accounts_df = df[['Entidad']].dropna()
        
        # Filter the DataFrame to only include the allowed accounts.
        accounts_df = accounts_df[accounts_df['Entidad'].isin(allowed_accounts)]
        
        # Remove any duplicate account names before trying to save.
        accounts_df.drop_duplicates(inplace=True)
        
        # Rename for consistency before saving to the database.
        accounts_df.rename(columns={'Entidad': 'name'}, inplace=True)
        
        conn = sqlite3.connect(db_file)
        accounts_df.to_sql('accounts', conn, if_exists='append', index=False)
        conn.close()
        print(f"Successfully migrated {len(accounts_df)} unique accounts. ✅")
        
    except Exception as e:
        print(f"❌ Error migrating accounts: {e}")
        raise

def migrate_categories_from_excel(db_file, excel_file):
    """Migrates categories from the 'Categorías' sheet, handling its specific layout and duplicates."""
    print("Migrating categories from 'Categorías' sheet...")
    try:
        # header=None because there's no header. usecols=[1] to get only the second column.
        df = pd.read_excel(excel_file, sheet_name='Categorías', header=None, usecols=[1])

        # Drop any empty rows from that column.
        categories_df = df.dropna()
        
        # Remove any duplicate category names before trying to save.
        categories_df.drop_duplicates(inplace=True)

        # Rename for consistency before saving to the database.
        categories_df.rename(columns={1: 'name'}, inplace=True)
        
        conn = sqlite3.connect(db_file)
        categories_df.to_sql('categories', conn, if_exists='append', index=False)
        conn.close()
        print(f"Successfully migrated {len(categories_df)} unique categories. ✅")
        
    except Exception as e:
        print(f"❌ Error migrating categories: {e}")
        raise

def migrate_transactions(db_file, csv_file):
    """Migrates the main transactions data from CSV to the database."""
    print(f"Migrating transactions from '{csv_file}'...")
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()

        accounts_map = {name: id for name, id in cursor.execute("SELECT name, id FROM accounts").fetchall()}
        categories_map = {name: id for name, id in cursor.execute("SELECT name, id FROM categories").fetchall()}

        df = pd.read_csv(csv_file)
        df['Recurrente'] = df['Recurrente'].str.lower().isin(['sí', 'si'])
        
        transactions_to_insert = []
        for _, row in df.iterrows():
            # Handle potential variations in account names like "CC BBVA" vs "BBVA"
            # We'll check if the row's account name CONTAINS a known account name
            found_account = None
            for acc_name in accounts_map.keys():
                if acc_name in row['Cuenta']:
                    found_account = acc_name
                    break
            
            account_id = accounts_map.get(found_account)
            category_id = categories_map.get(row['Categoría'])

            if account_id is None or category_id is None:
                # This warning can be removed later, but it's good for debugging now.
                print(f"Warning: Skipping row. Could not find mapping for Account: '{row['Cuenta']}' or Category: '{row['Categoría']}'.")
                continue
                
            transactions_to_insert.append((
                row['Fecha'], row['Descripción'], row['Cantidad'],
                row['Recurrente'], account_id, category_id
            ))
        
        cursor.executemany('''
        INSERT INTO transactions (date, description, amount, is_recurrent, account_id, category_id)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', transactions_to_insert)

        conn.commit()
        conn.close()
        print(f"Successfully migrated {len(transactions_to_insert)} transactions. ✅")
        
    except Exception as e:
        print(f"❌ Error migrating transactions: {e}")
        raise

def main():
    """Main function to run the full migration process."""
    print("--- Starting Final Database Migration ---")
    try:
        create_database_and_tables(DB_FILE)
        migrate_accounts_from_excel(DB_FILE, FINANCE_XLSX)
        migrate_categories_from_excel(DB_FILE, FINANCE_XLSX)
        migrate_transactions(DB_FILE, TRANSACTIONS_CSV)
        print("\n--- ✅ Migration Complete! ---")
        print(f"Your data is now in '{DB_FILE}'. We are ready for the next phase.")
    except Exception as e:
        print(f"\n--- ❌ Migration Failed ---")
        print(f"An error occurred during the process: {e}")

if __name__ == "__main__":
    main()
