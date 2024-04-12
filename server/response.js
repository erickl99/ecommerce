const http = require("node:http");
const fs = require("node:fs");

/**
 * @param {http.ServerResponse} res
 * */
function sendErrorResponse(res) {
    const stat = fs.statSync("static/error.html");
    res.writeHead(404, {
        "Content-Type": "text/html",
        "Content-Length": stat.size,
    });
    const stream = fs.createReadStream("static/error.html");
    stream.pipe(res);
}

/**
 * @param {http.ServerResponse} res
 * @param {string} filePath
 * @param {string} [contentType]
 * @param {http.OutgoingHttpHeaders} [headers]
 * */
function serveStaticFile(
    res,
    filePath,
    contentType = "text/html",
    headers = {},
) {
    console.log("file path is", filePath);
    try {
        const stat = fs.statSync(filePath);
        res.writeHead(200, {
            "Content-Type": contentType,
            "Content-Length": stat.size,
            ...headers,
        });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    } catch (error) {
        sendErrorResponse(res);
    }
}

module.exports = {
    serveStaticFile,
    sendErrorResponse
}
