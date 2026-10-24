# The privacy service: two small open models on Node 22, running as a non-root user with no
# internet access at run time. Models are downloaded here, at build time, and baked in.
# glibc (Debian slim), not Alpine: onnxruntime-node ships glibc binaries only.

FROM node:22-bookworm-slim AS build
WORKDIR /svc
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
 # Keep only the Linux x64 CPU runtime: drop other platforms and the GPU providers.
 && rm -rf node_modules/onnxruntime-node/bin/napi-v6/darwin node_modules/onnxruntime-node/bin/napi-v6/win32 \
           node_modules/onnxruntime-node/bin/napi-v6/linux/arm64 \
 && rm -f node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime_providers_cuda.so \
          node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime_providers_tensorrt.so
COPY *.mjs ./
RUN node download.mjs

FROM node:22-bookworm-slim
WORKDIR /svc
ENV NODE_ENV=production PORT=8080 MODEL_DIR=/svc/models
RUN groupadd --system app && useradd --system --gid app --no-create-home app
COPY --from=build --chown=app:app /svc ./
USER app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
