## Description

A bot that helps track the life of your favorite football team.

## Preparation

- [Install nvm](https://github.com/nvm-sh/nvm#installing-and-updating) and latest LTS Nodejs version: `nvm install --lts`
- [Install docker](https://docs.docker.com/engine/install/ubuntu/) and do [post-install steps](https://docs.docker.com/engine/install/linux-postinstall/)
- Get Telegram token
- Get FootBall API key in [rapidapi](https://rapidapi.com/api-sports/api/api-football/pricing) or in football api [dashboard](https://dashboard.api-football.com/register)

Obtaining a token is as simple as contacting [@BotFather](https://t.me/botfather), issuing the ```/newbot``` command and following the steps until you're given a new token. You can find a step-by-step [guide here](https://core.telegram.org/bots/features#creating-a-new-bot).
Your token will look something like this:
```
4839574812:AAFD39kkdpWt3ywyRZergyOLMaJhac60qc
```

The accounts on RapidAPI and on Dashboard are dissociated. Each of these registration methods has its own URL and API-KEY.
- RAPIDAPI : https://api-football-v1.p.rapidapi.com/v3/
- API-SPORTS : https://v3.football.api-sports.io/

!!This repo use Dashboard way.

## Installation

Copy `.env.example` and rename to `.env` in root folder. Also fill all variables

## Running the app

```bash
bin/build
```

## License

Nest is [MIT licensed](LICENSE).

Powered by:
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>
