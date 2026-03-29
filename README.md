# sb-nodejs-komari

一个基于 Node.js 启动的 sing-box 脚本，启动后会按端口数量自动生成以下节点组合：

- 单端口模式：`HY2 + Argo`（可在脚本中切换为 `TUIC + Argo`）
- 多端口模式：`TUIC + HY2 + Reality + Argo`

同时脚本现在会自动执行 Komari 探针安装：

```bash
bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) -e https://tz.1111155.xyz --auto-discovery wou1WEqTWUDmp13UPVWCHHae
```

## 使用方式

```bash
npm start
```

或直接运行：

```bash
bash /home/runner/work/sb-nodejs-komari/sb-nodejs-komari/start.sh
```

## 运行要求

- Node.js `>= 18`
- 系统需要可用的 `bash`、`curl`
- 需要通过环境变量 `SERVER_PORT` 传入端口

示例：

```bash
SERVER_PORT="3000" npm start
```

多端口示例：

```bash
SERVER_PORT="3000 3001" npm start
```

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
