"""
Query Maker - Complete Python Backend Server
Handles: File uploads, Authentication, Schema processing, Query storage, Batch Automation
"""

from flask import Flask, send_from_directory, jsonify, request, send_file
from flask_cors import CORS, cross_origin
import webbrowser
import threading
import os
import json
import hashlib
import hmac
import secrets
import csv
import time
import datetime
from portal_automation import PortalRobot, CancellationToken
import sys
from pathlib import Path
import logging
from collections import defaultdict

# Fix console encoding for PyInstaller frozen .exe (Windows cp1252 can't handle emojis)
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def get_user_data_dir():
    """Get OS-specific user data directory"""
    if os.name == 'nt':  # Windows
        base = os.environ.get('LOCALAPPDATA') or os.path.expanduser('~\\AppData\\Local')
    elif sys.platform == 'darwin':  # Mac
        base = os.path.expanduser('~/Library/Application Support')
    else:  # Linux
        base = os.environ.get('XDG_DATA_HOME') or os.path.expanduser('~/.local/share')
    
    app_dir = os.path.join(base, 'QueryMaker')
    os.makedirs(app_dir, exist_ok=True)
    return app_dir

# User-specific data directory
USER_DATA_DIR = get_user_data_dir()
BATCH_HISTORY_FILE = os.path.join(USER_DATA_DIR, 'batch_history.json')

print(f"📁 User data directory: {USER_DATA_DIR}")
print(f"📜 Batch history file: {BATCH_HISTORY_FILE}")

# Directories - handle both normal and PyInstaller frozen .exe
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)       # Next to .exe (for user data)
    BUNDLE_DIR = sys._MEIPASS                         # PyInstaller _internal (for bundled assets)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    BUNDLE_DIR = BASE_DIR

# Create Flask app - use BUNDLE_DIR for static assets (dist/ is bundled by PyInstaller)
app = Flask(__name__, static_folder=os.path.join(BUNDLE_DIR, 'dist'))
# Enable CORS for all routes
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# ============================================
# SECURITY: Headers, Rate Limiting, Logging
# ============================================

# Security headers - add to all responses
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response

# Rate limiting for login attempts
login_attempts = defaultdict(list)

def check_rate_limit(ip, max_attempts=5, window=60):
    """Check if IP has exceeded rate limit for login attempts"""
    now = time.time()
    # Clean old attempts outside the window
    login_attempts[ip] = [t for t in login_attempts[ip] if now - t < window]
    if len(login_attempts[ip]) >= max_attempts:
        return False
    login_attempts[ip].append(now)
    return True

def get_client_ip():
    """Get client IP address from request"""
    return request.headers.get('X-Forwarded-For', request.remote_addr)

# Security event logging
security_logger = logging.getLogger('security')
security_handler = logging.FileHandler(os.path.join(BASE_DIR, 'security_events.log'))
security_handler.setFormatter(logging.Formatter('%(asctime)s | %(message)s'))
security_logger.addHandler(security_handler)
security_logger.setLevel(logging.INFO)

def log_security_event(event_type, user_email=None, details=None):
    """Log security-relevant events"""
    ip = get_client_ip()
    msg = f"{event_type} | IP: {ip}"
    if user_email:
        msg += f" | User: {user_email}"
    if details:
        msg += f" | {details}"
    security_logger.info(msg)
    print(f"🔒 Security: {msg}")

# Data directory
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# In-memory storage
current_user_data = None
automation_status = {}
cancellation_tokens = {}

# ============================================
# HELPER FUNCTIONS
# ============================================

def verify_password_pbkdf2(password, stored_hash):
    """Verify password using PBKDF2 (matches React's AuthService)"""
    try:
        parts = stored_hash.split(':')
        if len(parts) != 2:
            return False
        
        salt_hex, hash_hex = parts
        salt = bytes.fromhex(salt_hex)
        
        # Use PBKDF2 with same parameters as React (100000 iterations, SHA-256)
        computed_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        computed_hex = computed_hash.hex()
        
        return hmac.compare_digest(computed_hex, hash_hex)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def parse_csv_to_schema(csv_text):
    """Parse CSV file into schema structure (matches DataService.parseCSV)"""
    try:
        lines = csv_text.strip().split('\n')
        if len(lines) < 2:
            raise ValueError("CSV is empty or has only a header")
        
        # Parse header
        header = [h.strip().lower().replace('_', '') for h in lines[0].split(',')]
        
        # Find column indices (flexible matching)
        def find_index(possible_names):
            for name in possible_names:
                clean_name = name.replace('_', '')
                if clean_name in header:
                    return header.index(clean_name)
            return -1
        
        schema_idx = find_index(['schema', 'tableschema'])
        table_idx = find_index(['table', 'tablename'])
        column_idx = find_index(['column', 'columnname'])
        
        if schema_idx == -1 or table_idx == -1 or column_idx == -1:
            raise ValueError("CSV must contain 'schema', 'table', and 'column' headers")
        
        # Parse data
        data = {}
        for i in range(1, len(lines)):
            values = lines[i].split(',')
            if len(values) <= max(schema_idx, table_idx, column_idx):
                continue
                
            schema_name = values[schema_idx].strip()
            table_name = values[table_idx].strip()
            column_name = values[column_idx].strip()
            
            if not schema_name or not table_name or not column_name:
                continue
            
            if schema_name not in data:
                data[schema_name] = {}
            if table_name not in data[schema_name]:
                data[schema_name][table_name] = []
            if column_name not in data[schema_name][table_name]:
                data[schema_name][table_name].append(column_name)
        
        return data
    except Exception as e:
        raise ValueError(f"CSV parsing error: {str(e)}")

