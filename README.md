# Secure Vault Backend

## Prerequisite

1. [Typescript](https://www.typescriptlang.org/download)
2. [Nodejs](https://nodejs.org/en/download)
3. [Docker](https://docs.docker.com/desktop/install/windows-install/)

## Quick Start

Clone the repo:

```bash
git clone https://github.com/SomeRandomDolphin/securevault-backend.git
```

Install the dependencies:

```bash
npm install
```

Set the environment variables:

```bash
cp .env.example .env

# open .env and modify the environment variables
```

set up postgres database using docker

```bash
# set up postgres with docker
docker-compose up -d
```

## Commands

Running the application:

```bash
# running locally
npm run dev

# running in prodution
npm run start
```

```bash
# migrate and seed database
prisma migrate dev
prisma db seed
```

access `localhost:8000`

## Program flow

`request` > router > controller > service > repository > service > controller > router > `response`

## Git Commit Message

It is forced to commit [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) to this repository. For commiting in this style you can use this [VSCode Extension](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits).

## Project Structure

```
prisma\
 |--migration\      # migration history
 |--schema.prisma   # database schema
src\
 |--config\         # Environment variables and configuration related things
 |--controller\     # Route controllers (controller layer)
 |--middleware\     # Custom express middlewares
 |--model\          # interface models (data layer)
 |--repository\     # database queries
 |--router\         # Routes
 |--seed\           # database seeding
 |--service\        # Business logic (service layer)
 |--utils\          # Utility classes and functions
 |--index.ts        # App entry point
```

## Response Format (Error handling)

Response api functions are arranged in API-Response file containing:

1. responseOK
2. responseData
3. responseError

Success

```
{
    message: string, (optional)
    data: [] or {}
}
```

Error

```
{
    message: string,
    errors: {
        field1: "error message",
        field2: "error message",
        ...
    }
}
```

## API Documentation

Please refer to this [postman](https://documenter.getpostman.com/view/28923101/2s9Xy6ppZo#dfd6374b-9322-4424-93ef-70738ab61e44)

## References

1. [setting up ts and node](https://www.digitalocean.com/community/tutorials/setting-up-a-node-project-with-typescript)
2. [migration](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate)
3. [seeding](https://www.prisma.io/docs/guides/migrate/seed-database)
4. [unknown type checking](https://marketsplash.com/tutorials/typescript/typescript-unknown-vs-any/)
5. [envalid](https://www.npmjs.com/package/envalid)
6. [prisma cli commands](https://www.prisma.io/docs/reference/api-reference/command-reference)
7. [postgres docker](https://medium.com/nerd-for-tech/how-to-set-up-prisma-with-a-local-docker-postgres-container-9e0958d08544)
8. [boilerplate #1](https://github.com/pshaddel/ts-express-prisma#readme)
9. [boilerplate #2](https://github.com/antonio-lazaro/prisma-express-typescript-boilerplate/tree/main)
10. [prisma error reference](https://www.prisma.io/docs/reference/api-reference/error-reference#prismaclientknownrequesterror)
11. [prisma handling exception](https://www.prisma.io/docs/concepts/components/prisma-client/handling-exceptions-and-errors)
12. [typescript ellipsis](https://www.tutorialsteacher.com/typescript/rest-parameters)
