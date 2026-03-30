# Koyeb 容器部署说明

这个分类适合：

- Koyeb `Web Service`
- 从 GitHub 仓库直接导入部署

## 对应安装代码

Koyeb 分类同样使用仓库根目录的 3 个主程序文件：

- `index.js`
- `package.json`
- `start.sh`

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

如需启用 Komari，再额外填写：

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

如果额外设置：

```text
KOMARI_ENDPOINT=https://your-komari.example.com
KOMARI_AUTO_DISCOVERY_TOKEN=your-token
```

脚本会自动尝试安装 Komari。

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
- `KOMARI_AUTO_DISCOVERY_TOKEN` 是否正确
- 容器是否允许联网下载文件