# ============================================
# BATCH HISTORY MANAGEMENT
# ============================================

def load_batch_history():
    """Load batch history from JSON file"""
    history_file = os.path.join('data', 'batch_history.json')
    
    # Create file if it doesn't exist
    if not os.path.exists(history_file):
        os.makedirs('data', exist_ok=True)
        with open(history_file, 'w') as f:
            json.dump([], f)
        return []
    
    try:
        with open(history_file, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        print("⚠️ batch_history.json is corrupted, creating new file")
        with open(history_file, 'w') as f:
            json.dump([], f)
        return []
    except Exception as e:
        print(f"❌ Error loading batch history: {e}")
        return []


def save_batch_to_history(batch_data):
    """Save completed batch to history file"""
    history_file = os.path.join('data', 'batch_history.json')
    
    try:
        # Load existing history
        history = load_batch_history()
        
        # Add new batch at the beginning (most recent first)
        history.insert(0, batch_data)
        
        # Keep only last 100 batches to prevent file from growing too large
        history = history[:100]
        
        # Save back to file
        os.makedirs('data', exist_ok=True)
        with open(history_file, 'w') as f:
            json.dump(history, f, indent=2)
        
        print(f"💾 Batch history saved: {batch_data.get('batchId')}")
        return True
        
    except Exception as e:
        print(f"❌ Error saving batch to history: {e}")
        import traceback
        traceback.print_exc()
        return False
def format_duration(seconds):
    """Format duration in seconds to human-readable string"""
    if not isinstance(seconds, (int, float)) or seconds < 0:
        return "N/A"
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        secs = int(seconds % 60)
        return f"{minutes}m {secs}s"
    else:
        hours = int(seconds / 3600)
        minutes = int((seconds % 3600) / 60)
        return f"{hours}h {minutes}m"

# ============================================
# API: FILE UPLOAD & AUTHENTICATION
# ============================================

@app.route('/api/upload-user-file', methods=['POST'])
def upload_user_file():
    """Handle user_access.json file upload"""
    try:
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file provided'}), 400
        
        file = request.files['file']
        
        if not file.filename.endswith('.json'):
            return jsonify({'status': 'error', 'message': 'File must be .json'}), 400
        
        # Read and parse
        file_content = file.read().decode('utf-8')
        user_data = json.loads(file_content)
        
        # Validate structure
        if 'users' not in user_data or not isinstance(user_data['users'], list):
            return jsonify({'status': 'error', 'message': 'Invalid JSON: Missing "users" array'}), 400
        
        if 'schemaData' not in user_data:
            return jsonify({'status': 'error', 'message': 'Invalid JSON: Missing "schemaData"'}), 400
        
        # Store globally
        global current_user_data
        current_user_data = user_data
        
        return jsonify({
            'status': 'success',
            'message': 'User file loaded',
            'data': user_data
        })
    
    except json.JSONDecodeError:
        return jsonify({'status': 'error', 'message': 'Invalid JSON format'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/verify-login', methods=['POST'])
def verify_login():
    """Verify user login credentials with rate limiting and security logging"""
    try:
        # Rate limiting check
        client_ip = get_client_ip()
        if not check_rate_limit(client_ip):
            log_security_event('LOGIN_RATE_LIMITED', details='Too many login attempts')
            return jsonify({
                'status': 'error',
                'message': 'Too many login attempts. Please wait 60 seconds before trying again.'
            }), 429

        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not current_user_data:
            return jsonify({'status': 'error', 'message': 'No user file loaded'}), 400

        # Find user
        user = next((u for u in current_user_data['users'] if u['email'] == email), None)

        if not user:
            log_security_event('LOGIN_FAILED', user_email=email, details='User not found')
            return jsonify({'status': 'error', 'message': 'Invalid email or password'}), 401

        # Verify password
        is_valid = verify_password_pbkdf2(password, user.get('passwordHash', ''))

        if is_valid:
            log_security_event('LOGIN_SUCCESS', user_email=email)
            return jsonify({
                'status': 'success',
                'user': user,
                'userData': current_user_data
            })
        else:
            log_security_event('LOGIN_FAILED', user_email=email, details='Invalid password')
            return jsonify({'status': 'error', 'message': 'Invalid email or password'}), 401

    except Exception as e:
        log_security_event('LOGIN_ERROR', details=str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ============================================
# API: SCHEMA MANAGEMENT
# ============================================

@app.route('/api/upload-schema-csv', methods=['POST'])
def upload_schema_csv():
    """Handle CSV schema upload"""
    try:
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file provided'}), 400
        
        file = request.files['file']
        
        if not file.filename.endswith('.csv'):
            return jsonify({'status': 'error', 'message': 'File must be .csv'}), 400
        
        # Read and parse CSV
        csv_content = file.read().decode('utf-8-sig')  # Handle BOM
        schema_data = parse_csv_to_schema(csv_content)
        
        return jsonify({
            'status': 'success',
            'message': f'Schema uploaded: {file.filename}',
            'data': schema_data
        })
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/combine-schema-csvs', methods=['POST'])
def combine_schema_csvs():
    """Combine multiple CSV files into one schema"""
    try:
        if 'files' not in request.files:
            return jsonify({'status': 'error', 'message': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        
        if len(files) == 0:
            return jsonify({'status': 'error', 'message': 'No files selected'}), 400
        
        combined_csv = ""
        header_added = False
        
        for file in files:
            if not file.filename.endswith('.csv'):
                continue
            
            csv_content = file.read().decode('utf-8-sig')
            lines = csv_content.strip().split('\n')
            
            if not header_added:
                # Add header from first file
                combined_csv += lines[0] + '\n'
                header_added = True
            
            # Add data rows (skip header)
            combined_csv += '\n'.join(lines[1:]) + '\n'
        
        # Parse combined CSV
        schema_data = parse_csv_to_schema(combined_csv)
        
        return jsonify({
            'status': 'success',
            'message': f'Combined {len(files)} files',
            'data': schema_data
        })
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ============================================
# API: QUERY STORAGE
# ============================================

@app.route('/api/save-query', methods=['POST'])
def save_query():
    """Save query to file"""
    try:
        data = request.get_json()
        user_email = data.get('userEmail', 'anonymous')
        query_type = data.get('type', 'my_queries')  # my_queries, recent
        query_data = data.get('query')
        
        # Sanitize email for filename
        safe_email = user_email.replace('@', '_').replace('.', '_')
        queries_file = os.path.join(DATA_DIR, f'{safe_email}_{query_type}.json')
        
        # Load existing queries
        if os.path.exists(queries_file):
            with open(queries_file, 'r', encoding='utf-8') as f:
                queries = json.load(f)
        else:
            queries = []
        
        # Add new query
        queries.append(query_data)
        
        # Limit recent queries to 50
        if query_type == 'recent' and len(queries) > 50:
            queries = queries[-50:]
        
        # Save
        with open(queries_file, 'w', encoding='utf-8') as f:
            json.dump(queries, f, indent=2)
        
        return jsonify({'status': 'success', 'message': 'Query saved'})
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/update-queries', methods=['POST'])
def update_queries():
    """Replace entire query list"""
    try:
        data = request.get_json()
        user_email = data.get('userEmail')
        query_type = data.get('type', 'my_queries')
        queries = data.get('queries', [])
        
        safe_email = user_email.replace('@', '_').replace('.', '_')
        queries_file = os.path.join(DATA_DIR, f'{safe_email}_{query_type}.json')
        
        # Save entire list
        with open(queries_file, 'w', encoding='utf-8') as f:
            json.dump(queries, f, indent=2)
        
        return jsonify({'status': 'success', 'message': 'Queries updated'})
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/load-queries', methods=['GET'])
def load_queries():
    """Load saved queries"""
    try:
        user_email = request.args.get('userEmail', 'anonymous')
        query_type = request.args.get('type', 'my_queries')
        
        safe_email = user_email.replace('@', '_').replace('.', '_')
        queries_file = os.path.join(DATA_DIR, f'{safe_email}_{query_type}.json')
        
        if os.path.exists(queries_file):
            with open(queries_file, 'r', encoding='utf-8') as f:
                queries = json.load(f)
            return jsonify({'status': 'success', 'data': queries})
        else:
            return jsonify({'status': 'success', 'data': []})
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/import-queries', methods=['POST'])
def import_queries():
    """Import queries from backup file"""
    try:
        data = request.get_json()
        user_email = data.get('userId')
        queries = data.get('queries', [])
        options = data.get('options', {})
        query_type = data.get('type', 'recent')
        
        # Sanitize email for filename
        safe_email = user_email.replace('@', '_').replace('.', '_')
        queries_file = os.path.join(DATA_DIR, f'{safe_email}_{query_type}.json')
        
        existing_queries = []
        
        if os.path.exists(queries_file):
            with open(queries_file, 'r', encoding='utf-8') as f:
                existing_queries = json.load(f)
        
        # Merge or replace based on options
        if options.get('mergeDuplicates'):
            # Skip duplicates by SQL content
            existing_sql = {q.get('sql') for q in existing_queries if q.get('sql')}
            queries = [q for q in queries if q.get('sql') not in existing_sql]
        
        # Combine queries
        combined = queries + existing_queries
        
        # Keep reasonable limit (e.g., 500 queries)
        combined = combined[:500]
        
        # Save
        with open(queries_file, 'w', encoding='utf-8') as f:
            json.dump(combined, f, indent=2)
        
        return jsonify({
            'status': 'success',
            'imported': len(queries),
            'total': len(combined)
        })
        
    except Exception as e:
        print(f"Error importing queries: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/export-queries', methods=['POST'])
def export_queries():
    """Get queries for export"""
    try:
        data = request.get_json()
        user_email = data.get('userId')
        query_type = data.get('type', 'recent')
        
        # Sanitize email for filename
        safe_email = user_email.replace('@', '_').replace('.', '_')
        queries_file = os.path.join(DATA_DIR, f'{safe_email}_{query_type}.json')
        
        if os.path.exists(queries_file):
            with open(queries_file, 'r', encoding='utf-8') as f:
                queries = json.load(f)
            
            return jsonify({
                'status': 'success',
                'queries': queries
            })
        
        return jsonify({
            'status': 'success',
            'queries': []
        })
        
    except Exception as e:
        print(f"Error exporting queries: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/delete-query', methods=['POST'])
def delete_query():
    """Delete a specific query by ID"""
    try:
        data = request.get_json()
        user_email = data.get('userEmail')
        query_type = data.get('type')
        query_id = data.get('queryId')
        
        safe_email = user_email.replace('@', '_').replace('.', '_')
        queries_file = os.path.join(DATA_DIR, f'{safe_email}_{query_type}.json')
        
        if os.path.exists(queries_file):
            with open(queries_file, 'r', encoding='utf-8') as f:
                queries = json.load(f)
            
            # Filter out the query with matching ID
            updated_queries = [q for q in queries if q.get('id') != query_id]
            
            with open(queries_file, 'w', encoding='utf-8') as f:
                json.dump(updated_queries, f, indent=2)
            
            return jsonify({'status': 'success', 'message': 'Query deleted'})
        
        return jsonify({'status': 'error', 'message': 'Query not found'}), 404
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ============================================
# TEST ENDPOINTS
# ============================================

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'success', 'message': 'Python backend running'})

@app.route('/api/test')
def test_endpoint():
    return jsonify({'status': 'success', 'message': 'React and Python are connected! 🎉'})

# ============================================
# API: PORTAL AUTOMATION (SINGLE)
# ============================================

@app.route('/api/run-automation', methods=['POST', 'OPTIONS'])
def run_automation():
    """Start portal automation with cancellation support"""
    
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        data = request.get_json()
        portal_url = data.get('portalUrl')
        username = data.get('username')
        password = data.get('password')
        title = data.get('title')
        query_sql = data.get('querySql')
        browser = data.get('browser', 'chrome')
        
        session_id = f"auto_{int(time.time())}"
        
        # Create cancellation token
        cancel_token = CancellationToken()
        cancellation_tokens[session_id] = cancel_token
        
        # Initialize robot with cancellation token
        robot = PortalRobot(portal_url, browser=browser, headless=False, cancellation_token=cancel_token)
        
        def run_workflow():
            automation_status[session_id] = {
                'status': 'running',
                'step': 'Initializing',
                'progress': 0,
                'steps': []
            }
            
            try:
                for status in robot.run_complete_workflow(username, password, title, query_sql):
                    if session_id in automation_status:
                        automation_status[session_id] = status
                        if 'steps' not in automation_status[session_id]:
                            automation_status[session_id]['steps'] = []
                        automation_status[session_id]['steps'].append({
                            'timestamp': time.time(),
                            'step': status.get('step', ''),
                            'progress': status.get('progress', 0)
                        })
                    
                    if status.get('status') == 'cancelled':
                        break
            
            except Exception as e:
                if session_id in automation_status:
                    automation_status[session_id] = {
                        'status': 'error',
                        'step': 'Error',
                        'message': str(e)
                    }
        
        thread = threading.Thread(target=run_workflow)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'status': 'success',
            'sessionId': session_id,
            'message': 'Automation started'
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/automation-status/<session_id>', methods=['GET'])
def get_automation_status(session_id):
    """Get current automation status"""
    status = automation_status.get(session_id, {'status': 'unknown', 'step': 'Not found'})
    return jsonify(status)

@app.route('/api/cancel-automation/<session_id>', methods=['POST'])
def cancel_automation(session_id):
    """Cancel a running automation"""
    try:
        if session_id in cancellation_tokens:
            cancellation_tokens[session_id].cancel()
            if session_id in automation_status:
                automation_status[session_id]['status'] = 'cancelled'
                automation_status[session_id]['message'] = 'Cancelled by user'
            return jsonify({'status': 'success', 'message': 'Automation cancelled'})
        else:
            return jsonify({'status': 'error', 'message': 'Session not found'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/cancel-batch/<batch_id>', methods=['POST'])
def cancel_batch(batch_id):
    """Cancel entire batch automation"""
    try:
        if batch_id in cancellation_tokens:
            cancellation_tokens[batch_id].cancel()
            if batch_id in automation_status:
                automation_status[batch_id]['status'] = 'cancelled'
                automation_status[batch_id]['message'] = 'Batch cancelled by user'
            return jsonify({'status': 'success', 'message': 'Batch automation cancelled'})
        else:
            return jsonify({'status': 'error', 'message': 'Batch not found'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/cancel-batch-query/<batch_id>/<int:query_index>', methods=['POST'])
def cancel_batch_query(batch_id, query_index):
    """Cancel a specific query in a batch"""
    try:
        query_session_id = f"{batch_id}_query_{query_index}"
        if query_session_id in cancellation_tokens:
            cancellation_tokens[query_session_id].cancel()
            return jsonify({'status': 'success', 'message': f'Query {query_index} cancelled'})
        else:
            return jsonify({'status': 'error', 'message': 'Query session not found'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/download-file', methods=['POST', 'OPTIONS'])
@cross_origin()
def download_file():
    """Download a file by providing the full file path"""
    try:
        # Handle OPTIONS preflight request
        if request.method == 'OPTIONS':
            response = jsonify({'status': 'ok'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
            response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
            return response, 200
        
        data = request.get_json()
        
        if not data or 'filepath' not in data:
            return jsonify({
                'success': False,
                'error': 'No filepath provided'
            }), 400
        
        filepath = data['filepath']
        
        # Security: Ensure filepath is within allowed directories
        # Get absolute path to prevent directory traversal
        abs_filepath = os.path.abspath(filepath)
        
        # Check if file exists
        if not os.path.exists(abs_filepath):
            # Fallback: Check if it's in the downloads directory (if only filename provided)
            downloads_dir = os.path.join(BASE_DIR, 'downloads')
            potential_path = os.path.join(downloads_dir, os.path.basename(filepath))
            
            if os.path.exists(potential_path):
                abs_filepath = potential_path
            else:
                return jsonify({
                    'success': False,
                    'error': f'File not found: {filepath}'
                }), 404
        
        # Check if it's a file (not a directory)
        if not os.path.isfile(abs_filepath):
            return jsonify({
                'success': False,
                'error': 'Path is not a file'
            }), 400
        
        # Get filename for download
        filename = os.path.basename(abs_filepath)
        
        # Send file as attachment (triggers download)
        return send_file(
            abs_filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='text/csv'
        )
        
    except Exception as e:
        print(f"Error in download_file: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/download/<path:filename>', methods=['GET'])
@cross_origin()
def download_file_direct(filename):
    """Direct download via GET request"""
    try:
        # Construct full path
        downloads_dir = os.path.join(BASE_DIR, 'downloads')
        filepath = os.path.join(downloads_dir, filename)
        
        # Security check
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        if not os.path.isfile(filepath):
            return jsonify({'error': 'Not a file'}), 400
        
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='text/csv'
        )
        
    except Exception as e:
        print(f"Error in download_file_direct: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/downloads/<path:filename>')
@cross_origin()
def serve_download(filename):
    """Serve downloaded files"""
    try:
        downloads_dir = os.path.join(BASE_DIR, 'downloads')
        return send_file(
            os.path.join(downloads_dir, filename),
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 404

# ============================================
# API: BATCH SCHEMA AUTOMATION
# ============================================

def run_batch_worker(batch_id, queries, portal_url, username, password, batch_folder, max_wait_per_query):
    """Worker function to process a list of queries for a batch."""
    automation_status[batch_id]['message'] = 'Starting first query...'
    
    for idx, query in enumerate(queries):
        try:
            # Create cancellation token for this specific query
            query_session_id = f"{batch_id}_query_{idx}"
            query_cancel_token = CancellationToken()
            cancellation_tokens[query_session_id] = query_cancel_token
            cancellation_tokens[batch_id] = query_cancel_token
            
            automation_status[batch_id]['current'] = idx + 1
            automation_status[batch_id]['currentQueryId'] = query_session_id
            automation_status[batch_id]['message'] = f'Processing query {idx + 1}/{len(queries)}'
            
            robot = PortalRobot(
                portal_url, 
                browser='chrome', 
                headless=False, 
                download_dir=batch_folder,
                cancellation_token=query_cancel_token
            )
            
            title = f"Schema_Batch_{idx + 1}"
            final_status = None
            workflow_succeeded = False
            workflow_failed = False
            
            # CRITICAL FIX: Wrap generator in try-except with timeout protection
            try:
                status_timeout = time.time() + (max_wait_per_query * 60 * 2)  # 2x the max wait as safety
                
                for status in robot.run_complete_workflow(username, password, title, query, max_wait=max_wait_per_query):
                    # Timeout protection
                    if time.time() > status_timeout:
                        print(f"⚠️ Query {idx + 1} exceeded safety timeout")
                        workflow_failed = True
                        final_status = {'status': 'error', 'message': 'Exceeded maximum time limit'}
                        break
                    
                    automation_status[batch_id]['message'] = f"Query {idx + 1}/{len(queries)}: {status.get('step', 'Processing')}"
                    automation_status[batch_id]['currentProgress'] = status.get('progress', 0)
                    
                    # Log detailed status for debugging
                    if status.get('status') in ['error', 'success', 'cancelled']:
                        print(f"Query {idx + 1} final status: {status.get('status')} - {status.get('message', status.get('step', ''))}")
                    
                    if status.get('status') == 'cancelled':
                        automation_status[batch_id]['failed'].append({
                            'query': idx + 1, 'sql': query, 'error': 'Cancelled by user',
                            'schemas': query.split("IN (")[1].split(")")[0] if "IN (" in query else f"Batch {idx + 1}"
                        })
                        if batch_id in cancellation_tokens and cancellation_tokens[batch_id].is_cancelled():
                            automation_status[batch_id]['status'] = 'cancelled'
                            automation_status[batch_id]['message'] = 'Batch cancelled by user'
                            return
                        workflow_failed = True
                        break
                    
                    if status.get('status') == 'success' and 'Download complete' in status.get('step', ''):
                        workflow_succeeded = True
                        final_status = status
                        break
                    
                    if status.get('status') == 'error':
                        workflow_failed = True
                        final_status = status
                        break
            
            except GeneratorExit:
                print(f"Generator closed for query {idx + 1}")
                if not workflow_succeeded and not workflow_failed:
                    workflow_failed = True
                    final_status = {'status': 'error', 'message': 'Workflow interrupted'}
            
            except Exception as gen_error:
                print(f"Generator error for query {idx + 1}: {gen_error}")
                workflow_failed = True
                final_status = {'status': 'error', 'message': str(gen_error)}
            
            # Record result with better logging
            if workflow_succeeded and final_status:
                print(f"✓ Query {idx + 1} succeeded: {final_status.get('fileName', 'unknown file')}")
                automation_status[batch_id]['success'].append({
                    'query': idx + 1, 'sql': query, 'file': final_status.get('filePath'),
                    'schemas': query.split("IN (")[1].split(")")[0] if "IN (" in query else f"Batch {idx + 1}"
                })
            else:
                error_msg = final_status.get('message', 'Workflow did not complete') if final_status else 'No response from workflow'
                print(f"✗ Query {idx + 1} failed: {error_msg}")
                automation_status[batch_id]['failed'].append({
                    'query': idx + 1, 'sql': query, 'error': error_msg,
                    'schemas': query.split("IN (")[1].split(")")[0] if "IN (" in query else f"Batch {idx + 1}"
                })
            
            # Delay before next query
            print(f"Waiting 5 seconds before next query...")
            time.sleep(5)
            
        except Exception as e:
            print(f"Batch error for query {idx + 1}: {e}")
            automation_status[batch_id]['failed'].append({
                'query': idx + 1, 'sql': query, 'error': str(e),
                'schemas': f"Batch {idx + 1}"
            })
    
    # At the END of the function, when batch completes:
    try:
        # Calculate final statistics
        end_time = datetime.datetime.now()
        start_time = datetime.datetime.fromisoformat(automation_status[batch_id]['startTime'])
        duration_seconds = (end_time - start_time).total_seconds()
        
        # BUILD QUERIES ARRAY with proper structure for frontend
        queries_detail = []
        
        # Add successful queries
        for success_item in automation_status[batch_id]['success']:
            file_path = success_item.get('file', '')
            file_name = os.path.basename(file_path) if file_path else 'unknown.csv'
            
            queries_detail.append({
                'query': success_item.get('query'),
                'schemas': success_item.get('schemas', ''),
                'fileName': file_name,
                'file': file_path,
                'status': 'success',
                'duration': 'N/A',  # We don't track individual durations yet
                'message': f"Downloaded: {file_name}"
            })
        
        # Add failed queries
        for failed_item in automation_status[batch_id]['failed']:
            queries_detail.append({
                'query': failed_item.get('query'),
                'schemas': failed_item.get('schemas', ''),
                'error': failed_item.get('error', 'Unknown error'),
                'status': 'failed',
                'duration': 'N/A'
            })
        
        # Sort by query number
        queries_detail.sort(key=lambda x: x.get('query', 0))
        
        # Prepare batch data for history with CORRECT structure
        batch_history_data = {
            'batchId': batch_id,
            'datetime': automation_status[batch_id]['datetime'],
            'startTime': automation_status[batch_id]['startTime'],
            'endTime': end_time.isoformat(),
            'totalQueries': automation_status[batch_id]['total'],
            'succeeded': len(automation_status[batch_id]['success']),
            'failed': len(automation_status[batch_id]['failed']),
            'folder': automation_status[batch_id].get('folder', 'N/A'),
            'duration': format_duration(duration_seconds),
            'queries': queries_detail  # ✅ This is what the frontend expects!
        }
        
        # Save to history file
        save_batch_to_history(batch_history_data)
        
        print(f"🏁 Batch complete: {len(automation_status[batch_id]['success'])} succeeded, {len(automation_status[batch_id]['failed'])} failed")
        print(f"💾 Batch history saved")
        
    except Exception as e:
        print(f"❌ Error saving batch history: {e}")
        import traceback
        traceback.print_exc()

    automation_status[batch_id]['status'] = 'complete'
    automation_status[batch_id]['message'] = 'Batch processing complete'

@app.route('/api/run-batch-automation', methods=['POST'])
def run_batch_automation():
    """Run multiple schema fetch queries in batch"""
    try:
        data = request.get_json()
        portal_url = data.get('portalUrl')
        username = data.get('username')
        password = data.get('password')
        queries = data.get('queries')
        folder_name = data.get('folderName')
        max_wait_per_query = data.get('maxWaitMinutes', 30)
        batch_id = f"batch_{int(time.time())}"
        
        # Create batch folder with custom name if provided
        if folder_name:
            batch_folder = os.path.join(BASE_DIR, 'downloads', folder_name)
        else:
            batch_folder = os.path.join(BASE_DIR, 'downloads', f'schema_batch_{batch_id}')
        os.makedirs(batch_folder, exist_ok=True)
        
        # IMPORTANT: Initialize batch status IMMEDIATELY before thread starts
        automation_status[batch_id] = {
            'status': 'running',
            'total': len(queries),
            'current': 0,
            'success': [],
            'failed': [],
            'folder': batch_folder,
            'message': 'Initializing batch...',
            'currentProgress': 0,
            'currentQueryId': None,
            'startTime': datetime.datetime.now().isoformat(),
            'datetime': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # Now start the background thread using the worker
        thread = threading.Thread(target=run_batch_worker, args=(
            batch_id, queries, portal_url, username, password, batch_folder, max_wait_per_query
        ))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'status': 'success',
            'batchId': batch_id,
            'message': 'Batch automation started'
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/retry-failed-batch', methods=['POST'])
def retry_failed_batch():
    """Retry only the failed queries from a completed batch"""
    try:
        data = request.json
        original_batch_id = data.get('originalBatchId')
        username = data.get('username')
        password = data.get('password')
        
        if not all([original_batch_id, username, password]):
            return jsonify({'status': 'error', 'message': 'Missing required fields: originalBatchId, username, password'}), 400
        
        print(f"🔄 Retrying failed queries from batch: {original_batch_id}")
        
        # Load the original batch data from history
        history_file = BATCH_HISTORY_FILE
        if not os.path.exists(history_file):
            return jsonify({'status': 'error', 'message': 'Batch history not found'}), 404
        
        with open(history_file, 'r') as f:
            history = json.load(f)
        
        original_batch = next((entry for entry in history if entry.get('batchId') == original_batch_id), None)
        
        if not original_batch:
            return jsonify({'status': 'error', 'message': 'Original batch not found in history'}), 404
        
        # Extract failed queries that have the original SQL
        source_list = original_batch.get('failedList', [])
        if not source_list:
            source_list = [q for q in original_batch.get('queries', []) if q.get('status') == 'failed' or 'error' in q]

        failed_queries_to_retry = [q for q in source_list if q.get('sql')]
        
        if not failed_queries_to_retry:
            return jsonify({'status': 'error', 'message': 'No failed queries with stored SQL found to retry'}), 400
        
        print(f"✓ Found {len(failed_queries_to_retry)} failed queries to retry.")
        
        # Get portal info from original batch
        portal_url = original_batch.get('portalUrl')
        if not portal_url:
            return jsonify({'status': 'error', 'message': 'Portal URL not found in original batch history. Cannot retry.'}), 400

        # Create new batch for retry
        retry_batch_id = f"retry_{int(time.time())}"
        batch_folder = original_batch.get('folder', os.path.join(BASE_DIR, 'downloads', f'schema_batch_{retry_batch_id}'))
        os.makedirs(batch_folder, exist_ok=True)

        # Initialize batch status
        automation_status[retry_batch_id] = {
            'status': 'running',
            'current': 0,
            'total': len(failed_queries_to_retry),
            'success': [],
            'failed': [],
            'message': f'Retrying {len(failed_queries_to_retry)} failed queries...',
            'originalBatchId': original_batch_id,
            'isRetry': True,
            'startTime': datetime.datetime.now().isoformat(),
            'folder': batch_folder,
            'currentProgress': 0
        }

        # Extract just the SQL strings for the worker
        queries_sql_list = [q['sql'] for q in failed_queries_to_retry]
        original_wait_time = original_batch.get('maxWaitMinutes', 30)

        # Start retry in background thread using the SAME worker function
        thread = threading.Thread(target=run_batch_worker, args=(
            retry_batch_id, 
            queries_sql_list, 
            portal_url, 
            username, 
            password, 
            batch_folder, 
            original_wait_time
        ))
        thread.daemon = True
        thread.start()
        
        return jsonify({'status': 'success', 'batchId': retry_batch_id})
        
    except Exception as e:
        print(f"❌ Error starting retry: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/batch-status/<batch_id>', methods=['GET'])
def get_batch_status(batch_id):
    """Get batch automation status"""
    if batch_id in automation_status:
        return jsonify(automation_status[batch_id])
    else:
        return jsonify({
            'status': 'unknown',
            'message': 'Batch not found - it may have completed or expired'
        }), 404

@app.route('/api/batch-history', methods=['GET'])
def get_batch_history():
    """Get batch automation history"""
    history_data = load_batch_history()
    return jsonify({'status': 'success', 'data': history_data})

@app.route('/api/batch-details/<batch_id>', methods=['GET'])
def get_batch_details(batch_id):
    """Get detailed information for a specific batch"""
    try:
        # First check if batch is still in memory (running or recently completed)
        if batch_id in automation_status:
            batch_data = automation_status[batch_id].copy()
            
            # Calculate duration if completed
            if batch_data.get('endTime') and batch_data.get('startTime'):
                start = datetime.datetime.fromisoformat(batch_data['startTime'])
                end = datetime.datetime.fromisoformat(batch_data['endTime'])
                duration_seconds = (end - start).total_seconds()
                batch_data['duration'] = format_duration(duration_seconds)
            
            return jsonify({
                'status': 'success',
                'data': batch_data
            })
        
        # If not in memory, look in batch_history.json
        history_data = load_batch_history()
        
        for batch in history_data:
            if batch.get('batchId') == batch_id:
                return jsonify({
                    'status': 'success',
                    'data': batch
                })
        
        # Batch not found anywhere
        return jsonify({
            'status': 'error',
            'message': f'Batch {batch_id} not found in history or active batches'
        }), 404
        
    except Exception as e:
        print(f"❌ Error loading batch details for {batch_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': f'Failed to load batch details: {str(e)}'
        }), 500

# ============================================
# JSON ERROR HANDLERS
# ============================================
@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({'status': 'error', 'message': 'API endpoint not found'}), 404
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'status': 'error', 'message': 'Method not allowed for this endpoint'}), 405

@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({'status': 'error', 'message': f'Internal server error: {e}'}), 500

# ============================================
# SERVE REACT APP
# ============================================

@app.route('/')
def serve_react_app():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    if path.startswith('api/'):
        return jsonify({'status': 'error', 'message': 'API route not found'}), 404
    try:
        return send_from_directory(app.static_folder, path)
    except:
        return send_from_directory(app.static_folder, 'index.html')

# Clear any stale automation status on server start
def cleanup_stale_automations():
    """Clear automation status that's older than 1 hour"""
    current_time = time.time()
    stale_keys = []
    
    for key in list(automation_status.keys()):
        try:
            if key.startswith('batch_') or key.startswith('auto_') or key.startswith('retry_'):
                # Handle keys with different formats
                timestamp = 0
                parts = key.split('_')
                # If last part is numeric, treat as timestamp
                if parts[-1].isdigit():
                    timestamp = int(parts[-1])
                
                if timestamp > 0 and current_time - timestamp > 3600:
                    stale_keys.append(key)
        except:
            pass
    
    for key in stale_keys:
        del automation_status[key]
        if key in cancellation_tokens:
            del cancellation_tokens[key]
    
    if stale_keys:
        print(f"🧹 Cleaned up {len(stale_keys)} stale automation sessions")

# ============================================
# AUTO-OPEN BROWSER & START SERVER
# ============================================

def open_browser():
    webbrowser.open('http://localhost:5000')

if __name__ == '__main__':
    # Clean up stale data on startup
    cleanup_stale_automations()

    print("=" * 60)
    print("🚀 Query Maker is starting...")
    print("=" * 60)
    print(f"📁 Serving from: {BASE_DIR}")
    print(f"💾 Data directory: {DATA_DIR}")
    print(f"🌐 Opening browser at: http://localhost:5000")
    print("=" * 60)
    print("✅ Server is ready!")
    print("🛑 Press Ctrl+C to stop")
    print("=" * 60)
    
    threading.Timer(1.5, open_browser).start()
    
    app.run(
        host='localhost',
        port=5000,
        debug=False,
        use_reloader=False
    )