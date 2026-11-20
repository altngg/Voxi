#!/bin/sh
set -eu

echo "Initial Java compilation..."
./gradlew classes --no-daemon

(
    previous="$(find src -type f -exec sha256sum {} \; | sort | sha256sum)"

    while sleep 2; do
        current="$(find src -type f -exec sha256sum {} \; | sort | sha256sum)"

        if [ "$current" != "$previous" ]; then
            previous="$current"

            echo "Java source changes detected. Compiling..."

            ./gradlew classes --no-daemon || echo "Compilation failed. Waiting for next change..."
        fi
    done
) &

echo "Starting Spring Boot..."
exec ./gradlew bootRun --no-daemon
