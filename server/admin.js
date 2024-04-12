const http = require("node:http");
const { parse } = require("node:querystring");
const config = require("./config");
const { serveStaticFile, sendErrorResponse } = require("./response");
const { URLSearchParams } = require("node:url");

const subpaths = ["/dashboard"];

/**
 * @param {string} token
 * @returns boolean
 * */
function validJwt(token) {
    return token === "yes";
}

/**
 * @param {string | undefined} rawCookie
 * @returns string
 * */
function extractJwt(rawCookie) {
    if (rawCookie === undefined) {
        console.log("the cookie does not exist");
        return "";
    }
    const accessToken = rawCookie.split("=")[1];
    console.log("the cookie is", accessToken, "END");
    return accessToken;
}

/**
 * @returns string
 * */
function generateJwt() {
    return "hello";
}

/**
 * @param {http.IncomingMessage} request
 * @param {http.ServerResponse} response
 * @param {URLSearchParams} params
 * */
function readBody(request, response, params) {
    return new Promise((resolve, reject) => {
        let body = "";
        request.on("data", (chunk) => {
            body += chunk.toString();
        });
        request.on("end", () => {
            try {
                const query = parse(body);
                const redirect = params.get("redirect");
                const username = query.username;
                const password = query.password;
                const validAttempt =
                    typeof username === "string" &&
                    typeof password === "string";
                const validRedirect =
                    redirect === null ||
                    (typeof redirect === "string" &&
                        subpaths.includes(redirect));
                console.log("redirect is ", redirect);
                if (validAttempt && validRedirect) {
                    resolve({ username, password, redirect, response });
                } else {
                    reject({ reason: "rejected", response });
                }
            } catch (error) {
                reject({ reason: "rejected", response });
            }
        });
    });
}
/**
 * @param {Object} result
 * @param {string} result.username
 * @param {string} result.password
 * @param {(string | undefined)} result.redirect
 * @param {http.ServerResponse} result.response
 * */
function acceptCallback({ username, password, redirect, response }) {
    if (username !== "admin" || password !== "password") {
        response.writeHead(200, {
            "Content-Type": "text/json",
        });
        response.end(JSON.stringify({ success: false }));
        return;
    }
    const responseBody = { success: true, destination: "dashboard" };
    if (typeof redirect === "string") {
        responseBody.destination = redirect;
    }
    response.writeHead(200, {
        "Content-Type": "text/json",
        "Set-Cookie": "auth=yes; SameSite=Strict; HttpOnly",
    });
    response.end(JSON.stringify(responseBody));
}

/**
 * @param {Object} result
 * @param {string} result.reason
 * @param {http.ServerResponse} result.response
 * */
function errorCallback({ reason, response }) {
    if (reason === "malformed") {
        response.writeHead(400, {
            "Content-Type": "text/plain",
            "Content-Length": 11,
        });
        response.end("Bad Request");
        return;
    }
    response.writeHead(401, {
        "Content-Type": "text/plain",
        "Content-Length": 12,
    });
    response.end("Unauthorized");
}

/**
 * @param {http.IncomingMessage} request
 * @param {http.ServerResponse} response
 * @param {string} fullPath
 * */
function adminHandler(request, response, fullPath) {
    const url = new URL(fullPath, `http://${config.HOST}:${config.PORT}`);
    const pathname = url.pathname;
    if (request.method === "POST") {
        console.log("Performing post request");
        if (pathname !== "/login") {
            response.writeHead(400, {
                "Content-Type": "text/plain",
                "Content-Length": 11,
            });
            response.end("Bad Request");
        }
        readBody(request, response, url.searchParams)
            .then(acceptCallback)
            .catch(errorCallback);
        return;
    }
    if (request.method === "GET") {
        console.log("Performing get request");
        if (pathname === "/login") {
            if (validJwt(extractJwt(request.headers.cookie))) {
                response.writeHead(302, { Location: "/admin/dashboard" });
                response.end();
            } else {
                serveStaticFile(response, "static/admin/login.html");
            }
            return;
        }
        const idx = subpaths.indexOf(pathname);
        if (idx < 0) {
            sendErrorResponse(response);
            return;
        }
        if (validJwt(extractJwt(request.headers.cookie))) {
            serveStaticFile(response, `static/admin${subpaths[idx]}.html`);
        } else {
            response.writeHead(302, { Location: "/admin/login" });
            response.end();
        }
        return;
    }
    response.writeHead(405, {
        "Content-Type": "text/plain",
        "Content-Length": 18,
    });
    response.end("Method Not Allowed");
}

module.exports = adminHandler;
