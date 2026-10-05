// ============================================================
// CREATE SUPABASE CLIENT
// ============================================================

const supabaseClient =
    supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_KEY
    );


// ============================================================
// HTML ELEMENTS
// ============================================================

const loginForm =
    document.getElementById(
        "loginForm"
    );


const signupForm =
    document.getElementById(
        "signupForm"
    );


const showSignup =
    document.getElementById(
        "showSignup"
    );


const showLogin =
    document.getElementById(
        "showLogin"
    );


const signupText =
    document.getElementById(
        "signupText"
    );


const loginText =
    document.getElementById(
        "loginText"
    );


const formTitle =
    document.getElementById(
        "formTitle"
    );


const message =
    document.getElementById(
        "message"
    );


const timeoutMessage =
    document.getElementById(
        "timeoutMessage"
    );


// ============================================================
// SHOW MESSAGE
// ============================================================

function showMessage(
    text,
    type = "error"
) {

    message.textContent =
        text;


    message.className =
        "message " + type;


    message.style.display =
        "block";
}


// ============================================================
// SESSION TIMEOUT MESSAGE
// ============================================================

const params =
    new URLSearchParams(
        window.location.search
    );


if (
    params.get("timeout") === "1"
) {

    timeoutMessage.style.display =
        "block";
}


// ============================================================
// SHOW SIGNUP FORM
// ============================================================

showSignup.addEventListener(
    "click",
    function () {

        loginForm.style.display =
            "none";


        signupForm.style.display =
            "flex";


        signupText.style.display =
            "none";


        loginText.style.display =
            "block";


        formTitle.textContent =
            "Sign Up";


        message.style.display =
            "none";


        timeoutMessage.style.display =
            "none";
    }
);


// ============================================================
// SHOW LOGIN FORM
// ============================================================

showLogin.addEventListener(
    "click",
    function () {

        signupForm.style.display =
            "none";


        loginForm.style.display =
            "flex";


        signupText.style.display =
            "block";


        loginText.style.display =
            "none";


        formTitle.textContent =
            "Login";


        message.style.display =
            "none";
    }
);


// ============================================================
// SIGN UP
// ============================================================

signupForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document
                .getElementById(
                    "signupEmail"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "signupPassword"
                )
                .value;


        const confirmPassword =
            document
                .getElementById(
                    "confirmPassword"
                )
                .value;


        // Passwords must match

        if (
            password !==
            confirmPassword
        ) {

            showMessage(
                "Passwords do not match"
            );

            return;
        }


        // Supabase minimum password requirement

        if (
            password.length < 6
        ) {

            showMessage(
                "Password must be at least 6 characters"
            );

            return;
        }


        try {

            const {
                data,
                error
            } =
            await supabaseClient
                .auth
                .signUp({

                    email: email,

                    password: password

                });


            if (error) {

                showMessage(
                    error.message
                );

                return;
            }


            signupForm.reset();


            showMessage(
                "Sign up successful. Check your email if confirmation is enabled.",
                "success"
            );


        } catch (error) {

            console.error(
                error
            );


            showMessage(
                "Something went wrong during sign up"
            );
        }

    }
);


// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document
                .getElementById(
                    "loginEmail"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "loginPassword"
                )
                .value;


        try {

            const {
                data,
                error
            } =
            await supabaseClient
                .auth
                .signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) {

                showMessage(
                    error.message
                );

                return;
            }


            if (
                !data.session ||
                !data.session.access_token
            ) {

                showMessage(
                    "Login failed. No session received."
                );

                return;
            }


            const accessToken =
                data.session.access_token;


            // Send token to Flask

            const response =
                await fetch(
                    "/create-session",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                access_token:
                                    accessToken

                            })
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                showMessage(
                    result.error ||
                    "Authentication failed"
                );

                return;
            }


            // LOGIN SUCCESSFUL

            window.location.href =
                "/home";


        } catch (error) {

            console.error(
                error
            );


            showMessage(
                "Something went wrong during login"
            );
        }

    }
);