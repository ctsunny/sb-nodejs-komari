# sb-nodejs-komari

一个基于 Node.js 启动的 sing-box 脚本，启动后会按端口数量自动生成以下节点组合：

- 单端口模式：`HY2 + Argo`（可在脚本中切换为 `TUIC + Argo`）
- 多端口模式：`TUIC + HY2 + Reality + Argo`

同时脚本支持自动执行 Komari 探针安装。执行形式等价于：

```bash
bash <(curl -fsSL "$KOMARI_INSTALL_URL") -e "$KOMARI_ENDPOINT" --auto-discovery "$KOMARI_AUTO_DISCOVERY_TOKEN"
```

默认情况下，脚本内置了一个固定的 Komari 安装脚本地址；如需覆盖 `KOMARI_INSTALL_URL`，请保持为 `https://raw.githubusercontent.com/komari-monitor/komari-agent/` 下的受信任地址，否则脚本会拒绝执行。

## 使用方式

```bash
npm start
```

或直接运行：

```bash
bash start.sh
```

## 运行要求

- Node.js `>= 18`
- 系统需要可用的 `bash`、`curl`
- 需要通过环境变量 `SERVER_PORT` 传入端口
- 如需启用 Komari 自动探针，需要设置环境变量 `KOMARI_AUTO_DISCOVERY_TOKEN`

示例：

```bash
KOMARI_AUTO_DISCOVERY_TOKEN="your-token" SERVER_PORT="3000" npm start
```

多端口示例：

```bash
KOMARI_AUTO_DISCOVERY_TOKEN="your-token" SERVER_PORT="3000 3001" npm start
```

如果未设置 `KOMARI_AUTO_DISCOVERY_TOKEN`，脚本会跳过 Komari 自动探针安装，但其余 sing-box / Argo 启动流程仍会继续。

## 输出内容

脚本启动后会：

1. 获取公网 IP
2. 选择 Cloudflare 优选域名
3. 安装 Komari 自动探针
4. 下载并启动 sing-box / cloudflared
5. 生成订阅内容并启动 HTTP 订阅服务

订阅地址格式：

```text
http://IP:PORT/sub
```

其中 `PORT` 为 HTTP 订阅端口：

- 单端口模式下，与传入的唯一端口相同
- 多端口模式下，使用传入的第 2 个端口
