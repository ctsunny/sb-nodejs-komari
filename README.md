# sb-nodejs-komari

一个基于 Node.js 启动的 sing-box 脚本，启动后会按端口数量自动生成以下节点组合：

- 单端口模式：`HY2 + Argo`（可在脚本中切换为 `TUIC + Argo`）
- 多端口模式：`TUIC + HY2 + Reality + Argo`

## 当前主版本说明

仓库根目录（`main`）现在默认就是 **Koyeb 可直接使用的版本**：

- `start.sh` 顶部已经内置 `LOCAL_SERVER_PORT="8000"`
- 启动命令仍然使用 `npm start`
- Koyeb 健康检查请使用 `/sub`，不要写 `/`

如果你准备直接把这个仓库导入 Koyeb，优先使用根目录文件即可，不需要再额外挑版本。

如果你想看更细的 Koyeb 专项步骤，也可以继续查看：

- [README.Koyeb.md](./README.Koyeb.md)

## main 下的其他版本目录

为了避免不同容器场景互相混淆，其他版本统一单独放在 `install` 目录下，并且每个目录都带中文说明：

- [install/README.md](./install/README.md)：所有子版本总览
- [install/nodejs-container](./install/nodejs-container/README.md)：通用 Node.js 容器 / 面板版本
- [install/komari-only](./install/komari-only/README.md)：仅安装 Komari 探针版本
- [install/koyeb](./install/koyeb/README.md)：与根目录同步的 Koyeb 预置拷贝，方便你后续单独拆分分支

## Koyeb 快速部署

如果你是 Koyeb 用户，最简单的配置就是：

1. 在 Koyeb 里选择 **GitHub -> Web Service**
2. Build Command 使用默认识别，或填写 `npm install`
3. Run Command 填 `npm start`
4. Exposed Port 填 `8000`
5. Health Check 路径填 `/sub`

默认情况下，不额外传 `SERVER_PORT` 也会使用内置的 `8000`。  
如果你想换成别的端口，也可以显式设置 `SERVER_PORT`，但要同时把 Koyeb 暴露端口和健康检查端口一起改掉。

> 说明：本文所有 Komari 地址、token、域名示例都只是占位符，请替换成你自己的真实配置，不要直接照抄示例值。

同时脚本支持自动执行 Komari 探针安装。  
如果你填写的是自动发现 token，执行形式等价于：

```bash
bash <(curl -fsSL "$KOMARI_INSTALL_URL") -e "$KOMARI_ENDPOINT" --auto-discovery "$KOMARI_AUTO_DISCOVERY_TOKEN"
```

如果你想直接使用 Komari 后台已经生成好的客户端固定 token，则改为：

```bash
bash <(curl -fsSL "$KOMARI_INSTALL_URL") -e "$KOMARI_ENDPOINT" -t "$KOMARI_TOKEN"
```

如果运行环境不是 root（例如常见的 Node.js 面板容器），官方安装脚本报错后，本仓库会自动回退为“下载 agent 二进制并以当前用户后台运行”，这样 `KOMARI_AUTO_DISCOVERY_TOKEN` 仍然可以生效，而不依赖 systemd/root 权限。
同时脚本现在会保留 rootless Komari agent 首次注册后生成的 `auto-discovery.json`，这样容器重启后会优先复用服务端已分配的固定 token，而不是重新自动发现。

默认情况下，脚本内置了一个固定的 Komari 安装脚本地址；如需覆盖 `KOMARI_INSTALL_URL`，请保持为 `https://raw.githubusercontent.com/komari-monitor/komari-agent/` 下的受信任地址，否则脚本会拒绝执行。

如果你是“直接上传文件到面板”而不是通过 Git 克隆部署，可以直接编辑 `start.sh` 顶部的以下默认值：

- `LOCAL_SERVER_PORT`
- `LOCAL_KOMARI_ENDPOINT`
- `LOCAL_KOMARI_INSTALL_URL`
- `LOCAL_KOMARI_TOKEN`
- `LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN`

环境变量仍然优先；只有未传入环境变量时，脚本才会使用这些本地默认值。这样你只需要上传 `index.js`、`package.json`、`start.sh` 这 3 个程序文件即可运行。

> 注意：如果你把真实 token 直接写进了 `start.sh` 里，请不要再把这个文件提交回公开仓库。

## 面板用户详细操作说明（下载 / 改动 / 上传）

下面这套流程适合“不熟悉 Git，只会在面板里上传文件”的使用方式，按顺序操作即可。

### 1. 下载需要的文件

这个项目实际运行只依赖 3 个文件：

- `index.js`
- `package.json`
- `start.sh`

下载方式有两种：

#### 方式 A：直接在 GitHub 下载

1. 打开仓库页面。
2. 进入对应文件。
3. 点开 **Raw** 或 **下载原始文件**。
4. 把下面 3 个文件分别保存到本地电脑：
   - `index.js`
   - `package.json`
   - `start.sh`

#### 方式 B：下载整个仓库压缩包

