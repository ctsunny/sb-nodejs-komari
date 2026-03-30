process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '1';

const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');

const LOCAL_PANEL_PORT = '';
const LOCAL_KOMARI_ENDPOINT = 'https://komari.example.com';
const LOCAL_KOMARI_TOKEN = '';
const LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN = '';
const MAX_LOG_DISPLAY_LENGTH = 15000;

const ENDPOINT = process.env.KOMARI_ENDPOINT || LOCAL_KOMARI_ENDPOINT;
const TOKEN = process.env.KOMARI_TOKEN || LOCAL_KOMARI_TOKEN;
const AUTO_DISCOVERY_TOKEN = process.env.KOMARI_AUTO_DISCOVERY_TOKEN || LOCAL_KOMARI_AUTO_DISCOVERY_TOKEN;
const PORT = getPanelPort();

let workDir = path.join(__dirname, '.npm');
try {
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir, { recursive: true });
  }
} catch (error) {
  workDir = path.join(os.tmpdir(), '.npm-komari');
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir, { recursive: true });
  }
}

const logPath = path.join(workDir, 'agent.log');
let agentStatus = '准备启动';

function getPanelPort() {
  const rawPort = process.env.PORT || process.env.SERVER_PORT || LOCAL_PANEL_PORT || '8080';
  const port = String(rawPort).trim().split(/[\s,]+/)[0];
  return /^\d{1,5}$/.test(port) ? port : '8080';
}

function isValidEndpoint(endpoint) {
  return /^https?:\/\/[A-Za-z0-9.-]+(?::\d{1,5})?(?:\/[^<>"\s]*)?$/.test(endpoint);
}

function getPlatformInfo() {
  const platformMap = {
    linux: 'linux',
    darwin: 'darwin',
    freebsd: 'freebsd',
  };
  const archMap = {
    x64: 'amd64',
    arm64: 'arm64',
    ia32: '386',
    arm: 'arm',
  };

  return {
    os: platformMap[os.platform()] || os.platform(),
    arch: archMap[os.arch()] || os.arch(),
  };
}

function appendLog(message) {
  try {
    fs.appendFileSync(logPath, message);
  } catch (error) {
    console.error(`[Panel] 写入日志失败: ${error.message}`);
  }
}

function requestText(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let text = '';
      res.on('data', (chunk) => {
        text += chunk;
      });
      res.on('end', () => {
        resolve(text.trim());
      });
    });

    req.on('error', () => {
      resolve('未知 (网络无法访问 api.ipify.org)');
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve('未知 (获取公网 IP 超时)');
    });
  });
}

function getPublicIP() {
  return requestText('https://api.ipify.org');
}

function cleanOldTasks() {
  try {
    for (const file of fs.readdirSync(workDir)) {
      if (file.startsWith('task_')) {
        try {
          fs.unlinkSync(path.join(workDir, file));
        } catch (error) {
          console.error(`[Panel] 清理旧文件失败: ${error.message}`);
        }
      }
    }

    fs.writeFileSync(logPath, '');
  } catch (error) {
    console.error(`[Panel] 初始化工作目录失败: ${error.message}`);
  }
}

