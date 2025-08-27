# scripts/clean_locales.py
import os
import json
import re
import argparse
from pathlib import Path

# --- Configuration ---
PROJECT_ROOT = Path(__file__).parent.parent
FRONTEND_SRC_DIR = PROJECT_ROOT / "frontend" / "src"
# CORRECTED PATH based on your feedback
LOCALES_DIR = PROJECT_ROOT / "frontend" / "public" / "locales"
SOURCE_LOCALE = "en.json"

# --- THE ALLOWLIST ---
ALLOWLIST = {
    "1 Month", "1 Year", "6 Months", "All Time", "Custom", "account_existsError",
    "account_in_useError", "all", "allAccounts", "allCategories", "apply",
    "categoryExistsError", "clear", "deletionStrategyRequiredError",
    "filterAndSortByDate", "filterByAccount", "filterByAmount", "filterByCategory",
    "filterByDateRange", "filterByRecurrent", "invalidStrategyError", "maxAmount",
    "minAmount", "newestToOldest", "oldestToNewest", "sameAccountError",
    "searchDescription", "searchPlaceholder", "sort", "targetCategoryIsSameError",
    "targetCategoryRequiredError", "target_account_is_sameError",
    "target_account_requiredError",
}

def find_all_locale_keys(source_file):
    """Reads the source locale file (e.g., en.json) and returns a set of all keys."""
    try:
        with open(source_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return set(data.keys())
    except FileNotFoundError:
        print(f"❌ Error: Source locale file not found at {source_file}")
        print("Please ensure you are running the script from the project's root directory.")
        return set()

def find_used_keys_in_code(src_dir):
    """Recursively scans .jsx and .js files for translation key usage patterns."""
    used_keys = set()
    key_pattern = re.compile(r"t\.(\w+)|t\[['\"]([^'\"\]]+)['\"]\]")
    
    for root, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith((".jsx", ".js")):
                file_path = Path(root) / file
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    matches = key_pattern.findall(content)
                    for match in matches:
                        key = next((k for k in match if k), None)
                        if key:
                            used_keys.add(key)
    return used_keys

def clean_locale_file(file_path, keys_to_keep):
    """Reads a locale file, removes unused keys, and overwrites it."""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    cleaned_data = {key: data[key] for key in sorted(list(keys_to_keep)) if key in data}
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
        f.write('\n')

def main():
    parser = argparse.ArgumentParser(description="Clean unused translation keys from locale files.")
    parser.add_argument("--delete", action="store_true", help="Actually delete unused keys from files.")
    args = parser.parse_args()

    print("🚀 Starting locale key cleanup...")

    source_file_path = LOCALES_DIR / SOURCE_LOCALE
    all_keys = find_all_locale_keys(source_file_path)
    if not all_keys:
        return

    print(f"🔍 Found {len(all_keys)} total keys in '{SOURCE_LOCALE}'.")
    
    statically_used_keys = find_used_keys_in_code(FRONTEND_SRC_DIR)
    print(f"✅ Found {len(statically_used_keys)} keys used statically in the code.")
    
    # --- IMPROVED REPORTING ---
    final_used_keys = statically_used_keys.union(ALLOWLIST)
    newly_added_from_allowlist = len(final_used_keys) - len(statically_used_keys)
    
    print(f"➕ Adding {newly_added_from_allowlist} keys from the allowlist (that were not found statically).")
    print(f"✨ Total of {len(final_used_keys)} unique keys are considered in use.")
    
    unused_keys = all_keys - final_used_keys
    
    if not unused_keys:
        print(f"\n🎉 Excellent! All keys are considered in use. Nothing to clean.")
        return
        
    print(f"\n🗑️ Found {len(unused_keys)} unused keys:")
    for key in sorted(list(unused_keys)):
        print(f"  - {key}")
        
    if args.delete:
        print("\n⚡ --delete flag detected. Removing unused keys from all locale files...")
        locale_files = [f for f in LOCALES_DIR.glob("*.json")]
        keys_to_keep = final_used_keys
        
        for file_path in locale_files:
            clean_locale_file(file_path, keys_to_keep)
            print(f"   ✓ Cleaned {file_path.name}")
        print("\n✨ Cleanup complete!")
    else:
        print("\nℹ️ This was a dry run. To remove these keys, run the script again with the --delete flag.")

if __name__ == "__main__":
    main()