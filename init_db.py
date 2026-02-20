import sqlite3

def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # Tables for medicine schedules
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        medicine_name TEXT NOT NULL,
        times_per_day INTEGER NOT NULL,
        duration_days INTEGER NOT NULL,
        time_slots TEXT, -- JSON string: ["morning", "noon", "night"]
        food_timing TEXT, -- before_food / after_food
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Table for consumption logs
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS consumption_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id TEXT NOT NULL,
        consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT, -- consumed
        FOREIGN KEY (schedule_id) REFERENCES schedules (id)
    )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == "__main__":
    init_db()
