# Koyeb 容器部署说明

这个分类适合：

- Koyeb `Web Service`
- 从 GitHub 仓库直接导入部署

> 说明：仓库根目录 `main` 当前已经是 Koyeb 可直接使用的主版本。当前目录保留一份同步的 Koyeb 预置拷贝，方便你后续单独拆分分支。

## 对应安装代码

这个目录本身就是“Koyeb 分支”的预置内容，已经放好了对应主程序文件，并且 `start.sh` 已预置 `8000`：

- `index.js`
- `package.json`
- `start.sh`

如果你后续要单独拆分分支，可以直接把当前目录内容提到目标分支根目录。

Koyeb 的区别主要不在代码文件本身，而在于：

- 环境变量配置
- 暴露端口
- 健康检查路径

## 推荐部署方式

在 Koyeb 中选择：

- `Create App`
- `GitHub`
- `Web Service`

不建议作为没有 HTTP 入口的后台任务部署，因为当前项目会启动 HTTP 订阅服务。

## 必须先知道的 3 个重点

### 1. 必须设置 `SERVER_PORT`

最简示例：

```text
SERVER_PORT=8000
```

### 2. 健康检查不要写 `/`

当前脚本返回成功的路径是：

- `/sub`
- `/${UUID}`

Koyeb 健康检查请优先使用：

```text
/sub
```

### 3. 建议先用单端口

Koyeb 上建议先用：

```text
SERVER_PORT=8000
```

先确认服务稳定运行，再考虑多端口。

## 详细部署步骤

### 1. 导入仓库

选择仓库：

- `ctsunny/sb-nodejs-komari`

### 2. Build Command

可以填写：

```bash
npm install
```

### 3. Run Command

填写：

```bash
npm start
```

### 4. 环境变量

至少填写：

```text
SERVER_PORT=8000
```

> 说明：本文里的 Komari 地址、token、域名都只是占位示例，请替换成你自己的真实配置，不要直接照抄示例值。

如需启用 Komari，再额外填写以下其中一种：

```text
KOMARI_ENDPOINT=https://你的-komari-地址
KOMARI_TOKEN=你的客户端固定token
```

或者：

```text
KOMARI_ENDPOINT=https://你的-komari-地址
KOMARI_AUTO_DISCOVERY_TOKEN=你的自动发现token
```

### 5. Exposed Port

填写与 `SERVER_PORT` 一致的端口，例如：

```text
8000
```

### 6. Health Check

推荐：

- Protocol: `HTTP`
- Port: `8000`
- Path: `/sub`

### 7. 订阅地址怎么看

现在脚本会优先打印：

```text
https://ARGO_DOMAIN/sub
```

也就是日志里的：

- `订阅链接: https://xxxx.trycloudflare.com/sub`

只有在 Argo 域名还没拿到时，才会退回到：

```text
http://IP:PORT/sub
```

如果日志里同时存在 `直连订阅: http://IP:PORT/sub`，那只是备用地址；在 Koyeb 上通常优先使用 Argo 域名对应的 `订阅链接`。

## 推荐最简配置

### Build Command

```bash
npm install
```

### Run Command

```bash
npm start
```

### Environment Variables

```text
SERVER_PORT=8000
```

### Health Check

- Protocol: `HTTP`
- Port: `8000`
- Path: `/sub`

## 启用 Komari 时的说明

如果额外设置以下其中一种：

```text
KOMARI_ENDPOINT=https://your-komari.example.com
KOMARI_TOKEN=your-fixed-token
```

或者：

```text
KOMARI_ENDPOINT=https://your-komari.example.com
KOMARI_AUTO_DISCOVERY_TOKEN=your-auto-discovery-token
```

脚本会自动尝试安装 Komari。  
如果同时设置了 `KOMARI_TOKEN` 和 `KOMARI_AUTO_DISCOVERY_TOKEN`，脚本会优先使用固定 token。

如果当前环境不是 root，仓库会自动回退到用户态启动模式，因此在 Koyeb 这类容器环境中也能继续工作。

## 常见问题

### 1. 日志提示 `[错误] 未找到端口`

说明你没有传入 `SERVER_PORT`，或者值为空。

### 2. 服务明明启动了，但 Koyeb 还是判定不健康

优先检查：

- 健康检查路径是不是 `/sub`
- 健康检查端口是不是与你填写的 `SERVER_PORT` 一致

### 3. Komari 没启动

优先检查：

- `KOMARI_ENDPOINT` 是否正确
- `KOMARI_TOKEN` 或 `KOMARI_AUTO_DISCOVERY_TOKEN` 是否正确
- 容器是否允许联网下载文件
