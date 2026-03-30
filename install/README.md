# install 目录说明

仓库根目录（`main`）当前已经固定为 **Koyeb 可直接使用的主版本**。  
`install` 目录下面则单独放其他容器 / 使用场景的版本，方便你后续按目录拆分成不同分支，或者直接按目录取文件使用。

## 目录列表

### 1. `install/nodejs-container`

适合：

- 宝塔 / 1Panel / PM2 等 Node.js 面板
- 普通 Node.js 容器
- 自己上传文件，或者希望自动识别面板分配端口的环境

特点：

- `start.sh` 里的 `LOCAL_SERVER_PORT` 默认保持为空
- 可手动填写，也可直接使用面板自动注入的端口环境变量
- 目录内自带详细中文说明

说明入口：

- [install/nodejs-container/README.md](./nodejs-container/README.md)

### 2. `install/komari-only`

适合：

- 你只想安装 Komari 探针
- 不想同时运行 sing-box / Argo / HTTP 订阅
- 已经有自己的主程序，只需要把节点接入 Komari

特点：

- 只提供独立的 `install.sh`
- 不再依赖根目录主程序
- 目录内自带详细中文说明

说明入口：

- [install/komari-only/README.md](./komari-only/README.md)

### 3. `install/koyeb`

适合：

- 你想单独提取一个 Koyeb 分支
- 你想保留一份与根目录同步的 Koyeb 预置拷贝

特点：

- 内容与根目录 Koyeb 主版本同步
- `start.sh` 已预置 `8000`
- 目录内自带详细中文说明

说明入口：

- [install/koyeb/README.md](./koyeb/README.md)

### 4. `install/nodejs-no-startsh`

适合：

- 面板不支持上传 `start.sh`
- 面板只允许跑纯 Node.js 入口
- 但运行环境本身仍有 `bash`
- 你既要节点功能，也要 Komari

特点：

- 只需要 `index.js` + `package.json`
- 会在运行时自动落地并执行完整节点脚本
- 默认可启动 sing-box / Argo / `/sub` / Komari
- 如果完整模式失败，会自动回退到纯 Komari 文本面板

说明入口：

- [install/nodejs-no-startsh/README.md](./nodejs-no-startsh/README.md)

## 使用建议

### 如果你部署到 Koyeb

优先直接使用仓库根目录即可。根目录已经按 Koyeb 默认单端口场景预置，通常只需要：

- `npm start`
- Exposed Port 设为 `8000`
- Health Check 路径设为 `/sub`

### 如果你部署到其他 Node.js 容器 / 面板

优先使用 `install/nodejs-container` 目录中的版本，因为它保留了更适合面板场景的空端口默认值，避免把 Koyeb 的 `8000` 写死到你的容器里；现在它也会自动识别常见面板注入的端口环境变量。

如果你的面板**明确不支持上传 `start.sh`**，但运行环境本身有 `bash`，可以直接改用 `install/nodejs-no-startsh`。

### 如果你只需要 Komari

直接使用 `install/komari-only`。
