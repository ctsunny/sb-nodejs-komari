# 无法上传 `start.sh` 的 Node.js 特殊版本

这个分类适合下面这类环境：

- 面板只允许上传 `index.js` / `package.json`
- 面板启动命令只能写 `npm start`
- 你只想把节点接入 Komari，不需要同时运行 sing-box / Argo / HTTP 订阅

> 说明：这个版本是按“纯 Node.js 下载并启动 `komari-agent`”的思路单独做的一套特殊版本，目的就是避开 `start.sh` 上传限制。

## 对应安装代码

当前目录就是“无 `start.sh` 特殊版本”的预置内容，直接使用下面 2 个文件即可：

- `index.js`
- `package.json`

如果你后续要单独拆分分支，可以直接把当前目录内容提到目标分支根目录。

## 功能说明

这个版本只做 2 件事：

1. 下载并启动 `komari-agent`
2. 在当前 Node.js 端口上输出一个纯文本控制台面板，方便看探针日志

它**不会**启动：

- sing-box
- Argo
- `/sub` 订阅服务

## 参数配置

你可以二选一：

### 方式 A：直接修改 `index.js` 顶部默认值

重点看这几项：

```js
const LOCAL_PANEL_PORT = '';
const LOCAL_KOMARI_ENDPOINT = 'https://komari.example.com';
const LOCAL_KOMARI_TOKEN = '';
const LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN = '';
```

其中：

- `LOCAL_PANEL_PORT`
  - 面板如果不会自动注入端口，再手动填写
- `LOCAL_KOMARI_ENDPOINT`
  - 填你的 Komari 服务端地址
- `LOCAL_KOMARI_TOKEN`
  - 固定 token
- `LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN`
  - 自动发现 token
  - 仅当未设置 `LOCAL_KOMARI_TOKEN` 时使用

### 方式 B：在面板环境变量中填写

可用环境变量：

- `PORT`
- `SERVER_PORT`
- `KOMARI_ENDPOINT`
- `KOMARI_TOKEN`
- `KOMARI_AUTO_DISCOVERY_TOKEN`

并且要注意：

> 环境变量优先级高于 `index.js` 顶部默认值。

## 上传与启动

把下面 2 个文件上传到同一个目录：

- `index.js`
- `package.json`

启动命令使用：

```bash
npm start
```

## 运行要求

- Node.js `>= 18`
- 运行环境允许访问外网
- 运行环境允许访问 GitHub Releases

## 工作目录说明

默认会在当前目录下创建：

```text
.npm/
```

其中通常会看到：

- `agent.log`
- `task_时间戳`
- `auto-discovery.json`（由 `komari-agent` 自己生成）

脚本启动时会清理旧的 `task_*` 文件，但不会主动清理 `auto-discovery.json`，这样自动发现成功后，后续重启仍然可以继续复用服务端已分配的信息。

## 面板访问说明

服务启动后，访问：

```text
http://你的IP:PORT/
```

就能看到：

- 当前对接的 Komari 地址
- 探针运行状态
- 最近一段探针输出日志

如果你要配置 HTTP 健康检查，建议直接检查：

```text
/
```

因为这个特殊版本本身不提供 `/sub`。

## 常见问题

### 1. 面板显示 `缺少 token`

说明你没有传入：

- `KOMARI_TOKEN`
- `KOMARI_AUTO_DISCOVERY_TOKEN`

### 2. 面板显示 `配置错误`

通常表示：

- `KOMARI_ENDPOINT` 不是合法的 `http://` 或 `https://` 地址

### 3. 启动后日志里提示下载失败

说明当前环境可能无法访问：

- `https://github.com/komari-monitor/komari-agent/releases/latest/download/...`

请先确认面板网络策略没有拦截 GitHub Releases。
