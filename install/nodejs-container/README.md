# 通用 Node.js 容器 / 面板部署说明

这个分类适合下面这类环境：

- 宝塔 / 1Panel / PM2 等 Node.js 面板
- 支持自定义启动命令的普通容器
- 直接上传文件运行的 Node.js 项目目录

> 说明：仓库根目录 `main` 当前已经固定为 Koyeb 预置版本；如果你不是部署到 Koyeb，而是部署到普通 Node.js 容器 / 面板，请优先使用当前目录里的版本。

## 对应安装代码

这个目录本身就是“通用 Node.js 容器分支”的预置内容，已经放好了对应主程序文件：

- `index.js`
- `package.json`
- `start.sh`

如果你后续要单独拆分分支，可以直接把当前目录内容提到目标分支根目录。

## 快速开始

### 1. 准备文件

直接使用当前目录中的以下文件即可：

- `index.js`
- `package.json`
- `start.sh`

### 2. 填写参数

你可以二选一：

#### 方式 A：直接修改 `start.sh` 顶部默认值

重点看这几项（这里故意不把端口写死成 `8000`，方便你按面板分配值填写）：

```bash
LOCAL_SERVER_PORT=""
LOCAL_KOMARI_INSTALL_URL="https://raw.githubusercontent.com/komari-monitor/komari-agent/b1c863bacdb7bff478621b2eaf802e5eb19ad9c7/install.sh"
LOCAL_KOMARI_ENDPOINT="https://komari.example.com"
LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN=""
```

推荐至少填写：

- `LOCAL_SERVER_PORT`

如果还要自动安装 Komari，再额外填写：

- `LOCAL_KOMARI_ENDPOINT`
- `LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN`

#### 方式 B：在面板环境变量中填写

可用环境变量：

- `SERVER_PORT`
- `KOMARI_INSTALL_URL`
- `KOMARI_ENDPOINT`
- `KOMARI_AUTO_DISCOVERY_TOKEN`

并且要注意：

> 环境变量优先级高于 `start.sh` 顶部默认值。

## 单端口与多端口说明

### 单端口

例如：

```bash
SERVER_PORT="3000"
```

默认会启动：

- `HY2 + Argo`

如果你把 `SINGLE_PORT_UDP` 改成 `tuic`，则会切换成：

- `TUIC + Argo`

### 多端口

例如：

```bash
SERVER_PORT="3000 3001"
```

会启动：

- `TUIC + HY2 + Reality + Argo`

其中：

- 第 1 个端口会参与 `TUIC / Reality`
- 第 2 个端口会参与 `HY2 / HTTP 订阅`

## 启动命令

优先使用：

```bash
npm start
```

也可以直接运行：

```bash
bash start.sh
```

## 运行要求

- Node.js `>= 18`
- 系统中可用 `bash`
- 系统中可用 `curl`
- 运行环境允许访问外网

## Komari 自动安装说明

如果设置了：

- `KOMARI_AUTO_DISCOVERY_TOKEN`

脚本会自动尝试安装 Komari。

### root 环境

会优先执行官方安装脚本。

### 非 root 环境

如果官方安装脚本失败，当前仓库会自动回退到“用户态启动”：

- 下载 `komari-agent` 二进制到 `.npm`
- 以当前用户后台运行
- 保留 `auto-discovery.json`

这样容器重启后，已发现过的 token 可以继续复用。

## 常见问题

### 1. 启动时提示 `未找到端口`

说明没有正确设置：

- `SERVER_PORT`

或：

- `LOCAL_SERVER_PORT`

### 2. 日志提示 `Endpoint 格式无效`

请确认 `KOMARI_ENDPOINT` 以 `http://` 或 `https://` 开头。

### 3. 日志提示 `安装地址不受信任`

说明你自定义了 `KOMARI_INSTALL_URL`，但地址不在允许范围内。  
请恢复为 `https://raw.githubusercontent.com/komari-monitor/komari-agent/.../install.sh` 下的受信任地址。

### 4. 容器启动后健康检查失败

当前内置 HTTP 服务可用路径是：

- `/sub`
- `/${UUID}`

根路径 `/` 返回 `404`，不要把健康检查写成 `/`。
