import sqlite3
import os
import uuid
from collections import defaultdict

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'finance.db')

def backfill():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("Fetching transfer category IDs...")
    cursor.execute("SELECT id FROM categories WHERE name IN ('Transfer', 'Transferencias')")
    transfer_cat_ids_rows = cursor.fetchall()
    if not transfer_cat_ids_rows:
        print("No 'Transfer' or 'Transferencias' category found. Exiting.")
        return
    
    transfer_cat_ids = [row['id'] for row in transfer_cat_ids_rows]
    placeholders = ','.join('?' for _ in transfer_cat_ids)

    print("Finding all legacy transfer transactions...")
    cursor.execute(
        f"SELECT * FROM transactions WHERE category_id IN ({placeholders}) AND transfer_id IS NULL",
        transfer_cat_ids
    )
    transactions = cursor.fetchall()

    # Group transactions to find pairs
    potential_pairs = defaultdict(list)
    for tx in transactions:
        key = (tx['date'], tx['description'], abs(tx['amount']))
        potential_pairs[key].append(dict(tx))

    print(f"Found {len(potential_pairs)} potential transfer groups.")
    
    updates_to_make = []
    for key, group in potential_pairs.items():
        if len(group) == 2:
            # Check if it's a true pair (one positive, one negative)
            amounts = [tx['amount'] for tx in group]
            if sum(amounts) == 0:
                transfer_id = str(uuid.uuid4())
                updates_to_make.append((transfer_id, group[0]['id']))
                updates_to_make.append((transfer_id, group[1]['id']))

    if not updates_to_make:
        print("No new pairs found to update.")
        conn.close()
        return

    print(f"Found {len(updates_to_make) // 2} pairs to update. Applying changes...")
    cursor.executemany(
        "UPDATE transactions SET transfer_id = ? WHERE id = ?",
        updates_to_make
    )
    conn.commit()
    conn.close()
    
    print(f"✅ Success! Backfilled {len(updates_to_make) // 2} transfers.")

if __name__ == "__main__":
    backfill()