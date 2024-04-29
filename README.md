## Description

A bot that helps track the life of your favorite football team.

## Preparation

- [Install nvm](https://github.com/nvm-sh/nvm#installing-and-updating) and latest LTS Nodejs version: `nvm install --lts`
- [Install docker](https://docs.docker.com/engine/install/ubuntu/) and do [post-install steps](https://docs.docker.com/engine/install/linux-postinstall/)
- Get Telegram token
- Get [AutoRia API key](https://developers.ria.com/signup/)

Obtaining a token is as simple as contacting [@BotFather](https://t.me/botfather), issuing the ```/newbot``` command and following the steps until you're given a new token. You can find a step-by-step [guide here](https://core.telegram.org/bots/features#creating-a-new-bot).
Your token will look something like this:
```
4839574812:AAFD39kkdpWt3ywyRZergyOLMaJhac60qc
```


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
