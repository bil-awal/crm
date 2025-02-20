# Dockerfile
# Use the official Node.js image as the base image
FROM node:20-alpine AS builder

# Enable Corepack
RUN corepack enable

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock to the container
COPY .env package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Ensure Corepack uses the correct version of the package manager
RUN corepack prepare --activate

# Copy the rest of the application code
COPY . .

# Install dependencies and build the project
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm install; \
  elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Build the project
RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then pnpm run build; \
  else yarn build; \
  fi

# Use Nginx as the production server
FROM nginx:stable-alpine

# Copy the built Vue.js files to the Nginx web server directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for Nginx
EXPOSE 80

# Start Nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]
