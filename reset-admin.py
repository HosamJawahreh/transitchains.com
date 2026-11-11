#!/usr/bin/env python3
"""Reset the dashboard password on this server."""

import os
import secrets
import sys

import server

password = sys.argv[1] if len(sys.argv) > 1 else "TransitAdmin#2027"
salt = secrets.token_hex(16)
server.write_json(server.ADMIN_PATH, {
    "salt": salt,
    "hash": server.hash_password(password, salt),
    "mustChange": False,
})
print("Dashboard password reset.")
print("Password:", password)
print("File:", server.ADMIN_PATH)
