import pandas as pd
from data_handler import add_transaction, add_transfer, load_data
from reports import generate_category_report, generate_monthly_report, generate_balance_report

def main_menu():
    """Presents a menu to the user and gets their choice."""
    print("\n--- Finanzas Personales ---")
    print("1. Añadir una nueva transacción")
    print("2. Añadir una nueva transferencia")
    print("3. Generar un informe de saldo total")
    print("4. Generar un informe mensual")
    print("5. Generar un informe por categoría")
    print("6. Salir")

    while True:
        choice = input("Introduce tu elección: ")
        if choice in ['1', '2', '3', '4', '5', '6']:
            return choice
        else:
            print("Entrada inválida. Por favor, introduce un número del 1 al 6.")

def main():
    """The main function of our program."""
    while True:
        user_choice = main_menu()
        df = load_data()

        if user_choice == '1':
            add_transaction()
        elif user_choice == '2':
            add_transfer()
        elif user_choice == '3':
            generate_balance_report(df)
        elif user_choice == '4':
            generate_monthly_report(df)
        elif user_choice == '5':
            generate_category_report(df)
        elif user_choice == '6':
            print("Saliendo del programa. ¡Adiós!")
            break

if __name__ == "__main__":
    main()