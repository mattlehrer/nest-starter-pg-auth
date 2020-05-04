# Nest Starter with Postgres, Passport Local and Social Auth

## How to use

Run postgres locally with docker:

`docker run --name postgres -e POSTGRES_PASSWORD=postgres -d postgres`

(change the name of the container and the password if you want)

download [pgadmin](https://www.pgadmin.org/download/) to help with postgres
admin and viewing data

clone this repo

`git clone --depth 1 https://github.com/mattlehrer/nest-starter-pg-auth.git nest-starter`

`cd nest-starter`

`npm i`

`npm run start:dev`

## What's working

- [x] Husky and Lint-staged
- [x] ESLint (instead of NestJS CLI generator's TSLint even though the
      [official NestJS TS starter](https://github.com/nestjs/typescript-starter)
      has switched to ESLint )
- [x] Postgres with TypeORM
- [x] Passport Local, login with either username or password
- [x] Testing with Jest
- [ ] Passport Facebook
- [ ] Passport Google
- [ ] Passport Twitter
- [ ] Passport Github
