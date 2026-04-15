import os
from dotenv import load_dotenv
from sqlalchemy import text
from sqlmodel import create_engine

# Load environment variables (DATABASE_URL)
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment.")
    exit(1)

# Connect and migrate
engine = create_engine(DATABASE_URL)

print(f"Connecting to database to check for missing columns...")

columns_to_add = [
    "learning_path_json",
    "keyword_suggestions_json",
    "recommended_resources_json"
]

with engine.connect() as conn:
    for col in columns_to_add:
        try:
            # Check if column exists first (PostgreSQL specific check)
            check_sql = text(f"""
                SELECT count(*) 
                FROM information_schema.columns 
                WHERE table_name='analyses' AND column_name='{col}';
            """)
            exists = conn.execute(check_sql).scalar()
            
            if exists == 0:
                print(f"Adding column '{col}' to table 'analyses'...")
                alter_sql = text(f"ALTER TABLE analyses ADD COLUMN {col} TEXT DEFAULT '[]';")
                conn.execute(alter_sql)
                print(f"Successfully added '{col}'.")
            else:
                print(f"Column '{col}' already exists.")
        except Exception as e:
            print(f"Error processing column '{col}': {e}")
    
    conn.commit()
    print("Migration complete.")
