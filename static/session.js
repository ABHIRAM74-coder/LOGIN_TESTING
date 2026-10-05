const SESSION_TIMEOUT = 45000; // 45 seconds

let sessionTimer = null;
let lastServerUpdate = 0;
let sessionExpired = false;


// =========================================================
// RESET THE 45 SECOND TIMER
// =========================================================

function resetSessionTimer() {

    if (sessionExpired) {
        return;
    }

    clearTimeout(sessionTimer);

    sessionTimer = setTimeout(
        expireSession,
        SESSION_TIMEOUT
    );

    sendActivityToServer();
}


// =========================================================
// SEND USER ACTIVITY TO FLASK
// =========================================================

async function sendActivityToServer() {

    const now = Date.now();

    // Avoid sending too many requests.
    // Send activity to Flask at most once every 5 seconds.
    if (now - lastServerUpdate < 5000) {
        return;
    }

    lastServerUpdate = now;

    try {

        const response = await fetch(
            "/activity",
            {
                method: "POST"
            }
        );


        if (
            response.status === 401 ||
            response.redirected
        ) {

            sessionExpired = true;

            window.location.href =
                "/login?timeout=1";
        }

    } catch (error) {

        console.error(
            "Activity update failed:",
            error
        );
    }
}


// =========================================================
// SESSION TIMEOUT
// =========================================================

async function expireSession() {

    if (sessionExpired) {
        return;
    }

    sessionExpired = true;

    clearTimeout(sessionTimer);

    try {

        await fetch(
            "/session-expired",
            {
                method: "POST"
            }
        );

    } catch (error) {

        console.error(
            "Session expiry request failed:",
            error
        );
    }


    window.location.href =
        "/login?timeout=1";
}


// =========================================================
// USER ACTIVITY EVENTS
// =========================================================

const activityEvents = [
    "mousemove",
    "mousedown",
    "keydown",
    "click",
    "scroll",
    "touchstart"
];


// =========================================================
// LISTEN FOR USER ACTIVITY
// =========================================================

activityEvents.forEach(
    function (eventName) {

        document.addEventListener(
            eventName,
            resetSessionTimer,
            true
        );
    }
);


// =========================================================
// START TIMER WHEN PAGE LOADS
// =========================================================

resetSessionTimer();