function downloadFileStrongly(url, dest, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith('http://') ? require('http') : https;
    const req = transport.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirectsLeft <= 0) {
          reject(new Error('下载失败，重定向次数过多'));
          return;
        }

        downloadFileStrongly(res.headers.location, dest, redirectsLeft - 1).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`下载失败，状态码: ${res.statusCode}`));
        return;
      }

      const dataChunks = [];
      res.on('data', (chunk) => {
        dataChunks.push(chunk);
      });
      res.on('end', () => {
        try {
          fs.writeFileSync(dest, Buffer.concat(dataChunks));
          fs.chmodSync(dest, 0o755);
          resolve();
        } catch (error) {
          reject(new Error(`写入文件失败: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy(new Error('下载超时'));
    });
  });
}

function safeSpawn(bin, args, options) {
  let child;

  try {
    child = spawn(bin, args, options);
  } catch (error) {
    const message = `\n[Panel] 进程致命异常: ${error.message}\n`;
    appendLog(message);
    console.error(message);
    agentStatus = '启动失败';
    return null;
  }

  if (child.stdout) {
    child.stdout.on('data', (data) => {
      const output = data.toString();
      appendLog(output);
      console.log(`[Agent] ${output.trim()}`);
    });
  }

  if (child.stderr) {
    child.stderr.on('data', (data) => {
      const output = data.toString();
      appendLog(output);
      console.error(`[Agent 报错] ${output.trim()}`);
    });
  }

  child.on('error', (error) => {
    const message = `\n[Panel] 异步启动异常: ${error.message}\n`;
    appendLog(message);
    console.error(message);
    agentStatus = '启动失败';
  });

  child.on('exit', (code, signal) => {
    const message = `\n[Panel] 探针进程已退出! Exit Code: ${code}, Signal: ${signal}\n`;
    appendLog(message);
    console.log(message);
    agentStatus = `已退出 (状态码: ${code}, 信号: ${signal})`;
  });

  if (child.pid) {
    console.log(`[Web Panel] 核心探针已投入运行 (PID: ${child.pid})。`);
    agentStatus = '运行中';
  }

  try {
    child.unref();
  } catch (error) {
    console.error(`[Panel] 解除引用失败: ${error.message}`);
  }

  return child;
}

async function startAgent() {
  if (!TOKEN && !AUTO_DISCOVERY_TOKEN) {
    agentStatus = '缺少 token';
    appendLog('[Panel] 未设置 KOMARI_TOKEN 或 KOMARI_AUTO_DISCOVERY_TOKEN\n');
    return;
  }

  if (!isValidEndpoint(ENDPOINT)) {
    agentStatus = '配置错误';
    appendLog(`[Panel] KOMARI_ENDPOINT 格式无效: ${ENDPOINT}\n`);
    return;
  }

  const platformInfo = getPlatformInfo();
  const downloadUrl = `https://github.com/komari-monitor/komari-agent/releases/latest/download/komari-agent-${platformInfo.os}-${platformInfo.arch}`;

  cleanOldTasks();

  const uniqueName = `task_${Date.now()}`;
  const agentPath = path.join(workDir, uniqueName);

  console.log('[网络信息] 正在获取公网 IP...');
  const ip = await getPublicIP();

  console.log('===============================================');
  console.log(`[网络信息] 节点公网 IP 地址: ${ip}`);
  console.log(`[网络信息] 节点面板监听端口: ${PORT}`);
  console.log(`[网络信息] 主控面板对接地址: ${ENDPOINT}`);
  console.log('===============================================');

  const args = ['-e', ENDPOINT];
  if (TOKEN) {
    args.push('-t', TOKEN);
  } else {
    args.push('--auto-discovery', AUTO_DISCOVERY_TOKEN);
  }

  try {
    console.log('[Web Panel] 开始下载探针...');
    await downloadFileStrongly(downloadUrl, agentPath);
    appendLog(`[Panel] 环境检测: ${platformInfo.os}-${platformInfo.arch}\n[Panel] 准备启动二进制文件: ${uniqueName}\n`);

    const env = {
      ...process.env,
      GOMAXPROCS: process.env.GOMAXPROCS || '1',
      CGO_ENABLED: process.env.CGO_ENABLED || '0',
      GODEBUG: process.env.GODEBUG || 'netdns=go,asyncpreemptoff=1',
    };

    console.log('[Web Panel] 极简线程内核挂载完成，正在追踪输出信号：\n-----------------------------------------------');
    safeSpawn(agentPath, args, {
      cwd: workDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const message = `\n[Panel] 外部配置报错: ${error.message}\n`;
    appendLog(message);
    console.error(message);
    agentStatus = '启动失败';
  }
}

const server = http.createServer((req, res) => {
  let text = '=========== Komari 控制台面板 ===========\n';
  text += `探针对接: ${ENDPOINT}\n`;
  text += `底端状态: ${agentStatus}\n`;
  text += '------------------------------------------\n';
  text += '【探针底层真实输出跟踪】\n\n';

  if (fs.existsSync(logPath)) {
    const logs = fs.readFileSync(logPath, 'utf8');
    text += logs ? logs.slice(-MAX_LOG_DISPLAY_LENGTH) : '监控引擎尚无标准输出返回...';
  } else {
    text += '引擎挂载准备中...';
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Web Panel] 系统唤醒成功，端口: ${PORT}`);
  startAgent();
});
