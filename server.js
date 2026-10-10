
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const redis = require("redis");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const redisClient = redis.createClient({
    url: "redis://localhost:6379"
});

const publisher = redisClient.duplicate();
const subscriber = redisClient.duplicate();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const CHANNEL = "notifications";

async function startServer() {
    try {
        await Promise.all([
            redisClient.connect(),
            publisher.connect(),
            subscriber.connect()
        ]);

        console.log("Connected to Redis");

        await subscriber.subscribe(CHANNEL, (message) => {
            io.emit("notification", message);
        });

        app.get("/notifications", async (req, res) => {
            try {
                const history = await redisClient.lRange(
                    "notification:history", 0, -1
                );
                res.json(history.reverse());
            } catch (err) {
                res.status(500).json({
                    error: "Failed to fetch history"
                });
            }
        });

        app.delete("/notifications", async (req, res) => {
            try {
                await redisClient.del("notification:history");
                res.json({
                    message: "Notification history cleared"
                });
            } catch (err) {
                res.status(500).json({
                    error: "Failed to clear history"
                });
            }
        });

        app.post("/follow", async (req, res) => {
            const { followerId, followedId } = req.body;

            if (!followerId || !followedId) {
                return res.status(400).json({
                    error: "followerId and followedId are required"
                });
            }

            try {
                const message =
                    `${followerId} has followed ${followedId}`;

                await redisClient.lPush(
                    "notification:history", message
                );

                await redisClient.sAdd(
                    `user:${followedId}:followers`, followerId
                );

                await publisher.publish(CHANNEL, message);

                res.status(200).json({ message });
            } catch (err) {
                console.error(err);
                res.status(500).json({
                    error: "Failed to create notification"
                });
            }
        });

        io.on("connection", (socket) => {
            console.log("A user connected:", socket.id);

            socket.on("disconnect", () => {
                console.log("A user disconnected:", socket.id);
            });
        });

        server.listen(3000, () => {
            console.log(
                "Server running at http://localhost:3000"
            );
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

startServer();
