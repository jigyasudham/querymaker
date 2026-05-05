"""
Data Portal Automation - "The Robot"
Automates login, query submission, and download
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, ElementNotInteractableException
import time
import threading
import os

class CancellationToken:
    """Thread-safe cancellation token for stopping automation"""
    def __init__(self):
        self._cancelled = False
        self._lock = threading.Lock()
    
    def cancel(self):
        with self._lock:
            self._cancelled = True
    
    def is_cancelled(self):
        with self._lock:
            return self._cancelled

class PortalRobot:
    def __init__(self, portal_url, browser='chrome', headless=False, download_dir=None, cancellation_token=None):
        self.portal_url = portal_url
        self.driver = None
        self.browser = browser
        self.headless = headless
        self.download_dir = download_dir
        self.cancellation_token = cancellation_token or CancellationToken()
        # Error recovery tracking
        self.last_known_request_id = None
        self.current_query_title = None

    def check_cancellation(self):
        """Check if automation should be cancelled"""
        if self.cancellation_token.is_cancelled():
            if self.driver:
                try:
                    self.driver.quit()
                except:
                    pass
            raise Exception("CANCELLED_BY_USER")

    def _extract_portal_error(self):
        """Extract actual error message from portal page"""
        try:
            page_source = self.driver.page_source

            # Portal-specific selectors - check info/warning boxes first (portal uses light blue boxes)
            error_selectors = [
                # Portal info boxes (light blue alerts)
                ".card-panel",
                ".alert",
                ".alert-info",
                ".alert-warning",
                ".alert-danger",
                # Toast messages
                ".toast",
                ".toast-error",
                ".toast-warning",
                # Materialize components
                "[class*='card-panel']",
                # Generic error/warning elements
                ".error-message",
                ".warning-message",
                "[class*='error']",
                "[class*='warning']",
                ".helper-text[data-error]",
                ".red-text",
            ]

            for selector in error_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for el in elements:
                        text = el.text.strip()
                        # Look for problem/error indicators in the text
                        if text and len(text) > 5:
                            text_lower = text.lower()
                            # Check if this contains error/problem keywords
                            if any(kw in text_lower for kw in ['problem', 'error', 'failed', 'invalid', 'syntax', 'check', 'limit', 'denied']):
                                print(f"🔍 Found portal message: {text[:150]}")
                                return text
                except:
                    continue

            # Fallback: look for error keywords in page source
            error_keywords = [
                'had a problem', 'check syntax', 'syntax error', 'limit exceeded',
                'invalid query', 'permission denied', 'access denied', 'failed to execute',
                'execution error', 'query failed', 'timeout exceeded',
                'row limit', 'column limit', 'size limit', 'please check'
            ]

            page_lower = page_source.lower()
            for keyword in error_keywords:
                if keyword in page_lower:
                    # Try to extract surrounding context
                    idx = page_lower.find(keyword)
                    start = max(0, idx - 30)
                    end = min(len(page_source), idx + 150)
                    context = page_source[start:end]
                    # Clean up HTML tags
                    import re
                    clean_context = re.sub(r'<[^>]+>', ' ', context).strip()
                    clean_context = re.sub(r'\s+', ' ', clean_context)
                    if clean_context:
                        print(f"🔍 Found error keyword '{keyword}': {clean_context[:100]}")
                        return clean_context

            return None
        except Exception as e:
            print(f"Error extracting portal error: {e}")
            return None

    def start_browser(self):
        """Initialize and start the browser"""
        try:
            self.check_cancellation()  # ADD THIS
            if self.browser.lower() == 'chrome':
                options = Options()
                if self.headless:
                    options.add_argument('--headless')
                options.add_argument('--no-sandbox')
                options.add_argument('--disable-dev-shm-usage')
                
                # Set download directory
                if self.download_dir:
                    download_dir = self.download_dir
                else:
                    download_dir = os.path.join(os.getcwd(), 'downloads')
                os.makedirs(download_dir, exist_ok=True)
                
                prefs = {
                    "download.default_directory": download_dir,
                    "download.prompt_for_download": False,
                }
                options.add_experimental_option("prefs", prefs)
                
                service = Service(ChromeDriverManager().install())
                self.driver = webdriver.Chrome(service=service, options=options)
            
            return {'status': 'success', 'message': 'Browser started'}
        except Exception as e:
            return {'status': 'error', 'message': f'Failed to start browser: {str(e)}'}

    def _check_for_new_download(self):
        """
        Aggressively check for new downloaded files with debug output
        """
        try:
            download_dir = self.download_dir or os.path.join(os.getcwd(), 'downloads')
            
            if not os.path.exists(download_dir):
                print(f"Download directory does not exist: {download_dir}")
                return None
            
            current_files = set(os.listdir(download_dir))
            new_files = current_files - self.initial_files
            
            if new_files:
                print(f"New files detected: {new_files}")
            
            # Filter complete files
            complete_files = []
            for f in new_files:
                file_path = os.path.join(download_dir, f)
                
                # Skip temp files
                if (f.endswith('.crdownload') or 
                    f.endswith('.tmp') or 
                    f.startswith('.') or
                    f.startswith('~')):
                    print(f"Skipping temp file: {f}")
                    continue
                
                # Check if it's a CSV file
                if not f.lower().endswith('.csv'):
                    print(f"Skipping non-CSV file: {f}")
                    continue
                
                try:
                    file_size = os.path.getsize(file_path)
                    print(f"Checking file: {f} (size: {file_size} bytes)")
                    
                    if file_size < 100:
                        print(f"File too small: {f}")
                        continue
                    
                    # Check if file is stable (not still writing)
                    time.sleep(0.3)
                    new_size = os.path.getsize(file_path)
                    
                    if new_size == file_size and file_size > 0:
                        complete_files.append((f, os.path.getmtime(file_path)))
                        print(f"✓ Valid file found: {f}")
                    else:
                        print(f"File still writing: {f} ({file_size} -> {new_size})")
                
                except Exception as e:
                    print(f"Error checking file {f}: {e}")
                    continue
            
            if complete_files:
                # Return most recent file
                complete_files.sort(key=lambda x: x[1], reverse=True)
                newest_file = complete_files[0][0]
                print(f"✓✓✓ RETURNING FILE: {newest_file}")
                return newest_file
            
            print("No complete files found yet")
            return None
        
        except Exception as e:
            print(f"File check error: {e}")
            return None

    def wait_for_download(self, timeout=300):
        """Wait for download to complete (check for NEW files only)"""
        download_dir = self.download_dir or os.path.join(os.getcwd(), 'downloads')
        start_time = time.time()
        
        print(f"Waiting for download in: {download_dir}")
        print(f"Initial files count: {len(self.initial_files)}")
        
        # Track if we've seen a new .crdownload file appear
        seen_crdownload = False
        
        while (time.time() - start_time) < timeout:
            self.check_cancellation()
            
            try:
                current_files = set(os.listdir(download_dir))
                
                # Find NEW files (that weren't there before)
                new_files = current_files - self.initial_files
                
                # Check for NEW .crdownload files (our download in progress)
                new_crdownload = [f for f in new_files if f.endswith('.crdownload')]
                
                if new_crdownload:
                    seen_crdownload = True
                    print(f"Download in progress... (NEW temp file: {new_crdownload[0]})")
                
                # Check for NEW completed CSV files
                new_csv_files = [f for f in new_files if f.endswith('.csv') and not f.startswith('.')]
                
                if new_csv_files:
                    # Found a new CSV file!
                    newest_csv = new_csv_files[0]
                    print(f"✓✓✓ Download complete: {newest_csv}")
                    time.sleep(2)  # Extra buffer to ensure file is fully written
                    return newest_csv
                
                # If we saw a .crdownload file but now it's gone, the CSV should be there
                if seen_crdownload and not new_crdownload:
                    # The .crdownload disappeared, check again for CSV
                    time.sleep(1)
                    current_files = set(os.listdir(download_dir))
                    new_files = current_files - self.initial_files
                    new_csv_files = [f for f in new_files if f.endswith('.csv') and not f.startswith('.')]
                    
                    if new_csv_files:
                        newest_csv = new_csv_files[0]
                        print(f"✓✓✓ Download complete: {newest_csv}")
                        return newest_csv
            except Exception as e:
                print(f"Error checking downloads: {e}")
            
            time.sleep(2)
        
        print("✗ Download timeout")
        
        # Before giving up, do one final check for new CSV files
        try:
            current_files = set(os.listdir(download_dir))
            new_files = current_files - self.initial_files
            new_csv_files = [f for f in new_files if f.endswith('.csv')]
            
            if new_csv_files:
                print(f"✓ Found file in final check: {new_csv_files[0]}")
                return new_csv_files[0]
        except:
            pass
        
        return None


    # -----------------------------------------------------------------------
    # PORTAL SELECTORS — adapt these to match your portal's HTML structure.
    # The XPaths and link texts below target a Materialize CSS-based portal.
    # Replace them with selectors appropriate for your own portal.
    # -----------------------------------------------------------------------

    def login(self, username, password):
        """Login to the portal"""
        try:
            yield {'status': 'running', 'step': 'Opening portal', 'progress': 10}
            self.driver.get(self.portal_url)
            self.check_cancellation()

            yield {'status': 'running', 'step': 'Entering credentials', 'progress': 20}
            self.check_cancellation()
            # TODO: Replace with the selector for your portal's username input field
            # Example: (By.ID, "username") or (By.NAME, "email") or (By.CSS_SELECTOR, "input[type='email']")
            username_field = WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.XPATH, "YOUR_USERNAME_INPUT_XPATH"))
            )
            username_field.clear()
            username_field.send_keys(username)

            # TODO: Replace with the selector for your portal's password input field
            # Example: (By.ID, "password") or (By.NAME, "password") or (By.CSS_SELECTOR, "input[type='password']")
            password_field = self.driver.find_element(By.XPATH, "YOUR_PASSWORD_INPUT_XPATH")
            password_field.clear()
            password_field.send_keys(password)
            
            yield {'status': 'running', 'step': 'Logging in', 'progress': 30}
            self.check_cancellation()
            # TODO: Replace with the selector for your portal's login submit button
            # Example: (By.CSS_SELECTOR, "button[type='submit']") or (By.XPATH, "//button[text()='Log In']")
            submit_btn = self.driver.find_element(By.XPATH, "YOUR_LOGIN_SUBMIT_BUTTON_XPATH")
            submit_btn.click()
            
            # TODO: Replace with a link text or selector that is present on your portal's dashboard after login
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.LINK_TEXT, "YOUR_NEW_REQUEST_LINK_TEXT"))
            )
            
            if "Welcome" in self.driver.page_source or "Dashboard" in self.driver.title:
                self.check_cancellation()
                yield {'status': 'success', 'step': 'Login successful', 'progress': 40}
            else:
                yield {'status': 'error', 'step': 'Login failed', 'message': 'Invalid credentials'}
                
        except Exception as e:
            yield {'status': 'error', 'step': 'Login error', 'message': str(e)}
    
    def submit_query(self, title, query_sql):
        """Submit a new data request"""
        try:
            yield {'status': 'running', 'step': 'Opening new request form', 'progress': 50}
            self.check_cancellation()
            
            # TODO: Replace link text with the "create new request" link/button label on your portal
            add_request_btn = WebDriverWait(self.driver, 20).until(
                EC.element_to_be_clickable((By.LINK_TEXT, "YOUR_NEW_REQUEST_LINK_TEXT"))
            )
            add_request_btn.click()
            time.sleep(1)  # Further reduced - form loads fast
            
            # Fill Title
            yield {'status': 'running', 'step': 'Filling title', 'progress': 55}
            self.check_cancellation()
            title_field = WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.ID, "title"))
            )
            title_field.clear()
            title_field.send_keys(title)
            self.current_query_title = title
            time.sleep(0.3) # Materialize updates quickly
            
            # Click dropdown
            yield {'status': 'running', 'step': 'Opening request type dropdown', 'progress': 60}
            self.check_cancellation()
            dropdown_trigger = WebDriverWait(self.driver, 15).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "input.select-dropdown.dropdown-trigger"))
            )
            dropdown_trigger.click()
            time.sleep(0.5) # Dropdown opens instantly
            
            # Select Download
            yield {'status': 'running', 'step': 'Selecting Download', 'progress': 65}
            self.check_cancellation()
            download_option = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//ul[contains(@class, 'dropdown-content')]//span[text()='Download']"))
            )
            download_option.click()
            time.sleep(1)  # Form updates quickly after selection
            
            # --- START: NEW MATERIALIZE QUERY PASTING ---
            # Enter query - wait for field to appear after selecting Download
            yield {'status': 'running', 'step': 'Waiting for query field to appear', 'progress': 68}
            self.check_cancellation()
            
            yield {'status': 'running', 'step': 'Entering SQL query', 'progress': 70}
            self.check_cancellation()
            
            # Find the textarea with Materialize class
            query_field = WebDriverWait(self.driver, 15).until(
                EC.visibility_of_element_located((By.ID, "query"))
            )
            
            # Materialize textareas need special handling
            # Remove readonly attribute if present
            self.driver.execute_script("arguments[0].removeAttribute('readonly');", query_field)
            
            # Focus and activate the field
            query_field.click()
            time.sleep(0.3) # Click registers immediately
            
            # Use send_keys (works better with Materialize)
            query_field.send_keys(query_sql)
            time.sleep(0.5) # Materialize processes input fast
            
            # Trigger Materialize validations
            self.driver.execute_script("""
                var event = new Event('input', { bubbles: true });
                arguments[0].dispatchEvent(event);
            """, query_field)
            time.sleep(0.3) # Event dispatch is instant
            # --- END: NEW MATERIALIZE QUERY PASTING ---
            
            
            # --- START: NEW SUBMIT BUTTON LOGIC ---
            # Submit - try multiple ways to click
            yield {'status': 'running', 'step': 'Submitting request', 'progress': 75}
            self.check_cancellation()
            submitted = False
            
            # Method 1: Try by button text
            try:
                # TODO: Replace with the text/selector on your portal's form submit button
                submit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'YOUR_SUBMIT_BUTTON_TEXT')]")
                submit_btn.click()
                submitted = True
            except:
                pass
            
            # Method 2: Try by name attribute
            if not submitted:
                try:
                    submit_btn = self.driver.find_element(By.NAME, "submit")
                    submit_btn.click()
                    submitted = True
                except:
                    pass
            
            # Method 3: Try by type=submit
            if not submitted:
                try:
                    submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                    submit_btn.click()
                    submitted = True
                except:
                    pass
            
            # Method 4: JavaScript click
            if not submitted:
                try:
                    # Try to find a common button class or the one you identified
                    submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button.waves-effect")
                    self.driver.execute_script("arguments[0].click();", submit_btn)
                    submitted = True
                except:
                    pass
            
            if not submitted:
                raise Exception("Could not find or click submit button")
            # --- END: NEW SUBMIT BUTTON LOGIC ---
            
            
            time.sleep(1) # Submission response is quick
            
            # Check for error messages first (portal may show error alongside success message)
            page_source_lower = self.driver.page_source.lower()
            has_problem = 'problem' in page_source_lower or 'check syntax' in page_source_lower
            has_error = 'error' in page_source_lower and 'error_' not in page_source_lower  # Avoid CSS class false positives

            if has_problem or has_error:
                # Extract the actual error message
                error_msg = self._extract_portal_error()
                if error_msg:
                    yield {'status': 'error', 'step': 'Submission failed', 'message': f'Portal error: {error_msg}'}
                    return

            if "Request posted successfully" in self.driver.page_source:
                self.check_cancellation()
                yield {'status': 'success', 'step': 'Request submitted', 'progress': 80}
            else:
                # No clear success or error - assume success but warn
                yield {'status': 'success', 'step': 'Request submitted (unconfirmed)', 'progress': 80}

        except Exception as e:
            yield {'status': 'error', 'step': 'Submission error', 'message': str(e)}
    
    def wait_and_download(self, max_wait_minutes=30):
        """
        Enhanced wait and download with multiple detection strategies
        """
        try:
            max_attempts = max_wait_minutes * 6
            attempt = 0
            consecutive_404_errors = 0
            max_consecutive_404 = 3
            file_check_interval = 5
            last_file_check = 0
            hard_timeout = time.time() + (max_wait_minutes * 60 * 1.5)  # ADD THIS: 1.5x safety margin

            yield {'status': 'running', 'step': 'Waiting for query to process', 'progress': 82}

            # Capture initial files
            download_dir = self.download_dir or os.path.join(os.getcwd(), 'downloads')
            if os.path.exists(download_dir):
                self.initial_files = set(os.listdir(download_dir))
            else:
                os.makedirs(download_dir, exist_ok=True)
                self.initial_files = set()

            time.sleep(3)  # Initial wait before first check

            while attempt < max_attempts:
                # Hard timeout check
                if time.time() > hard_timeout:
                    print(f"⚠️ Hard timeout reached after {max_wait_minutes * 1.5} minutes")
                    yield {
                        'status': 'error',
                        'step': 'Hard timeout',
                        'message': f'Exceeded maximum wait time of {max_wait_minutes} minutes'
                    }
                    return
                
                self.check_cancellation()
                current_time = time.time()
                progress = 82 + int((attempt / max_attempts) * 8)

                # STRATEGY 1: Check for new files FIRST (every 5 seconds)
                if current_time - last_file_check >= file_check_interval:
                    last_file_check = current_time
                    new_file = self._check_for_new_download()

                    if new_file:
                        yield {
                            'status': 'running',
                            'step': f'Download detected: {new_file}',
                            'progress': 95
                        }
                        time.sleep(2)  # Wait to ensure file is complete

                        file_path = os.path.join(download_dir, new_file)
                        yield {
                            'status': 'success',
                            'step': 'Download complete',
                            'progress': 100,
                            'message': f'Downloaded: {new_file}',
                            'fileName': new_file,
                            'filePath': file_path,
                            'file': file_path
                        }
                        return

                # STRATEGY 2: Check for 404 error page and recover
                try:
                    page_source = self.driver.page_source.upper()

                    if "CLIENTERROR" in page_source and "404" in page_source and "HEADOBJECT" in page_source:
                        consecutive_404_errors += 1
                        yield {
                            'status': 'running',
                            'step': f'Portal 404 error detected - recovering... ({consecutive_404_errors}/{max_consecutive_404})',
                            'progress': progress
                        }

                        if consecutive_404_errors >= max_consecutive_404:
                            # Check one more time for file before giving up
                            final_file_check = self._check_for_new_download()
                            if final_file_check:
                                file_path = os.path.join(download_dir, final_file_check)
                                yield {
                                    'status': 'success',
                                    'step': 'Download complete (recovered)',
                                    'progress': 100,
                                    'message': f'Downloaded: {final_file_check}',
                                    'fileName': final_file_check,
                                    'filePath': file_path,
                                    'file': file_path
                                }
                                return

                            yield {
                                'status': 'error',
                                'step': 'Persistent 404 errors',
                                'message': f'Portal returned 404 errors {max_consecutive_404} times.'
                            }
                            return

                        # Try to recover by going to dashboard
                        if self.handle_404_error_page():
                            print("✓ Recovered from 404 error")
                            consecutive_404_errors = 0  # Reset on successful recovery
                            time.sleep(3)
                            continue

                        time.sleep(5)
                        continue

                except Exception as check_error:
                    print(f"Error checking page: {check_error}")

                # STRATEGY 3: Try to refresh status
                refresh_clicked = False
                try:
                    refresh_link = WebDriverWait(self.driver, 5).until(
                        # TODO: Replace with the link text or selector for your portal's status refresh control
                    EC.element_to_be_clickable((By.LINK_TEXT, "YOUR_REFRESH_LINK_TEXT"))
                    )
                    refresh_link.click()
                    refresh_clicked = True
                    consecutive_404_errors = 0  # Reset on successful refresh
                    time.sleep(3)
                except:
                    # If refresh fails, check for file anyway
                    time.sleep(3)

                if not refresh_clicked:
                    yield {
                        'status': 'running',
                        'step': f'Monitoring... ({attempt + 1}/{max_attempts})',
                        'progress': progress
                    }

                # STRATEGY 4: Check page status (but don't trust it completely)
                try:
                    page_text = self.driver.page_source.upper()
                    if "SUCCEEDED" in page_text or "COMPLETE" in page_text:
                        yield {'status': 'running', 'step': 'Query succeeded! Clicking download...', 'progress': 90}
                        
                        time.sleep(1.5)  # Check status faster after seeing SUCCEEDED
                        
                        # First check if file already exists
                        immediate_file = self._check_for_new_download()
                        if immediate_file:
                            file_path = os.path.join(download_dir, immediate_file)
                            yield {
                                'status': 'success',
                                'step': 'Download complete (auto-downloaded)',
                                'progress': 100,
                                'message': f'Downloaded: {immediate_file}',
                                'fileName': immediate_file,
                                'filePath': file_path,
                                'file': file_path
                            }
                            return
                        
                        # Click download link
                        try:
                            download_link = WebDriverWait(self.driver, 10).until(
                                # TODO: Replace with the link text or selector for your portal's result download link
                            EC.element_to_be_clickable((By.LINK_TEXT, "YOUR_DOWNLOAD_LINK_TEXT"))
                            )
                            
                            print("✓ Found Download link")
                            download_link.click()
                            print("✓ Clicked Download link")
                            
                            time.sleep(2)  # Download click response is quick
                            
                            # Get URL after clicking
                            post_click_url = self.driver.current_url
                            print(f"Post-click URL: {post_click_url}")
                            
                            yield {'status': 'running', 'step': 'Waiting for download...', 'progress': 95}
                            
                            # Wait for download with smart refresh strategy
                            download_start = time.time()
                            last_refresh = time.time()
                            refresh_interval = 30  # Refresh every 30 seconds
                            max_wait = 600  # 10 minutes
                            
                            while (time.time() - download_start) < max_wait:
                                self.check_cancellation()
                                
                                # Check for file
                                downloaded_file = self._check_for_new_download()
                                if downloaded_file:
                                    file_path = os.path.join(self.download_dir or os.path.join(os.getcwd(), 'downloads'), downloaded_file)
                                    yield {
                                        'status': 'success', 
                                        'step': 'Download complete', 
                                        'progress': 100, 
                                        'message': f'Downloaded: {downloaded_file}',
                                        'fileName': downloaded_file,
                                        'filePath': file_path,
                                        'file': file_path
                                    }
                                    return
                                
                                # Check if we need to refresh
                                elapsed_since_refresh = time.time() - last_refresh
                                
                                if elapsed_since_refresh >= refresh_interval:
                                    current_url = self.driver.current_url
                                    page_source = self.driver.page_source.upper()
                                    
                                    # Check if we're on download URL or error page
                                    if "/download_file/" in current_url or "CLIENTERROR" in page_source:
                                        print(f"⚠️ Still on download/error page after {int(elapsed_since_refresh)}s, refreshing...")
                                        
                                        try:
                                            self.driver.refresh()
                                            print("✓ Refreshed page")
                                            time.sleep(3)
                                            last_refresh = time.time()
                                        except Exception as refresh_err:
                                            print(f"Refresh failed: {refresh_err}")
                                    
                                    else:
                                        # Not on error page, just wait
                                        last_refresh = time.time()
                                
                                # Progress indicator
                                elapsed_total = int(time.time() - download_start)
                                if elapsed_total % 10 == 0 and elapsed_total > 0:
                                    print(f"Waiting for download... {elapsed_total}s elapsed")
                                
                                time.sleep(2)
                            
                            # Timeout
                            # Before giving up, check if query might still be running
                            print("⚠️ Timeout reached, checking if query is still processing...")

                            try:
                                # Try to go back to the request page to check status
                                if "/download_file/" in self.driver.current_url:
                                    self.driver.back()
                                    time.sleep(3)
                                
                                # Check page status one more time
                                page_source = self.driver.page_source.upper()
                                
                                if "RUNNING" in page_source or "PENDING" in page_source:
                                    yield {
                                        'status': 'error',
                                        'step': 'Query still running',
                                        'message': f'Query did not complete within {int(max_wait/60)} minutes. It may still be processing on the portal - check manually.'
                                    }
                                else:
                                    # Do final file check
                                    final_file = self._check_for_new_download()
                                    if final_file:
                                        file_path = os.path.join(self.download_dir or os.path.join(os.getcwd(), 'downloads'), final_file)
                                        yield {
                                            'status': 'success',
                                            'step': 'Download complete (found after timeout)',
                                            'progress': 100,
                                            'message': f'Downloaded: {final_file}',
                                            'fileName': final_file,
                                            'filePath': file_path,
                                            'file': file_path
                                        }
                                        return
                                    
                                    yield {
                                        'status': 'error',
                                        'step': 'Download timeout',
                                        'message': f'File did not download within {int(max_wait/60)} minutes'
                                    }
                            except Exception as e:
                                print(f"Error during timeout check: {e}")
                                yield {
                                    'status': 'error',
                                    'step': 'Download timeout',
                                    'message': f'File did not download within {int(max_wait/60)} minutes'
                                }

                            return
                            
                        except Exception as e:
                            print(f"Download error: {e}")
                            
                            # Final file check
                            final_check = self._check_for_new_download()
                            if final_check:
                                file_path = os.path.join(download_dir, final_check)
                                yield {
                                    'status': 'success',
                                    'step': 'Download complete (found despite errors)',
                                    'progress': 100,
                                    'message': f'Downloaded: {final_check}',
                                    'fileName': final_check,
                                    'filePath': file_path,
                                    'file': file_path
                                }
                                return
                            
                            yield {'status': 'error', 'step': 'Download failed', 'message': f'Could not download: {str(e)}'}
                            return
    
                    elif "FAILED" in page_text:
                        # Extract actual error message from portal
                        error_msg = self._extract_portal_error() or 'Query execution failed on portal'
                        yield {
                            'status': 'error',
                            'step': 'Query failed',
                            'message': f'Portal error: {error_msg}'
                        }
                        return
    
                    else:
                        # Status is RUNNING/PENDING/UNKNOWN - keep monitoring
                        yield {
                            'status': 'running',
                            'step': f'Query processing... ({int((attempt / max_attempts) * 100)}% of max wait)',
                            'progress': progress
                        }
                except Exception as e:
                    yield {
                        'status': 'running',
                        'step': f'Monitoring... ({attempt + 1}/{max_attempts})',
                        'progress': progress
                    }

                attempt += 1
                time.sleep(5)  # Reduced from 10 to 5 for faster file detection

            # Timeout - do final file check
            final_file_check = self._check_for_new_download()
            if final_file_check:
                file_path = os.path.join(download_dir, final_file_check)
                yield {
                    'status': 'success',
                    'step': 'Download complete (timeout recovery)',
                    'progress': 100,
                    'message': f'Downloaded: {final_file_check}',
                    'fileName': final_file_check,
                    'filePath': file_path,
                    'file': file_path
                }
                return

            yield {
                'status': 'error',
                'step': 'Timeout',
                'message': f'Query did not complete within {max_wait_minutes} minutes'
            }

        except Exception as e:
            if "CANCELLED_BY_USER" in str(e):
                yield {'status': 'cancelled', 'step': 'Cancelled by user', 'message': 'Automation stopped'}
            else:
                yield {'status': 'error', 'step': 'Monitoring error', 'message': str(e)}

    def handle_404_error_page(self):
        """Simple 404 recovery - just go back to dashboard"""
        try:
            page_source = self.driver.page_source.upper()

            if "CLIENTERROR" in page_source and "404" in page_source:
                print("⚠️ 404 error detected - returning to dashboard")

                # Method 1: Try Dashboard button
                try:
                    dashboard_btn = WebDriverWait(self.driver, 5).until(
                        # TODO: Replace with the link text or selector for your portal's dashboard/home navigation
                    EC.element_to_be_clickable((By.LINK_TEXT, "YOUR_DASHBOARD_LINK_TEXT"))
                    )
                    dashboard_btn.click()
                    print("✓ Clicked Dashboard")
                    time.sleep(2)  # Dashboard loads quickly
                    return True
                except:
                    pass

                # Method 2: Direct navigation
                try:
                    base_url = self.portal_url.rsplit('/', 1)[0]
                    dashboard_url = f"{base_url}/dashboard"
                    self.driver.get(dashboard_url)
                    print(f"✓ Navigated to {dashboard_url}")
                    time.sleep(2)  # Direct navigation is fast
                    return True
                except:
                    pass

                return False

            return False

        except Exception as e:
            print(f"404 recovery error: {e}")
            return False

    def run_complete_workflow(self, username, password, title, query_sql, max_wait=30):
        """Execute the complete automation workflow with proper error handling"""
        try:
            # Capture initial files BEFORE starting workflow
            download_dir = self.download_dir or os.path.join(os.getcwd(), 'downloads')
            if not os.path.exists(download_dir):
                os.makedirs(download_dir, exist_ok=True)
            self.initial_files = set(os.listdir(download_dir))
            print(f"📁 Initial files: {len(self.initial_files)} files in {download_dir}")
            
            # Start browser
            result = self.start_browser()
            if result.get('status') == 'error':
                yield result
                return
            
            yield {'status': 'running', 'step': 'Browser started', 'progress': 5}
            
            # Login phase
            login_success = False
            for status in self.login(username, password):
                yield status
                if status.get('status') == 'error':
                    return
                if 'Login successful' in status.get('step', ''):
                    login_success = True
            
            if not login_success:
                yield {'status': 'error', 'step': 'Login failed', 'message': 'Could not verify login'}
                return
            
            # Submit query phase
            submit_success = False
            for status in self.submit_query(title, query_sql):
                yield status
                if status.get('status') == 'error':
                    return
                if 'Request submitted' in status.get('step', ''):
                    submit_success = True
            
            if not submit_success:
                yield {'status': 'error', 'step': 'Submission failed', 'message': 'Could not verify submission'}
                return
            
            # Wait and download phase
            download_success = False
            final_result = None
            
            for status in self.wait_and_download(max_wait_minutes=max_wait):
                yield status
                
                # Check for completion
                if status.get('status') == 'success':
                    download_success = True
                    final_result = status
                    break
                elif status.get('status') == 'error':
                    final_result = status
                    break
                elif status.get('status') == 'cancelled':
                    final_result = status
                    break
            
            # Make sure we yielded a final status
            if final_result:
                yield final_result
            elif not download_success:
                yield {'status': 'error', 'step': 'Download incomplete', 'message': 'Workflow did not complete properly'}
        
        except Exception as e:
            error_msg = str(e)
            if "CANCELLED_BY_USER" in error_msg:
                yield {'status': 'cancelled', 'step': 'Cancelled', 'message': 'Stopped by user'}
            else:
                yield {'status': 'error', 'step': 'Workflow error', 'message': error_msg}
        
        finally:
            # Always close browser
            if self.driver:
                try:
                    time.sleep(2)
                    self.driver.quit()
                except:
                    pass

# Example of how to run it (optional, for testing)
if __name__ == "__main__":
    print("Running Portal Automation Workflow...")
    
    # --- CONFIGURATION ---
    PORTAL_URL = "http://example.com/login" # <-- REPLACE WITH YOUR URL
    USERNAME = "your_username"               # <-- REPLACE WITH YOUR USERNAME
    PASSWORD = "your_password"               # <-- REPLACE WITH YOUR PASSWORD
    QUERY_TITLE = "My Test Query"
    QUERY_SQL = "SELECT * FROM users LIMIT 10;"
    # ---------------------

    robot = PortalRobot(portal_url=PORTAL_URL)
    
    try:
        for status in robot.run_complete_workflow(USERNAME, PASSWORD, QUERY_TITLE, QUERY_SQL):
            print(f"[{status['status'].upper()}] (Progress: {status['progress']}%) {status['step']}")
            if 'message' in status:
                print(f"  > {status['message']}")
            
            if status['status'] == 'error':
                print("\nWorkflow stopped due to error.")
                break
                
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

    print("Workflow finished.")