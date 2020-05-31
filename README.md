# NestJS REST API Starter with Postgres, Passport Local and Social Auth

## How to use

Run postgres locally with docker:

`docker run --name postgres -e POSTGRES_PASSWORD=postgres -d postgres`

(change the name of the container and the password if you want)

Run [pgadmin](https://www.pgadmin.org/download/) to help with postgres admin and
viewing data. Download or run with docker.

fork or clone this repo

`git clone --depth 1 https://github.com/mattlehrer/nest-starter-pg-auth.git nest-starter`

`cd nest-starter`

`npm i`

`npm run start:dev`

## What's working / Roadmap

- [x] Postgres with TypeORM
- [x] Husky and Lint-staged
- [x] ESLint (instead of NestJS CLI generator's TSLint even though the
      [official NestJS TS starter](https://github.com/nestjs/typescript-starter)
      has switched to ESLint )
- [x] Expose only intentional fields with
      [class-validator](https://github.com/typestack/class-validator) and
      ClassSerializerInterceptor on each route
- [x] Testing with Jest
- [x] User roles
- [x] Logging with Pino setup with
      [nestjs-pino](https://github.com/iamolegga/nestjs-pino) in its own global
      module in case you want to use something else
- [x] Passport Local (modified to allow email in username field)
- [x] Passport JWT
- [x] Passport Google
- [x] Passport Facebook
- [x] Passport Twitter
- [x] Passport Github
- [x] Transactional Email with Sendgrid
- [x] Helmet
- [x] CORS
- [x] Events
- [ ] Analytics
