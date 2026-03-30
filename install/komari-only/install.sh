#!/bin/bash
set -e

# ================== 配置区域 ==================
LOCAL_KOMARI_INSTALL_URL="https://raw.githubusercontent.com/komari-monitor/komari-agent/b1c863bacdb7bff478621b2eaf802e5eb19ad9c7/install.sh"
LOCAL_KOMARI_ENDPOINT="https://komari.example.com"
LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN=""

cd "$(dirname "$0")"

KOMARI_WORK_DIR="${KOMARI_WORK_DIR:-$PWD}"
FILE_PATH="${KOMARI_WORK_DIR}/.npm"
KOMARI_INSTALL_URL="${KOMARI_INSTALL_URL:-$LOCAL_KOMARI_INSTALL_URL}"
KOMARI_ENDPOINT="${KOMARI_ENDPOINT:-$LOCAL_KOMARI_ENDPOINT}"
KOMARI_AUTO_DISCOVERY_TOKEN="${KOMARI_AUTO_DISCOVERY_TOKEN:-$LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN}"

is_valid_komari_endpoint() {
    [[ "$1" =~ ^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[^[:space:]\"<>]*)?$ ]]
}

prepare_workdir() {
    if [ -d "$FILE_PATH" ]; then
        find "$FILE_PATH" -mindepth 1 -maxdepth 1 \
            ! -name 'auto-discovery.json' \
            ! -name 'komari-agent' \
            ! -name 'komari-agent.log' \
            ! -name 'komari-agent.pid' \
            -exec rm -rf {} +
    else
        mkdir -p "$FILE_PATH"
    fi

    [ -w "$FILE_PATH" ] || {
        echo "[错误] 工作目录不可写: $FILE_PATH"
        exit 1
    }
}

start_komari_agent_rootless() {
    local os_name arch_name download_url komari_agent_file komari_log_file pid_file

    case "$(uname -s)" in
        Linux) os_name="linux" ;;
        Darwin) os_name="darwin" ;;
        FreeBSD) os_name="freebsd" ;;
        *) echo "[Komari] 不支持的系统: $(uname -s)" && return 1 ;;
    esac

    case "$(uname -m)" in
        x86_64) arch_name="amd64" ;;
        aarch64|arm64) arch_name="arm64" ;;
        i386|i686) arch_name="386" ;;
        armv7*|armv6*) arch_name="arm" ;;
        *) echo "[Komari] 不支持的架构: $(uname -m)" && return 1 ;;
    esac

    komari_agent_file="${FILE_PATH}/komari-agent"
    komari_log_file="${FILE_PATH}/komari-agent.log"
    pid_file="${FILE_PATH}/komari-agent.pid"
    download_url="https://github.com/komari-monitor/komari-agent/releases/latest/download/komari-agent-${os_name}-${arch_name}"

    if [ -f "$pid_file" ]; then
        existing_pid=$(cat "$pid_file" 2>/dev/null || true)
        if [ -n "$existing_pid" ] && kill -0 "$existing_pid" 2>/dev/null; then
            echo "[Komari] 用户态探针已在运行 PID: $existing_pid"
            return 0
        fi
    fi

    echo "[Komari] 改为用户态启动..."
    echo "[下载] ${komari_agent_file}..."
    curl -L -fsS --max-time 60 -o "$komari_agent_file" "$download_url"
    chmod +x "$komari_agent_file"
    echo "[下载] ${komari_agent_file} 完成"

    "$komari_agent_file" -e "$KOMARI_ENDPOINT" --auto-discovery "$KOMARI_AUTO_DISCOVERY_TOKEN" > "$komari_log_file" 2>&1 &
    KOMARI_PID=$!
    echo "$KOMARI_PID" > "$pid_file"
    sleep 1

    if kill -0 "$KOMARI_PID" 2>/dev/null; then
        echo "[Komari] 用户态探针已启动 PID: $KOMARI_PID"
        return 0
    fi

    echo "[Komari] 用户态启动失败"
    tail -n 20 "$komari_log_file" 2>/dev/null || true
    return 1
}

[ -n "$KOMARI_AUTO_DISCOVERY_TOKEN" ] || {
    echo "[错误] 未设置 KOMARI_AUTO_DISCOVERY_TOKEN"
    exit 1
}

is_valid_komari_endpoint "$KOMARI_ENDPOINT" || {
    echo "[错误] KOMARI_ENDPOINT 格式无效: $KOMARI_ENDPOINT"
    exit 1
}

[[ "$KOMARI_INSTALL_URL" =~ ^https://raw\.githubusercontent\.com/komari-monitor/komari-agent/[A-Za-z0-9._-]+/install\.sh$ ]] || {
    echo "[错误] 安装地址不受信任: $KOMARI_INSTALL_URL"
    exit 1
}

prepare_workdir

echo "[Komari] 开始安装，仅安装 Komari 探针..."

if bash <(curl --retry 3 --retry-delay 2 -fsSL "$KOMARI_INSTALL_URL") -e "$KOMARI_ENDPOINT" --auto-discovery "$KOMARI_AUTO_DISCOVERY_TOKEN"; then
    echo "[Komari] 官方安装脚本执行成功"
    exit 0
fi

echo "[Komari] 官方安装脚本执行失败，尝试用户态启动..."
start_komari_agent_rootless
