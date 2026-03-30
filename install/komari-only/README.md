# 仅安装 Komari 分类说明

这个分类适合：

- 你只想安装 Komari 探针
- 你不想启动 sing-box / Argo
- 你已经有自己的主程序，只需要把节点上报到 Komari

## 对应安装代码

这个目录本身就是“仅安装 Komari 分支”的预置内容。当前分类提供独立脚本：

- `install/komari-only/install.sh`

如果你后续要单独拆分分支，可以直接把当前目录内容提到目标分支根目录。

这个脚本只做一件事：

> 安装或启动 Komari 探针，不再启动仓库根目录里的 sing-box / Argo / HTTP 订阅服务。

## 使用前先准备

至少需要以下参数：

- `KOMARI_ENDPOINT`
- `KOMARI_AUTO_DISCOVERY_TOKEN`

如果不传环境变量，也可以直接修改脚本顶部默认值：

```bash
LOCAL_KOMARI_INSTALL_URL="https://raw.githubusercontent.com/komari-monitor/komari-agent/b1c863bacdb7bff478621b2eaf802e5eb19ad9c7/install.sh"
LOCAL_KOMARI_ENDPOINT="https://komari.example.com"
LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN=""
```

## 运行方式

在仓库根目录执行：

```bash
bash install/komari-only/install.sh
```

也可以显式传环境变量：

```bash
KOMARI_ENDPOINT="https://your-komari.example.com" \
KOMARI_AUTO_DISCOVERY_TOKEN="your-token" \
bash install/komari-only/install.sh
```

## 工作目录说明

默认情况下，脚本会在当前分类目录下创建：

```text
install/komari-only/.npm
```

其中会保存：

- `komari-agent`
- `komari-agent.log`
- `komari-agent.pid`
- `auto-discovery.json`

如果你想自定义保存目录，可以设置：

```bash
KOMARI_WORK_DIR="/your/path"
```

脚本就会改为使用：

```text
/your/path/.npm
```

## 安装逻辑说明

### 1. 优先执行官方安装脚本

只允许执行：

```text
https://raw.githubusercontent.com/komari-monitor/komari-agent/.../install.sh
```

范围内的受信任地址。

### 2. 官方安装失败时自动回退

如果官方脚本失败，当前分类会自动尝试：

- 下载 `komari-agent`
- 以当前用户身份后台运行
- 记录 PID
- 保留 `auto-discovery.json`

这对非 root 容器、无 systemd 环境尤其有用。

## 成功日志示例

### 官方安装成功

```text
[Komari] 开始安装，仅安装 Komari 探针...
[Komari] 官方安装脚本执行成功
```

### 用户态启动成功

```text
[Komari] 官方安装脚本执行失败，尝试用户态启动...
[Komari] 用户态探针已启动 PID: 12345
```

## 常见问题

### 1. 提示 `未设置 KOMARI_AUTO_DISCOVERY_TOKEN`

说明你没有传入：

- `KOMARI_AUTO_DISCOVERY_TOKEN`

### 2. 提示 `KOMARI_ENDPOINT 格式无效`

说明 `KOMARI_ENDPOINT` 不是合法的 `http://` 或 `https://` 地址。

### 3. 提示 `安装地址不受信任`

说明你覆盖了 `KOMARI_INSTALL_URL`，但地址不在允许范围内。

### 4. 重复执行脚本会怎样

如果用户态探针已经在运行，并且 PID 文件仍然有效，脚本会直接提示已在运行，不会重复启动新进程。
