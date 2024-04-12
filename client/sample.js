const button = document.querySelector("button");
const form = document.querySelector("form");

if (button != null && form != null) {
    button.addEventListener("click", async (event) => {
        event.preventDefault();
        /** @type string*/
        const username = form.username.value;
        /** @type string*/
        const password = form.password.value;
        const params = new URLSearchParams(
            `username=${username}&password=${password}`,
        );
        const headers = new Headers({
            "Content-Type": "application/x-www-form-urlencoded",
        });
        let path = "http://localhost:8000/admin/login";
        const redirect = new URLSearchParams(window.location.search).get(
            "redirect",
        );
        if (redirect !== null) {
            path += `?redirect=${redirect}`;
        }
        const result = await fetch(path, {
            method: "POST",
            body: params,
            headers: headers,
        });
        if (result.status === 200) {
            const message = await result.json();
            if (message.success) {
                const destination = message.destination || "dashboard";
                window.location.assign(
                    `${window.location.origin}/admin/${destination}`,
                );
            } else {
                alert("Failed!");
            }
        }
    });
}
