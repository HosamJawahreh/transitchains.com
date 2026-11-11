#!/usr/bin/env python3
"""TransitChains site and dashboard server."""

import hashlib
import json
import os
import re
import secrets
import smtplib
import ssl
import threading
import time
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
from urllib.parse import unquote, urlparse

try:
    from http.server import ThreadingHTTPServer
except ImportError:
    class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
        """Fallback for Python versions before 3.7."""
        daemon_threads = True


ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data")
SITE_PATH = os.path.join(DATA, "site.json")
QUOTES_PATH = os.path.join(DATA, "quotes.json")
ADMIN_PATH = os.path.join(DATA, "admin.json")
MAIL_PATH = os.path.join(DATA, "mail.json")
LOCK = threading.Lock()
SESSIONS = {}
SESSION_TTL = 60 * 60 * 12
MAX_BODY = 80_000
SERVICES = ("sea", "air", "land")
SERVICE_LABELS = {
    "sea": "Sea Freight",
    "air": "Air Freight",
    "land": "Land Transport",
}
QUOTE_TO = (
    "info@transitchains.com",
    "shadi.shaqour@transitchains.com",
)
SECTION_KEYS = (
    "header",
    "hero",
    "heroCards",
    "stats",
    "about",
    "services",
    "process",
    "contact",
    "footer",
    "whatsapp",
    "quote",
)
ROW_KEYS = (
    "header.logo", "nav.home", "nav.about", "nav.services", "nav.contact", "header.quote", "header.lang",
    "hero.photo", "hero.kicker", "hero.title", "hero.lede", "hero.quote", "hero.services", "hero.f1", "hero.f2", "hero.f3",
    "heroCards.sea", "heroCards.air", "heroCards.land",
    "stat.1", "stat.2", "stat.3", "stat.4",
    "about.photo", "about.kicker", "about.title", "about.body", "about.p1", "about.p2", "about.p3", "about.p4", "about.more",
    "services.head", "services.sea", "services.air", "services.land", "services.seaMore", "services.airMore", "services.landMore",
    "process.head", "step.1", "step.2", "step.3", "step.4",
    "contact.kicker", "contact.title", "contact.lede", "contact.manager", "contact.phone", "contact.mobile",
    "contact.email", "contact.address", "contact.map", "contact.quick", "contact.emailBtn", "contact.call",
    "footer.logo", "footer.home", "footer.about", "footer.services", "footer.contact", "footer.copy",
    "quote.kicker", "quote.title", "quote.text", "quote.name", "quote.company", "quote.email", "quote.phone",
    "quote.service", "quote.sea", "quote.air", "quote.land", "quote.message", "quote.submit",
    "quote.success", "quote.successText", "quote.close",
)

MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
}


def read_json(path, fallback):
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError):
        return fallback


def write_json(path, payload):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    temp = path + ".tmp"
    with open(temp, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    os.replace(temp, path)


def hash_password(password, salt):
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000)
    return digest.hex()


def ensure_admin():
    if os.path.exists(ADMIN_PATH):
        return
    salt = secrets.token_hex(16)
    write_json(ADMIN_PATH, {
        "salt": salt,
        "hash": hash_password("TransitAdmin#2027", salt),
        "mustChange": True,
    })


def default_mail():
    return {
        "enabled": True,
        "host": os.environ.get("TC_SMTP_HOST", "mail.transitchains.com"),
        "port": int(os.environ.get("TC_SMTP_PORT", "587") or 587),
        "username": os.environ.get("TC_SMTP_USER", "info@transitchains.com"),
        "password": os.environ.get("TC_SMTP_PASS", ""),
        "useTls": True,
        "useSsl": False,
        "fromEmail": "info@transitchains.com",
        "fromName": "TransitChains Website",
        "to": list(QUOTE_TO),
    }


def ensure_mail():
    if os.path.exists(MAIL_PATH):
        return
    write_json(MAIL_PATH, default_mail())


def load_mail():
    ensure_mail()
    mail = read_json(MAIL_PATH, default_mail())
    if not isinstance(mail, dict):
        mail = default_mail()
    base = default_mail()
    base.update(mail)
    base["to"] = list(QUOTE_TO)
    if os.environ.get("TC_SMTP_HOST"):
        base["host"] = os.environ["TC_SMTP_HOST"]
    if os.environ.get("TC_SMTP_PORT"):
        try:
            base["port"] = int(os.environ["TC_SMTP_PORT"])
        except ValueError:
            pass
    if os.environ.get("TC_SMTP_USER"):
        base["username"] = os.environ["TC_SMTP_USER"]
    if os.environ.get("TC_SMTP_PASS"):
        base["password"] = os.environ["TC_SMTP_PASS"]
    if os.environ.get("TC_SMTP_FROM"):
        base["fromEmail"] = os.environ["TC_SMTP_FROM"]
    return base


