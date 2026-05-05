"""
Test Selenium Setup
Run this to verify browser automation works
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

def test_selenium():
    print("Testing Selenium setup...")
    
    # Setup Chrome options
    chrome_options = Options()
    # chrome_options.add_argument('--headless')  # Uncomment to run without GUI
    
    try:
        # Initialize Chrome driver
        print("Starting Chrome browser...")
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Test navigation
        print("Opening Google...")
        driver.get("https://www.google.com")
        
        print(f"Page title: {driver.title}")
        
        # Wait 3 seconds so you can see it
        time.sleep(3)
        
        # Close browser
        driver.quit()
        print("✅ Success! Selenium is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_selenium()