1. 在仓库首页点击 **Code**。
2. 选择 **Download ZIP**。
3. 解压后，只取出以下 3 个文件上传即可：
   - `index.js`
   - `package.json`
   - `start.sh`

如果你本来就是通过 `git clone` 拉取代码部署，那么通常不需要手动下载文件，直接修改后运行即可。

### 2. 修改 `start.sh`

如果你使用的是面板上传部署，最简单的方法就是直接改 `start.sh` 顶部的本地默认值。

建议重点检查下面 5 项：

```bash
LOCAL_SERVER_PORT="8000" # 根目录默认按 Koyeb 单端口预置；面板环境可改成自己的端口
LOCAL_KOMARI_INSTALL_URL="https://raw.githubusercontent.com/komari-monitor/komari-agent/b1c863bacdb7bff478621b2eaf802e5eb19ad9c7/install.sh" # Komari 官方安装脚本地址
LOCAL_KOMARI_ENDPOINT="https://komari.example.com" # Komari 服务端地址示例，请改成你自己的地址
LOCAL_KOMARI_TOKEN="" # Komari 客户端固定 token
LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN="" # Komari 自动发现 token
```

你需要根据自己的面板和 Komari 后台信息修改：

- `LOCAL_SERVER_PORT`
  - 填你面板分配给容器/进程的端口
  - 单端口示例：`LOCAL_SERVER_PORT="3000"`
  - 多端口示例：`LOCAL_SERVER_PORT="3000 3001"`
- `LOCAL_KOMARI_ENDPOINT`
  - 填你的 Komari 服务端地址
  - 例如：`https://your-komari.example.com`
- `LOCAL_KOMARI_TOKEN`
  - 可填写 Komari 后台生成的客户端固定 token
  - 如果填写了它，脚本会优先使用 `-t`
- `LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN`
  - 填 Komari 后台生成的自动发现 token
  - 仅当未设置 `LOCAL_KOMARI_TOKEN` 时才会使用
- `LOCAL_KOMARI_INSTALL_URL`
  - 一般不要乱改
  - 只有你明确知道自己在做什么时才覆盖
  - 必须保持为 `https://raw.githubusercontent.com/komari-monitor/komari-agent/` 下的受信任地址，否则脚本会拒绝执行

如果你的面板支持配置环境变量，也可以不改这里，直接在面板环境变量里填写：

- `SERVER_PORT`
- `KOMARI_ENDPOINT`
- `KOMARI_TOKEN`
- `KOMARI_AUTO_DISCOVERY_TOKEN`
- `KOMARI_INSTALL_URL`

并且要注意：**环境变量优先级高于 `start.sh` 里的本地默认值。**

### 3. 上传到面板

修改完成后，把下面 3 个文件上传到同一个目录：

- `index.js`
- `package.json`
- `start.sh`

推荐上传到你的 Node.js 项目根目录，例如：

```text
/home/container/
```

或者你面板实际使用的项目目录。

上传后请确认：

1. 这 3 个文件在同一目录中。
2. 启动命令使用该目录作为工作目录。
3. 面板运行的是 Node.js 18 或更高版本。
4. 系统中可用 `bash` 与 `curl`。

### 4. 启动方式

优先使用：

```bash
npm start
```

如果你的面板允许自定义启动命令，也可以直接使用：

```bash
bash start.sh
```

### 5. 如何判断探针是否安装成功

启动日志里重点看 Komari 相关输出。

#### 情况 A：root 环境，官方安装脚本成功

你会看到类似：

```text
[Komari] 安装自动探针...
[Komari] 自动探针已安装
```

或者如果你使用的是固定 token：

```text
[Komari] 检测到固定 token，优先使用客户端 token 模式...
[Komari] 固定 token 探针已安装
```

这说明官方安装脚本执行成功，探针已经按官方方式装好。

#### 情况 B：非 root 环境，但已经自动回退成功

很多 Node.js 面板、共享容器、受限运行环境都不是 root。  
这种情况下，官方安装脚本可能失败，但本仓库会继续自动尝试“用户态启动”。

成功时一般会看到类似：

```text
[Komari] 检测到非 root 环境，改为用户态启动...
[下载] /你的目录/.npm/komari-agent...
[下载] /你的目录/.npm/komari-agent 完成
[Komari] 自动探针已以用户态启动 PID: 12345
```

使用固定 token 时，最后一行日志同样会出现，只是实际连接参数会改为 `-t`。  
这说明虽然没有 systemd / root 权限，但探针已经作为当前用户在后台启动。

## 探针安装成功经验总结

这次实际经验可以总结为一句话：

> **Komari 探针是否成功，关键不在于必须 root，而在于是否给到了正确的 endpoint、token，以及运行环境是否允许下载并执行 agent。**

更具体地说：

1. **官方安装脚本适合 root 环境**
   - 如果宿主机权限完整，官方脚本通常可以直接安装成功。
   - 这是最标准的方式。

2. **面板环境经常不是 root**
   - 很多面板容器无法使用 systemd，也没有 root 权限。
   - 这时候即使官方 installer 失败，也不代表完全不能装探针。

