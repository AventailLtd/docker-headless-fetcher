# docker-headless-fetcher
A lightweight Dockerized HTTP API for fetching web pages with full JavaScript execution and redirect handling using Playwright (headless Chromium).

# Run:

    docker build -t playwright-api .
    docker run --rm -p 8080:8080 playwright-api

OR

    cp .env.example .env
    # set the .env!
    docker compose up -d --build


# Use:

    curl -X POST http://localhost:8080/fetch \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer SECRETPASSWORD" \
    -d '{"url":"https://httpbin.org/redirect/3"}'

Response:

    {
    "url": "https://httpbin.org/get",
    "status": 200,
    "body": "<html> ... renderelt tartalom ... </html>"
    }
