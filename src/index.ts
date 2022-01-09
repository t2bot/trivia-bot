import {
    AutojoinRoomsMixin,
    LogLevel,
    LogService,
    MatrixClient,
    RichConsoleLogger,
    RustSdkCryptoStorageProvider,
    SimpleFsStorageProvider,
    SimpleRetryJoinStrategy,
} from "matrix-bot-sdk";
import * as path from "path";
import config from "./config";
import CommandHandler from "./commands/handler";
import { TriviaManager } from "./TriviaManager";

LogService.setLogger(new RichConsoleLogger());
LogService.setLevel(LogLevel.DEBUG);
LogService.muteModule("Metrics");
LogService.info("index", "Bot starting...");

(async function () {
    const storage = new SimpleFsStorageProvider(path.join(config.dataPath, "bot.json"));
    const cryptoStore = new RustSdkCryptoStorageProvider(path.join(config.dataPath, "encrypted"));

    const client = new MatrixClient(config.homeserverUrl, config.accessToken, storage, cryptoStore);
    AutojoinRoomsMixin.setupOnClient(client);
    client.setJoinStrategy(new SimpleRetryJoinStrategy());

    const trivia = new TriviaManager(client);
    const commands = new CommandHandler(client, trivia);
    await commands.start();

    LogService.info("index", "Starting sync...");
    await client.start();
})();