3. **本仓库已经针对这种情况做了兜底**
   - 当官方安装失败且当前用户不是 root 时，脚本会自动下载 `komari-agent` 二进制。
   - 然后以当前用户身份后台运行。
   - 对面板用户来说，这通常比强行依赖 systemd 更实用。

4. **最容易出错的是参数，而不是脚本逻辑**
   - `KOMARI_ENDPOINT` 写错
   - `KOMARI_TOKEN` 或 `KOMARI_AUTO_DISCOVERY_TOKEN` 填错
   - 面板没有放行网络
   - 容器里没有 `curl`
   - 这些情况比“脚本本身有问题”更常见

5. **上传部署时，最稳妥的方法就是只改顶部默认值**
   - 不熟悉命令行的用户，不建议到处改脚本逻辑。
   - 只改 `start.sh` 顶部几个本地变量，最不容易出错。

## 建议的最稳妥做法

如果你是面板用户，建议直接按下面的方法操作：

1. 下载 `index.js`、`package.json`、`start.sh`
2. 只修改 `start.sh` 顶部的：
   - `LOCAL_SERVER_PORT`
   - `LOCAL_KOMARI_ENDPOINT`
   - `LOCAL_KOMARI_TOKEN`
   - `LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN`
3. 上传这 3 个文件到项目目录
4. 用 `npm start` 启动
5. 查看日志中是否出现：
   - `[Komari] 自动探针已安装`
   - 或 `[Komari] 自动探针已以用户态启动 PID: ...`

只要出现上面两类成功日志中的任意一种，就说明探针已经安装/启动成功。

## 常见问题排查

### 1. 日志提示 `Endpoint 格式无效`

请检查 `KOMARI_ENDPOINT` 或 `LOCAL_KOMARI_ENDPOINT` 是否以 `http://` 或 `https://` 开头。

### 2. 日志提示 `安装地址不受信任`

说明你修改过 `KOMARI_INSTALL_URL`，并且地址不在允许范围内。  
请恢复为 `raw.githubusercontent.com/komari-monitor/komari-agent/.../install.sh` 下的受信任地址。

### 3. 没有设置 token，导致探针没启动

如果未设置：

- `KOMARI_TOKEN`
- `LOCAL_KOMARI_TOKEN`
- `KOMARI_AUTO_DISCOVERY_TOKEN`
- 或 `LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN`

脚本会直接跳过探针安装，这是正常行为。

### 4. 面板里 `npm start` 失败

优先检查：

1. 是否已正确填写端口
2. 运行环境是否能访问外网
3. 是否存在 `bash`
4. 是否存在 `curl`
5. Node.js 版本是否至少为 18

如果是当前仓库运行在受限沙箱中，获取公网 IP 失败也会导致启动失败，这通常是环境网络限制，不一定是脚本错误。

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
- 需要通过环境变量 `SERVER_PORT` 传入端口，或在 `start.sh` 的 `LOCAL_SERVER_PORT` 中写入默认端口
- 如需启用 Komari 探针，可以设置环境变量 `KOMARI_TOKEN`（固定 token）或 `KOMARI_AUTO_DISCOVERY_TOKEN`（自动发现 token），也可以在 `start.sh` 的 `LOCAL_KOMARI_TOKEN` / `LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN` 中写入默认值；如果两者同时存在，会优先使用固定 token
- 在非 root 的面板环境中，Komari 会自动改为用户态后台运行，不再因为 installer 需要 root 而直接失效

示例：

```bash
KOMARI_TOKEN="your-fixed-token" SERVER_PORT="3000" npm start
```

多端口示例：

```bash
KOMARI_AUTO_DISCOVERY_TOKEN="your-auto-discovery-token" SERVER_PORT="3000 3001" npm start
```

如果未设置 `KOMARI_TOKEN` 和 `KOMARI_AUTO_DISCOVERY_TOKEN`，脚本会跳过 Komari 自动探针安装，但其余 sing-box / Argo 启动流程仍会继续。

## 输出内容

脚本启动后会：

1. 获取公网 IP
2. 选择 Cloudflare 优选域名
3. 安装 Komari 自动探针
4. 下载并启动 sing-box / cloudflared
5. 生成订阅内容并启动 HTTP 订阅服务

订阅地址格式：

```text
https://ARGO_DOMAIN/sub
```

如果 Argo 临时隧道还没有拿到域名，脚本会自动回退为：

```text
http://IP:PORT/sub
```

其中：

- `ARGO_DOMAIN` 为日志里显示的 `xxxx.trycloudflare.com`
- `IP:PORT` 为本机直连订阅地址
- `/sub` 同时也是 Koyeb 健康检查路径

端口规则如下：

- 单端口模式下，与传入的唯一端口相同
- 多端口模式下，使用传入的第 2 个端口

也就是说，看到类似下面日志时：

```text
[Argo] 域名: example.trycloudflare.com
订阅链接: https://example.trycloudflare.com/sub
直连订阅: http://1.2.3.4:8000/sub
```

一般优先使用日志里的 **`订阅链接`**；只有在你自己确认公网 `IP:PORT` 可直连时，再使用 `直连订阅`。
