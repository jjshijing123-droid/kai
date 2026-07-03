# ============================
# Stage 1: 依赖安装 + 前端构建
# ============================
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json ./

# 安装所有依赖（包括 devDependencies，因为需要 vite 构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# ============================
# Stage 2: 生产环境
# ============================
FROM node:20-alpine AS production

# 安装 tini 用于优雅的信号传递
RUN apk add --no-cache tini

WORKDIR /app

# 复制 package.json 并安装生产依赖
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 从 builder 阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 复制服务端代码
COPY server.js ./
COPY server/ ./server/
COPY src/ ./src/

# 创建必要的目录
RUN mkdir -p Product uploads

# 暴露端口
EXPOSE 8000

# 使用 tini 作为 init 系统，正确处理 SIGTERM
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
