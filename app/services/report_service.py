from .. import crud
from datetime import date

def get_balance_report(user_id: int):
    """Generates the balance report for a user."""
    report_df, total_balance = crud.get_balance_report(user_id)
    
    final_total_balance = float(total_balance)
    
    return {"balances_by_account": report_df.to_dict(orient="records"), "total_balance": final_total_balance}

def get_balance_evolution_report(user_id: int):
    """Generates the balance evolution report for a user."""
    report_df = crud.get_balance_evolution_report(user_id)
    return report_df.to_dict(orient="records")

def get_category_summary_report(user_id: int, start_date: date, end_date: date, transaction_type: str):
    """Generates the category summary report."""
    report_df = crud.get_category_summary_for_chart(
        user_id=user_id, 
        start_date=str(start_date), 
        end_date=str(end_date), 
        transaction_type=transaction_type
    )
    return report_df.to_dict(orient="records")

def get_monthly_income_expense_report(user_id: int, start_date: date, end_date: date):
    """Generates the monthly income vs. expense report."""
    report_df = crud.get_monthly_income_expense_summary(
        user_id=user_id, 
        start_date=str(start_date), 
        end_date=str(end_date)
    )
    return report_df.to_dict(orient="records")

def get_recurrent_summary_report(user_id: int, start_date: date, end_date: date):
    """Generates the recurrent transaction summary report."""
    report_df = crud.get_recurrent_summary(
        user_id=user_id, 
        start_date=str(start_date), 
        end_date=str(end_date)
    )
    return report_df.to_dict(orient="records")