# scripts/initialize_db.py
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'trakfin.db')

def create_connection():
    """ create a database connection to a SQLite database """
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH)
        print(f"SQLite version: {sqlite3.version}")
        print(f"Database created at {DB_PATH}")
    except sqlite3.Error as e:
        print(e)
    return conn

def create_table(conn, create_table_sql):
    """ create a table from the create_table_sql statement """
    try:
        c = conn.cursor()
        c.execute(create_table_sql)
    except sqlite3.Error as e:
        print(e)

def main():
    if os.path.exists(DB_PATH):
        print(f"Database '{DB_PATH}' already exists.")
        response = input("Do you want to delete it and create a new one? (yes/no): ").lower()
        if response != 'yes':
            print("Initialization cancelled.")
            return
        os.remove(DB_PATH)
        print("Existing database removed.")

    sql_users_table = """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        second_name TEXT,
        surname TEXT NOT NULL
    );
    """

    sql_accounts_table = """
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, name)
    );
    """

    sql_categories_table = """
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, name)
    );
    """
    
    sql_transactions_table = """
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        account_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        is_recurrent BOOLEAN DEFAULT 0,
        transfer_id TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (account_id) REFERENCES accounts (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
    );
    """

    sql_settings_table = """
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        UNIQUE(user_id, key),
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """

    # create a database connection
    conn = create_connection()

    # create tables
    if conn is not None:
        print("Creating tables...")
        create_table(conn, sql_users_table)
        create_table(conn, sql_accounts_table)
        create_table(conn, sql_categories_table)
        create_table(conn, sql_transactions_table)
        create_table(conn, sql_settings_table)
        conn.close()
        print("Database initialized successfully.")
    else:
        print("Error! cannot create the database connection.")

if __name__ == '__main__':
    main()