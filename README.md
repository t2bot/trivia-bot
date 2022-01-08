# Matrix Trivia Bot

*Created with the [bot-sdk template](https://github.com/turt2live/matrix-bot-sdk-bot-template).*

A trivia bot for Matrix, using questions from [Open Trivia Database](https://opentdb.com/).

## Using the bot

TODO: Host on t2bot.io

<!--
The bot is hosted at [@trivia:t2bot.io](https://matrix.to/#/@trivia:t2bot.io) with more information
on the [t2bot.io website](https://t2bot.io/triviabot).
-->

## Running / Building

You will need at least **NodeJS 14 or higher**.

To install dependencies: `yarn install`.

To build it: `yarn build`.

To run it: `yarn start:dev`

To check the lint: `yarn lint`

To build the Docker image: `docker build -t matrix-trivia-bot:latest .`

To run the Docker image (after building): `docker run --rm -it -v $(pwd)/config:/bot/config matrix-trivia-bot:latest`
*Note that this will require a `config/production.yaml` file to exist as the Docker container runs in production mode.*

### Configuration

The default configuration is offered  as `config/default.yaml`. Copy/paste this to `config/development.yaml` 
and `config/production.yaml` and edit them accordingly for your environment.