def public_mail():
    mail = load_mail()
    return {
        "enabled": bool(mail.get("enabled")),
        "host": mail.get("host", ""),
        "port": int(mail.get("port") or 587),
        "username": mail.get("username", ""),
        "hasPassword": bool(mail.get("password")),
        "useTls": bool(mail.get("useTls", True)),
        "useSsl": bool(mail.get("useSsl", False)),
        "fromEmail": mail.get("fromEmail", "info@transitchains.com"),
        "fromName": mail.get("fromName", "TransitChains Website"),
        "to": list(QUOTE_TO),
        "ready": bool(mail.get("enabled") and mail.get("host") and mail.get("fromEmail")),
    }


def validate_mail(payload, current):
    if not isinstance(payload, dict):
        return None
    mail = {
        "enabled": bool(payload.get("enabled", current.get("enabled", True))),
        "host": clean_text(payload.get("host", current.get("host", "")), 120),
        "port": 587,
        "username": clean_text(payload.get("username", current.get("username", "")), 120),
        "password": current.get("password", ""),
        "useTls": bool(payload.get("useTls", current.get("useTls", True))),
        "useSsl": bool(payload.get("useSsl", current.get("useSsl", False))),
        "fromEmail": clean_text(payload.get("fromEmail", current.get("fromEmail", "")), 120),
        "fromName": clean_text(payload.get("fromName", current.get("fromName", "")), 80),
        "to": list(QUOTE_TO),
    }
    try:
        mail["port"] = int(payload.get("port", current.get("port", 587)))
    except (TypeError, ValueError):
        mail["port"] = 587
    if mail["port"] < 1 or mail["port"] > 65535:
        mail["port"] = 587
    password = payload.get("password")
    if isinstance(password, str) and password.strip():
        mail["password"] = password.strip()[:200]
    if mail["fromEmail"] and "@" not in mail["fromEmail"]:
        return None
    return mail


def build_quote_email(quote):
    service = SERVICE_LABELS.get(quote.get("service"), quote.get("service", ""))
    created = quote.get("createdAt", "")
    plain = "\n".join([
        "New quote request from the TransitChains website",
        "",
        "Name: %s" % quote.get("name", ""),
        "Company: %s" % (quote.get("company") or "—"),
        "Email: %s" % quote.get("email", ""),
        "Phone: %s" % quote.get("phone", ""),
        "Service: %s" % service,
        "Received: %s" % created,
        "",
        "Shipment details:",
        quote.get("message", ""),
        "",
        "Reply directly to this email to contact the requester.",
        "Quote ID: %s" % quote.get("id", ""),
    ])
    html = """<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f3f7f8;font-family:Arial,Helvetica,sans-serif;color:#042028;">
  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f3f7f8;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #d7e3e8;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#00131e;padding:22px 28px;">
          <div style="font-size:20px;font-weight:700;color:#ffffff;">Transit<span style="color:#13ced7;">Chains</span></div>
          <div style="margin-top:6px;color:#8eabb6;font-size:13px;">New website quote request</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 18px;font-size:22px;letter-spacing:-0.03em;">%s</h1>
          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="font-size:14px;line-height:1.55;">
            <tr><td style="padding:8px 0;color:#6b828c;width:120px;">Company</td><td style="padding:8px 0;">%s</td></tr>
            <tr><td style="padding:8px 0;color:#6b828c;">Email</td><td style="padding:8px 0;"><a href="mailto:%s" style="color:#0a7f8a;">%s</a></td></tr>
            <tr><td style="padding:8px 0;color:#6b828c;">Phone</td><td style="padding:8px 0;"><a href="tel:%s" style="color:#0a7f8a;">%s</a></td></tr>
            <tr><td style="padding:8px 0;color:#6b828c;">Service</td><td style="padding:8px 0;">%s</td></tr>
            <tr><td style="padding:8px 0;color:#6b828c;">Received</td><td style="padding:8px 0;">%s</td></tr>
          </table>
          <div style="margin-top:22px;padding:16px 18px;background:#f3f7f8;border-radius:12px;">
            <div style="font-size:12px;font-weight:700;color:#6b828c;text-transform:uppercase;letter-spacing:0.04em;">Shipment details</div>
            <div style="margin-top:8px;white-space:pre-wrap;line-height:1.6;">%s</div>
          </div>
          <p style="margin:22px 0 0;color:#6b828c;font-size:13px;">Reply to this email to reach the requester directly. Quote ID: %s</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>""" % (
        _html(quote.get("name", "")),
        _html(quote.get("company") or "—"),
        _html(quote.get("email", "")),
        _html(quote.get("email", "")),
        _html(quote.get("phone", "")),
        _html(quote.get("phone", "")),
        _html(service),
        _html(created),
        _html(quote.get("message", "")),
        _html(quote.get("id", "")),
    )
    return plain, html


