# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=20.10.0

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

ENV TZ=UTC

# Set working directory for all build stages.
WORKDIR /app

# Copy package.json so that package manager commands can be used.
COPY package.json .

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=yarn.lock,target=yarn.lock \
    --mount=type=cache,target=/root/.yarn \
    yarn install

# Copy the rest of the source files into the image.
COPY . .

# Run the build script.
RUN yarn run build

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD npm run start:dev
