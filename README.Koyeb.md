# Koyeb 部署说明

这份文档专门说明如何把当前仓库部署到 Koyeb，并解释为什么会出现下面这类常见报错：

```text
[错误] 未找到端口
Error: Command failed: bash start.sh
```

## 一、先说明报错原因

当前仓库的启动流程是：

1. `npm start`
2. 执行仓库根目录下的 `index.js`
3. `index.js` 再调用 `bash start.sh`
4. `start.sh` 从环境变量 `SERVER_PORT` 或脚本顶部的 `LOCAL_SERVER_PORT` 读取端口

脚本中的关键逻辑是：

```bash
PORTS_STRING="${SERVER_PORT:-$LOCAL_SERVER_PORT}"
read -ra AVAILABLE_PORTS <<< "$PORTS_STRING"
[ $PORT_COUNT -eq 0 ] && echo "[错误] 未找到端口" && exit 1
```

所以如果 Koyeb 没有传入 `SERVER_PORT`，并且你也没有手动修改 `LOCAL_SERVER_PORT`，启动时就会直接报：

```text
[错误] 未找到端口
```

## 二、Koyeb 上应该怎么部署

推荐使用：

- **App**
- **Web Service**
- **从 GitHub 仓库导入**

不建议把它当成没有 HTTP 入口的后台任务，因为本项目会启动一个 HTTP 订阅服务，而且 Koyeb 需要健康检查。

## 三、部署前先知道的 3 个关键点

### 1. 必须设置 `SERVER_PORT`

最少要配置：

```text
SERVER_PORT=8000
```

你也可以用别的端口，例如 `3000`、`8080`，但 Koyeb 暴露端口和健康检查端口要与它保持一致。

### 2. 健康检查不要配 `/`

当前脚本会动态生成一个 HTTP 服务，只有下面两类路径返回成功：

- `/sub`
- `/${UUID}`

如果访问 `/`，脚本会返回：

```text
404
```

所以在 Koyeb 上：

- **不要把健康检查路径设为 `/`**
- **应设为 `/sub`**

### 3. 单端口最适合 Koyeb

当前脚本支持：

- 单端口模式：`HY2 + Argo`
- 多端口模式：`TUIC + HY2 + Reality + Argo`

Koyeb 上推荐优先使用**单端口模式**，先让服务稳定启动，再考虑更复杂的端口组合。

## 四、详细部署步骤

### 第 1 步：登录 Koyeb

打开 Koyeb 控制台并登录账号。

### 第 2 步：创建 App

选择：

- **Create App**
- **GitHub**

然后连接 GitHub，选择当前仓库：

- `ctsunny/sb-nodejs-komari`

### 第 3 步：创建 Web Service

服务类型选择：

- **Web Service**

### 第 4 步：构建与启动命令

这个仓库没有复杂构建流程，`package.json` 中只有一个启动脚本。

#### Build Command

可以填写：

```bash
npm install
```

如果 Koyeb 自动识别 Node.js 项目，也可以留给平台默认处理。

#### Run Command

填写：

```bash
npm start
```

### 第 5 步：设置环境变量

至少添加：

```text
SERVER_PORT=8000
```

如果你要启用 Komari，再额外填写：

```text
KOMARI_ENDPOINT=https://你的-komari-地址
KOMARI_AUTO_DISCOVERY_TOKEN=你的自动发现token
```

如果你不需要 Komari，可以不填这两个变量，脚本会自动跳过探针安装。

### 第 6 步：设置 Koyeb 暴露端口

把 Koyeb 的端口设置为：

```text
8000
```

注意这里必须和：

```text
SERVER_PORT=8000
```

保持一致。

### 第 7 步：配置健康检查

建议设置为：

- **Protocol**: HTTP
- **Port**: `8000`
- **Path**: `/sub`

如果你把健康检查写成 `/`，服务即使已经启动，也可能因为返回 404 而被 Koyeb 判定为不健康。

### 第 8 步：部署并查看日志

部署后，如果配置正确，日志中通常会看到类似输出：

```text
[网络] 获取公网 IP...
[网络] 公网 IP: x.x.x.x
[CF优选] 测试中...
[CF优选] store.ubi.com
[端口] 发现 1 个: 8000
[HTTP] 启动订阅服务 (端口 8000)...
[HTTP] 订阅服务已启动
[SING-BOX] 已启动 PID: xxxx
[Argo] 启动隧道 (HTTP2模式)...
```

如果你看到：

```text
[端口] 发现 1 个: 8000
```

说明最核心的端口问题已经解决。

## 五、推荐的最简配置

下面是一套最容易成功的配置：

### Build Command

```bash
npm install
```

### Run Command

```bash
npm start
```

### Exposed Port

```text
8000
```

### Environment Variables

```text
SERVER_PORT=8000
```

### Health Check

- Protocol: `HTTP`
- Port: `8000`
- Path: `/sub`

## 六、如果你要启用 Komari

额外设置：

```text
KOMARI_ENDPOINT=https://your-komari.example.com
KOMARI_AUTO_DISCOVERY_TOKEN=your-token
```

成功时日志可能出现：

```text
[Komari] 自动探针已安装
```

或者在非 root 环境下出现：

```text
[Komari] 自动探针已以用户态启动 PID: 12345
```

这两种都表示 Komari 已经正常工作。

## 七、常见问题排查

### 1. 还是提示 `未找到端口`

检查以下几点：

1. Koyeb 环境变量里是否真的存在 `SERVER_PORT`
2. 名称是否拼写完全正确
3. 值是否为空
4. Koyeb 暴露端口是否与 `SERVER_PORT` 一致

### 2. 一直卡在健康检查

优先检查：

1. 健康检查路径是不是 `/sub`
2. 健康检查端口是不是和 `SERVER_PORT` 一致
3. 是否误用了 `/`

### 3. Komari 没有启动

检查：

1. `KOMARI_ENDPOINT` 是否带有 `http://` 或 `https://`
2. `KOMARI_AUTO_DISCOVERY_TOKEN` 是否正确
3. 容器是否允许访问外网并下载 agent

### 4. `npm start` 失败

当前仓库运行依赖：

- Node.js 18+
- `bash`
- `curl`

如果运行环境缺少这些依赖，也可能导致启动失败。

## 八、一句话总结

如果你只是想在 Koyeb 上把它跑起来，最重要的就是这三项：

1. 设置 `SERVER_PORT=8000`
2. Koyeb 暴露端口也设为 `8000`
3. 健康检查路径改成 `/sub`

只要这三项配置正确，`[错误] 未找到端口` 和大多数 Koyeb 健康检查问题通常都能解决。
