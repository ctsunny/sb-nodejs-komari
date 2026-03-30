# 无法上传 `start.sh` 的 Node.js 特殊版本

这个分类适合下面这类环境：

- 面板只允许上传 `index.js` / `package.json`
- 面板启动命令只能写 `npm start`
- 面板不支持上传 `start.sh`，但运行环境本身仍然有 `bash`
- 你需要节点功能（sing-box / Argo / `/sub`），同时也希望继续接入 Komari

> 说明：这个版本的入口仍然只有 `index.js` + `package.json`，但会优先在运行时落地并执行仓库里的完整 `start.sh`，从而避开“不能上传 `start.sh`”的限制。

## 对应安装代码

当前目录就是“无 `start.sh` 特殊版本”的预置内容，直接使用下面 2 个文件即可：

- `index.js`
- `package.json`

如果你后续要单独拆分分支，可以直接把当前目录内容提到目标分支根目录。

## 功能说明

这个版本默认优先做 1 件事：

1. 运行时自动落地完整节点脚本，并启动：
   - sing-box
   - Argo
   - `/sub` 订阅服务
   - Komari 自动探针（如果已配置 token）

如果完整节点模式因为环境缺少 `bash`，或启动时立即失败，则会自动回退到旧的纯 Komari 模式：

1. 下载并启动 `komari-agent`
2. 在当前 Node.js 端口上输出一个纯文本控制台面板，方便看探针日志

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

完整节点模式里，Argo / sing-box 的默认值沿用仓库主版本脚本；如果你要改默认 `ARGO_TOKEN`、`SINGLE_PORT_UDP` 等参数，建议直接在面板环境变量里传入。

### 方式 B：在面板环境变量中填写

可用环境变量：

- `PORT`
- `SERVER_PORT`
- `ARGO_TOKEN`
- `SINGLE_PORT_UDP`
- `KOMARI_ENDPOINT`
- `KOMARI_TOKEN`
- `KOMARI_AUTO_DISCOVERY_TOKEN`
- `NO_STARTSH_FULL_RUNTIME`

并且要注意：

> 环境变量优先级高于 `index.js` 顶部默认值。

其中：

- `ARGO_TOKEN`
  - 不填时默认临时隧道
- `SINGLE_PORT_UDP`
  - 单端口 UDP 协议，支持 `hy2` / `tuic`
- `NO_STARTSH_FULL_RUNTIME`
  - 设为 `1` / `true` / `yes` 时，强制关闭完整节点模式，只保留旧的纯 Komari 文本面板

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
- 运行环境存在 `bash`
- 运行环境允许访问外网
- 运行环境允许访问 GitHub Releases
- 如果部署时目录里不存在 `start.sh`，还需要允许访问：
  - `https://raw.githubusercontent.com`

## 工作目录说明

默认会在当前目录下创建：

```text
.npm/
```

其中通常会看到：

- `agent.log`
- `task_时间戳`
- `auto-discovery.json`（由 `komari-agent` 自己生成）
- `full-runtime/start.sh`（完整节点模式运行时落地的脚本）

脚本启动时会清理旧的 `task_*` 文件，但不会主动清理 `auto-discovery.json`，这样自动发现成功后，后续重启仍然可以继续复用服务端已分配的信息。

## 面板访问说明

### 完整节点模式

服务启动后，优先按完整节点模式工作。健康检查建议直接检查：

```text
/sub
```

你最终会得到：

- 节点协议
- Argo 隧道
- `/sub` 订阅
- Komari 自动探针

### 回退后的纯 Komari 模式

如果完整节点模式没有拉起，才会回退到旧的文本面板。此时访问：

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

因为回退模式本身不提供 `/sub`。

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