def _html(value):
    return (
        str(value or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def send_quote_mail(quote):
    mail = load_mail()
    if not mail.get("enabled"):
        return False, "Email delivery is turned off"
    host = (mail.get("host") or "").strip()
    from_email = (mail.get("fromEmail") or "").strip()
    if not host:
        return False, "Add the SMTP host under Account so quotes can reach the office inbox"
    if not from_email:
        return False, "Add a from email address under Account"
    recipients = list(QUOTE_TO)
    plain, html = build_quote_email(quote)
    message = EmailMessage()
    from_name = (mail.get("fromName") or "TransitChains Website").strip()
    message["Subject"] = "New quote · %s · %s" % (
        SERVICE_LABELS.get(quote.get("service"), "Logistics"),
        quote.get("name", "Website"),
    )
    message["From"] = "%s <%s>" % (from_name, from_email)
    message["To"] = ", ".join(recipients)
    message["Reply-To"] = quote.get("email", from_email)
    message.set_content(plain)
    message.add_alternative(html, subtype="html")

    port = int(mail.get("port") or 587)
    username = (mail.get("username") or "").strip()
    password = mail.get("password") or ""
    try:
        if mail.get("useSsl"):
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, timeout=20, context=context) as smtp:
                if username:
                    smtp.login(username, password)
                smtp.send_message(message, to_addrs=recipients)
        else:
            with smtplib.SMTP(host, port, timeout=20) as smtp:
                smtp.ehlo()
                if mail.get("useTls", True):
                    context = ssl.create_default_context()
                    smtp.starttls(context=context)
                    smtp.ehlo()
                if username:
                    smtp.login(username, password)
                smtp.send_message(message, to_addrs=recipients)
        return True, ""
    except Exception as error:
        return False, str(error)[:240]


def load_site():
    site = read_json(SITE_PATH, None)
    if not isinstance(site, dict):
        raise FileNotFoundError(SITE_PATH)
    return site


def public_site():
    site = load_site()
    return {
        "sections": site.get("sections", {}),
        "rows": site.get("rows", {}),
        "stats": site.get("stats", []),
        "contact": site.get("contact", {}),
        "copy": site.get("copy", {}),
    }


def clean_text(value, limit):
    if not isinstance(value, str):
        return ""
    text = value.replace("\r\n", "\n").replace("\r", "\n").strip()
    return text[:limit]


def validate_site(payload):
    if not isinstance(payload, dict):
        return None
    current = load_site()
    sections = payload.get("sections", {})
    if not isinstance(sections, dict):
        return None
    clean_sections = {}
    for key in SECTION_KEYS:
        clean_sections[key] = bool(sections.get(key, current.get("sections", {}).get(key, True)))

    rows = payload.get("rows", current.get("rows", {}))
    if not isinstance(rows, dict):
        rows = current.get("rows", {}) if isinstance(current.get("rows", {}), dict) else {}
    current_rows = current.get("rows", {}) if isinstance(current.get("rows", {}), dict) else {}
    clean_rows = {}
    for key in ROW_KEYS:
        clean_rows[key] = bool(rows.get(key, current_rows.get(key, True)))

    stats_in = payload.get("stats", current.get("stats", []))
    if not isinstance(stats_in, list):
        return None
    current_stats = current.get("stats", ["0", "0", "0", "0"])
    if not isinstance(current_stats, list):
        current_stats = ["0", "0", "0", "0"]
    stats = []
    for index in range(4):
        value = stats_in[index] if index < len(stats_in) else current_stats[index] if index < len(current_stats) else "0"
        stats.append(clean_text(value, 12) or "0")

    contact_in = payload.get("contact", {})
    if not isinstance(contact_in, dict):
        return None
    current_contact = current.get("contact", {}) if isinstance(current.get("contact", {}), dict) else {}
    contact = {}
    for key, limit in (
        ("manager", 80),
        ("phone", 40),
        ("phoneTel", 32),
        ("mobile", 40),
        ("mobileTel", 32),
        ("email", 120),
        ("whatsapp", 32),
        ("mapQuery", 300),
    ):
        raw = contact_in.get(key, current_contact.get(key, ""))
        contact[key] = clean_text(raw, limit)
    if not contact["email"] or "@" not in contact["email"]:
        return None

    copy_in = payload.get("copy", current.get("copy", {}))
    if not isinstance(copy_in, dict):
        return None
    current_copy = current.get("copy", {}) if isinstance(current.get("copy", {}), dict) else {}
    copy = {}
    for lang in ("en", "ar"):
        block = copy_in.get(lang, current_copy.get(lang, {}))
        if not isinstance(block, dict):
            return None
        copy[lang] = {}
        for key, value in block.items():
            if not isinstance(key, str) or not re.fullmatch(r"[A-Za-z0-9.]{1,40}", key):
                continue
            copy[lang][key] = clean_text(value, 700)
        if not copy[lang] and isinstance(current_copy.get(lang), dict):
            for key, value in current_copy[lang].items():
                if not isinstance(key, str) or not re.fullmatch(r"[A-Za-z0-9.]{1,40}", key):
                    continue
                copy[lang][key] = clean_text(value, 700)
    if not copy["en"] or not copy["ar"]:
        return None
    return {"sections": clean_sections, "rows": clean_rows, "stats": stats, "contact": contact, "copy": copy}


def valid_email(value):
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value))


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def send_json(self, code, payload, extra_headers=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.security_headers()
        if extra_headers:
            for key, value in extra_headers:
                self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length < 0 or length > MAX_BODY:
            return None
        raw = self.rfile.read(length) if length else b""
        if not raw:
            return {}
        try:
            return json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return None

    def cookie_token(self):
        header = self.headers.get("Cookie", "")
        for part in header.split(";"):
            name, _, value = part.strip().partition("=")
            if name == "tc_session":
                return value
        return ""

    def session_user(self):
        token = self.cookie_token()
        with LOCK:
            record = SESSIONS.get(token)
            if not record:
                return None
            if record["expires"] < time.time():
                SESSIONS.pop(token, None)
                return None
            return record

    def require_admin(self):
        if self.session_user():
            return True
        self.send_json(401, {"error": "unauthorized"})
        return False

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path == "/api/site":
            try:
                self.send_json(200, public_site())
            except FileNotFoundError:
                self.send_json(500, {"error": "site data missing"})
            return
        if path == "/api/admin/session":
            user = self.session_user()
            if not user:
                self.send_json(401, {"error": "unauthorized"})
                return
            admin = read_json(ADMIN_PATH, {})
            self.send_json(200, {"ok": True, "mustChange": bool(admin.get("mustChange"))})
            return
        if path == "/api/admin/quotes":
            if not self.require_admin():
                return
            quotes = read_json(QUOTES_PATH, [])
            quotes = sorted(quotes, key=lambda item: item.get("createdAt", ""), reverse=True)
            self.send_json(200, {"quotes": quotes})
            return
        if path == "/api/admin/site":
            if not self.require_admin():
                return
            self.send_json(200, public_site())
            return
        if path == "/api/admin/mail":
            if not self.require_admin():
                return
            self.send_json(200, public_mail())
            return
        self.serve_file(path)

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        payload = self.read_body()
        if payload is None:
            self.send_json(400, {"error": "invalid"})
            return
        if path == "/api/login":
            self.login(payload)
            return
        if path == "/api/logout":
            token = self.cookie_token()
            with LOCK:
                SESSIONS.pop(token, None)
            self.send_json(200, {"ok": True}, [("Set-Cookie", "tc_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")])
            return
        if path == "/api/quotes":
            self.create_quote(payload)
            return
        if path == "/api/admin/password":
            if not self.require_admin():
                return
            self.change_password(payload)
            return
        if path == "/api/admin/mail/test":
            if not self.require_admin():
                return
            sample = {
                "id": "test",
                "name": "Mail test",
                "company": "TransitChains",
                "email": load_mail().get("fromEmail") or "info@transitchains.com",
                "phone": "+962 6 5668960",
                "service": "sea",
                "message": "This is a test message from the TransitChains dashboard to confirm quote email delivery.",
                "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            ok, error = send_quote_mail(sample)
            if ok:
                self.send_json(200, {"ok": True})
            else:
                self.send_json(400, {"error": error or "send failed"})
            return
        match = re.fullmatch(r"/api/admin/quotes/([a-f0-9]+)/resend", path)
        if match:
            if not self.require_admin():
                return
            quote_id = match.group(1)
            with LOCK:
                quotes = read_json(QUOTES_PATH, [])
                quote = next((item for item in quotes if item.get("id") == quote_id), None)
            if not quote:
                self.send_json(404, {"error": "not found"})
                return
            ok, error = send_quote_mail(quote)
            with LOCK:
                quotes = read_json(QUOTES_PATH, [])
                for item in quotes:
                    if item.get("id") == quote_id:
                        item["emailed"] = ok
                        item["emailError"] = "" if ok else (error or "send failed")
                        item["emailedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                        break
                write_json(QUOTES_PATH, quotes)
            if ok:
                self.send_json(200, {"ok": True})
            else:
                self.send_json(400, {"error": error or "send failed"})
            return
        self.send_json(404, {"error": "not found"})

    def do_PUT(self):
        path = unquote(urlparse(self.path).path)
        payload = self.read_body()
        if payload is None:
            self.send_json(400, {"error": "invalid"})
            return
        if path == "/api/admin/site":
            if not self.require_admin():
                return
            clean = validate_site(payload)
            if not clean:
                self.send_json(400, {"error": "invalid site"})
                return
            with LOCK:
                write_json(SITE_PATH, clean)
            self.send_json(200, {"ok": True})
            return
        if path == "/api/admin/mail":
            if not self.require_admin():
                return
            clean = validate_mail(payload, load_mail())
            if not clean:
                self.send_json(400, {"error": "invalid mail"})
                return
            with LOCK:
                write_json(MAIL_PATH, clean)
            self.send_json(200, {"ok": True, "mail": public_mail()})
            return
        self.send_json(404, {"error": "not found"})

    def do_PATCH(self):
        path = unquote(urlparse(self.path).path)
        payload = self.read_body()
        if payload is None:
            self.send_json(400, {"error": "invalid"})
            return
        match = re.fullmatch(r"/api/admin/quotes/([a-f0-9]+)", path)
        if not match:
            self.send_json(404, {"error": "not found"})
            return
        if not self.require_admin():
            return
        status = payload.get("status")
        if status not in ("new", "reviewed", "closed"):
            self.send_json(400, {"error": "invalid status"})
            return
        quote_id = match.group(1)
        with LOCK:
            quotes = read_json(QUOTES_PATH, [])
            found = False
            for quote in quotes:
                if quote.get("id") == quote_id:
                    quote["status"] = status
                    found = True
                    break
            if not found:
                self.send_json(404, {"error": "not found"})
                return
            write_json(QUOTES_PATH, quotes)
        self.send_json(200, {"ok": True})

    def do_DELETE(self):
        path = unquote(urlparse(self.path).path)
        match = re.fullmatch(r"/api/admin/quotes/([a-f0-9]+)", path)
        if not match:
            self.send_json(404, {"error": "not found"})
            return
        if not self.require_admin():
            return
        quote_id = match.group(1)
        with LOCK:
            quotes = read_json(QUOTES_PATH, [])
            remaining = [quote for quote in quotes if quote.get("id") != quote_id]
            if len(remaining) == len(quotes):
                self.send_json(404, {"error": "not found"})
                return
            write_json(QUOTES_PATH, remaining)
        self.send_json(200, {"ok": True})

    def login(self, payload):
        password = payload.get("password") if isinstance(payload, dict) else ""
        admin = read_json(ADMIN_PATH, {})
        salt = admin.get("salt", "")
        if not isinstance(password, str) or not salt:
            self.send_json(401, {"error": "unauthorized"})
            return
        digest = hash_password(password, salt)
        if not secrets.compare_digest(digest, admin.get("hash", "")):
            self.send_json(401, {"error": "unauthorized"})
            return
        token = secrets.token_urlsafe(32)
        with LOCK:
            SESSIONS[token] = {"expires": time.time() + SESSION_TTL}
        cookie = "tc_session=%s; Path=/; HttpOnly; SameSite=Lax; Max-Age=%d" % (token, SESSION_TTL)
        self.send_json(200, {"ok": True, "mustChange": bool(admin.get("mustChange"))}, [("Set-Cookie", cookie)])

    def change_password(self, payload):
        current = payload.get("current") if isinstance(payload, dict) else ""
        new_password = payload.get("password") if isinstance(payload, dict) else ""
        admin = read_json(ADMIN_PATH, {})
        if not isinstance(current, str) or not isinstance(new_password, str):
            self.send_json(400, {"error": "invalid"})
            return
        if len(new_password) < 8:
            self.send_json(400, {"error": "short"})
            return
        digest = hash_password(current, admin.get("salt", ""))
        if not secrets.compare_digest(digest, admin.get("hash", "")):
            self.send_json(401, {"error": "unauthorized"})
            return
        salt = secrets.token_hex(16)
        with LOCK:
            write_json(ADMIN_PATH, {
                "salt": salt,
                "hash": hash_password(new_password, salt),
                "mustChange": False,
            })
        self.send_json(200, {"ok": True})

    def create_quote(self, payload):
        if not isinstance(payload, dict) or payload.get("website"):
            self.send_json(200, {"ok": True})
            return
        name = clean_text(payload.get("name", ""), 80)
        company = clean_text(payload.get("company", ""), 80)
        email = clean_text(payload.get("email", ""), 120)
        phone = clean_text(payload.get("phone", ""), 40)
        service = payload.get("service")
        message = clean_text(payload.get("message", ""), 2000)
        if len(name) < 2 or not valid_email(email) or len(phone) < 6 or service not in SERVICES or len(message) < 5:
            self.send_json(400, {"error": "invalid"})
            return
        quote = {
            "id": secrets.token_hex(8),
            "name": name,
            "company": company,
            "email": email,
            "phone": phone,
            "service": service,
            "message": message,
            "status": "new",
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "emailed": False,
            "emailError": "",
            "emailedAt": "",
        }
        ok, error = send_quote_mail(quote)
        quote["emailed"] = ok
        quote["emailError"] = "" if ok else (error or "send failed")
        quote["emailedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()) if ok or error else ""
        with LOCK:
            quotes = read_json(QUOTES_PATH, [])
            quotes.append(quote)
            write_json(QUOTES_PATH, quotes)
        self.send_json(201, {"ok": True, "emailed": ok})

    def security_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

    def serve_file(self, path):
        if path.startswith("/data") or path.startswith("/api"):
            self.send_error(404)
            return
        if path == "/":
            path = "/index.html"
        elif path == "/admin":
            path = "/admin/index.html"
        relative = path.lstrip("/")
        target = os.path.realpath(os.path.join(ROOT, relative))
        if not target.startswith(ROOT + os.sep) and target != ROOT:
            self.send_error(403)
            return
        if not os.path.isfile(target):
            fallback = os.path.join(ROOT, "404.html")
            if os.path.isfile(fallback) and not path.endswith((".css", ".js", ".png", ".webp", ".woff2", ".svg", ".ico", ".json")):
                target = fallback
                self.send_response(404)
            else:
                self.send_error(404)
                return
        else:
            self.send_response(200)
        ext = os.path.splitext(target)[1].lower()
        mime = MIME.get(ext, "application/octet-stream")
        size = os.path.getsize(target)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(size))
        self.security_headers()
        if ext in (".html", ".js", ".css"):
            self.send_header("Cache-Control", "no-store")
        elif ext in (".png", ".webp", ".woff2", ".svg", ".ico"):
            self.send_header("Cache-Control", "public, max-age=604800")
        self.end_headers()
        with open(target, "rb") as handle:
            while True:
                chunk = handle.read(65536)
                if not chunk:
                    break
                self.wfile.write(chunk)


def main():
    os.makedirs(DATA, exist_ok=True)
    ensure_admin()
    ensure_mail()
    if not os.path.exists(QUOTES_PATH):
        write_json(QUOTES_PATH, [])
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8765"))
    server = ThreadingHTTPServer((host, port), Handler)
    print("TransitChains running at http://%s:%d/" % (host if host != "0.0.0.0" else "127.0.0.1", port))
    print("Dashboard: http://%s:%d/admin" % (host if host != "0.0.0.0" else "127.0.0.1", port))
    server.serve_forever()


if __name__ == "__main__":
    main()
