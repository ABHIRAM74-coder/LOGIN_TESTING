from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    jsonify,
    flash
)

from functools import wraps
from datetime import datetime, timezone
from supabase import create_client

import secrets


# ============================================================
# SUPABASE CONFIGURATION
# ============================================================

SUPABASE_URL = "https://wxuwpdsccjnsnkvesmko.supabase.co"

SUPABASE_KEY = "sb_publishable_zytlAe2TRvr9k16JMdzICg_JXHuIIX-"


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)

# Automatically creates a Flask secret key
app.secret_key = secrets.token_hex(32)


# ============================================================
# SESSION TIMEOUT
# ============================================================

SESSION_TIMEOUT = 45


# ============================================================
# SUPABASE CLIENT
# ============================================================

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


# ============================================================
# LOGIN REQUIRED DECORATOR
# ============================================================

def login_required(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        if "user_id" not in session:

            return redirect(
                url_for("login")
            )

        return function(
            *args,
            **kwargs
        )

    return wrapper


# ============================================================
# CHECK SESSION TIMEOUT
# ============================================================

@app.before_request
def check_session_timeout():

    ignored_endpoints = {
        "static",
        "login",
        "create_session",
        "session_expired"
    }

    if request.endpoint in ignored_endpoints:
        return


    if "user_id" not in session:
        return


    last_activity = session.get(
        "last_activity"
    )


    if not last_activity:

        session.clear()

        return redirect(
            url_for("login")
        )


    try:

        last_activity_time = datetime.fromisoformat(
            last_activity
        )

        current_time = datetime.now(
            timezone.utc
        )

        elapsed = (
            current_time
            - last_activity_time
        ).total_seconds()


        if elapsed > SESSION_TIMEOUT:

            session.clear()

            if request.path == "/activity":

                return jsonify({
                    "status": "expired"
                }), 401


            return redirect(
                url_for(
                    "login",
                    timeout="1"
                )
            )


    except Exception as error:

        print(
            "Session timeout error:",
            error
        )

        session.clear()

        return redirect(
            url_for("login")
        )


# ============================================================
# LOGIN PAGE
# ============================================================

@app.route("/")
@app.route("/login")
def login():

    if "user_id" in session:

        return redirect(
            url_for("home")
        )


    return render_template(
        "login.html",

        supabase_url=SUPABASE_URL,

        supabase_key=SUPABASE_KEY
    )


# ============================================================
# CREATE FLASK SESSION AFTER SUPABASE LOGIN
# ============================================================

@app.route(
    "/create-session",
    methods=["POST"]
)
def create_session():

    data = request.get_json(
        silent=True
    )


    if not data:

        return jsonify({
            "error": "No login data received"
        }), 400


    access_token = data.get(
        "access_token"
    )


    if not access_token:

        return jsonify({
            "error": "Access token missing"
        }), 400


    try:

        # Verify the Supabase access token

        response = supabase.auth.get_user(
            access_token
        )


        user = response.user


        if not user:

            return jsonify({
                "error": "Invalid user"
            }), 401


        # Clear any old Flask session

        session.clear()


        # Create new Flask session

        session["user_id"] = user.id

        session["email"] = user.email

        session["last_activity"] = (
            datetime.now(
                timezone.utc
            ).isoformat()
        )


        return jsonify({
            "status": "success"
        })


    except Exception as error:

        print(
            "Supabase authentication error:",
            error
        )

        return jsonify({
            "error": "Authentication failed"
        }), 401


# ============================================================
# HOME
# ============================================================

@app.route("/home")
@login_required
def home():

    return render_template(
        "home.html",
        email=session.get("email")
    )


# ============================================================
# ABOUT
# ============================================================

@app.route("/about")
@login_required
def about():

    return render_template(
        "about.html"
    )


# ============================================================
# CONTACT
# ============================================================

@app.route(
    "/contact",
    methods=["GET", "POST"]
)
@login_required
def contact():

    if request.method == "POST":

        name = request.form.get(
            "name",
            ""
        )

        email = request.form.get(
            "email",
            ""
        )

        message = request.form.get(
            "message",
            ""
        )


        print(
            "CONTACT FORM"
        )

        print(
            "Name:",
            name
        )

        print(
            "Email:",
            email
        )

        print(
            "Message:",
            message
        )


        flash(
            "Message submitted successfully.",
            "success"
        )


        return redirect(
            url_for("contact")
        )


    return render_template(
        "contact.html"
    )


# ============================================================
# FEEDBACK
# ============================================================

@app.route(
    "/feedback",
    methods=["GET", "POST"]
)
@login_required
def feedback():

    if request.method == "POST":

        rating = request.form.get(
            "rating",
            ""
        )

        comments = request.form.get(
            "comments",
            ""
        )


        print(
            "FEEDBACK"
        )

        print(
            "Rating:",
            rating
        )

        print(
            "Comments:",
            comments
        )


        flash(
            "Thank you for your feedback.",
            "success"
        )


        return redirect(
            url_for("feedback")
        )


    return render_template(
        "feedback.html"
    )


# ============================================================
# USER ACTIVITY
# ============================================================

@app.route(
    "/activity",
    methods=["POST"]
)
@login_required
def activity():

    session["last_activity"] = (
        datetime.now(
            timezone.utc
        ).isoformat()
    )

    session.modified = True


    return jsonify({
        "status": "active"
    })


# ============================================================
# SESSION EXPIRED
# ============================================================

@app.route(
    "/session-expired",
    methods=["POST"]
)
def session_expired():

    session.clear()


    return jsonify({
        "status": "expired"
    })


# ============================================================
# LOGOUT
# ============================================================

@app.route("/logout")
def logout():

    session.clear()


    return redirect(
        url_for("login")
    )


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )