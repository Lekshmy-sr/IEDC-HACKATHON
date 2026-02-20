import os
import json
import sqlite3
from flask import Flask, jsonify, request, render_template, send_from_directory

app = Flask(__name__)

DB_PATH = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

CACHED_MEDS = []

def load_meds_cache():
    global CACHED_MEDS
    if CACHED_MEDS:
        return
    
    for filename in ['static/medidata.json']:
        if os.path.exists(filename):
            try:
                with open(filename, 'r') as f:
                    CACHED_MEDS = json.load(f)
                return
            except Exception as e:
                print(f"Error loading {filename}: {e}")
    CACHED_MEDS = []

@app.route('/api/medicines', methods=['GET'])
def get_medicines():
    load_meds_cache()
    query = request.args.get('query', '').lower()
    if query:
        filtered = [m for m in CACHED_MEDS if query in m.get('name', '').lower() or query in m.get('composition', '').lower()]
        return jsonify(filtered)
    return jsonify(CACHED_MEDS)

@app.route('/api/locations', methods=['GET'])
def get_locations():
    try:
        with open('static/locations.json', 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/schedules', methods=['GET', 'POST'])
def handle_schedules():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        try:
            conn.execute(
                'INSERT INTO schedules (id, medicine_name, times_per_day, duration_days, time_slots, food_timing) VALUES (?, ?, ?, ?, ?, ?)',
                (data['id'], data['medicine_name'], data['times_per_day'], data['duration_days'], json.dumps(data['time_slots']), data['food_timing'])
            )
            conn.commit()
            return jsonify({"status": "success"}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            conn.close()
    else:
        schedules = conn.execute('SELECT * FROM schedules').fetchall()
        # Convert to list of dicts
        res = []
        for s in schedules:
            d = dict(s)
            d['time_slots'] = json.loads(d['time_slots'])
            res.append(d)
        conn.close()
        return jsonify(res)

@app.route('/api/schedules/<schedule_id>/consume', methods=['POST'])
def consume_medicine(schedule_id):
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO consumption_logs (schedule_id, status) VALUES (?, ?)', (schedule_id, 'consumed'))
        conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/consumption_logs/<schedule_id>', methods=['GET'])
def get_logs(schedule_id):
    conn = get_db_connection()
    logs = conn.execute('SELECT * FROM consumption_logs WHERE schedule_id = ?', (schedule_id,)).fetchall()
    res = [dict(l) for l in logs]
    conn.close()
    return jsonify(res)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
