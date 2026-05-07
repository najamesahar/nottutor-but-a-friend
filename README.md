# nottutor-but-a-friend

Local development and quick start

Prerequisites: Docker (optional), Node.js, npm

Install dependencies:

```bash
npm ci
```

Run tests:

```bash
npm test
```

Run locally (requires MongoDB running and env vars):

```bash
cp .env.example .env
# edit .env to set MONGODB_URI and SESSION_SECRET
npm start
```

Run with Docker Compose:

```bash
docker-compose up --build
```
