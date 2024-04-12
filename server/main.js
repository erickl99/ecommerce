const http = require("node:http");
const fs = require("node:fs");
const adminHandler = require("./admin");
const config = require("./config");
const { serveStaticFile, sendErrorResponse } = require("./response");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * */
function baseHandler(req, res) {
    let path = req.url || "";
    console.log("Client sent the following request:", path, req.method);
    console.log("Cookies are", req.headers.cookie);
    if (path === "/") {
        serveStaticFile(res, "static/index.html");
    } else if (path.startsWith("/admin/")) {
        path = path.slice(6);
        adminHandler(req, res, path);
    } else if (path.startsWith("/js/")) {
        path = path.slice(4);
        serveStaticFile(res, `client/${path}`, "text/javascript");
    } else if (path.startsWith("/static/")) {
        path = path.slice(8);
        if (path === "build.css") {
            serveStaticFile(res, "static/build.css", "text/css");
        } else {
            console.log("Got a weird path...", path);
            sendErrorResponse(res);
        }
    } else {
        sendErrorResponse(res);
    }
}

function readEnv() {
    const lines = fs.readFileSync(".env", "utf8").split("\n");
    for (const line of lines) {
        const pair = line.split("=");
        if (pair[0] === "JWT_SECRET") {
            process.env.JWT_SECRET = pair[1].slice(1, pair[1].length - 1);
        }
    }
}

function main() {
    const server = http.createServer(baseHandler);
    readEnv();
    server.listen(config.PORT, config.HOST, () => {
        console.log(`Server is listening at http://${config.HOST}:${config.PORT}.`);
    });
}

main();
