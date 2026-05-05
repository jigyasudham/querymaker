# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec file for Query Maker

import os
import sys

block_cipher = None

# Find Python DLLs directory for missing libraries
python_dir = os.path.dirname(sys.executable)
python_dlls = os.path.join(python_dir, 'DLLs')

a = Analysis(
    ['Server.py'],
    pathex=[],
    binaries=[
        (os.path.join(python_dlls, 'libffi-8.dll'), '.'),
        (os.path.join(python_dlls, '_ctypes.pyd'), '.'),
        (os.path.join(python_dlls, '_ssl.pyd'), '.'),
        (os.path.join(python_dlls, 'libssl-3.dll'), '.'),
        (os.path.join(python_dlls, 'libcrypto-3.dll'), '.'),
    ],
    datas=[
        ('dist', 'dist'),           # Built React frontend
        ('data', 'data'),           # User data directory
        ('portal_automation.py', '.'),  # Automation module
    ],
    hiddenimports=[
        'flask',
        'flask_cors',
        'selenium',
        'selenium.webdriver',
        'selenium.webdriver.chrome',
        'selenium.webdriver.chrome.service',
        'selenium.webdriver.chrome.options',
        'selenium.webdriver.common.by',
        'selenium.webdriver.common.keys',
        'selenium.webdriver.support.ui',
        'selenium.webdriver.support.expected_conditions',
        'webdriver_manager',
        'webdriver_manager.chrome',
        'json',
        'csv',
        'hashlib',
        'hmac',
        'secrets',
        'threading',
        'logging',
        'collections',
        'pathlib',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='QueryMaker',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,  # Show console for server logs
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='QueryMaker',
)
