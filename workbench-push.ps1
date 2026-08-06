# workbench-push.ps1 - Auto sync Ailis workbench to GitHub public repo via SSH
# =====================================================================
# 用途：把工作平台（index.html + reports/）自动推送到 GitHub 公开仓库
#       （git@github.com:Ailis97/ailis-workbench.git），免费 GitHub Pages 公网查看。
# 与 sync-workbuddy.ps1 独立 — 那个同步 skills/experts/.mcp.json 等 WorkBuddy 配置。
#
# 设计目标（供 WorkBuddy 自动化直接调用，无需人工干预）：
#   1. 幂等：没有改动时跳过 commit（不报错）
#   2. 防并发：互斥锁，避免多个自动化同时 push 冲突
#   3. 绝不用 stash：stash+rebase+pop 在 Windows 冲突时会留下 AUTO_MERGE/index.lock
#      导致仓库损坏（2026-08-05 实际故障根因）。改为：只 add -> commit ->
#      pull --rebase（失败仅警告）-> push（失败重试）。
#   4. SSH 用 StrictHostKeyChecking=accept-new + 真实 known_hosts 路径，
#      不用 UserKnownHostsFile=NUL（Windows 下会创建名为 NUL 的文件，实测踩坑）
#   5. 全程日志：C:\Users\bingy\wb-sync\workbench-push.log
#
# 用法（PowerShell）：
#   .\workbench-push.ps1 -Action push    # 提交并推送（自动化默认调用）
#   .\workbench-push.ps1 -Action pull    # 从 GitHub 拉取最新

param(
    [ValidateSet("push","pull")][string]$Action = "push"
)

# --- CONFIG ---
$RepoUrl = "git@github.com:Ailis97/ailis-workbench.git"
$RepoDir = "$env:USERPROFILE\wb-sync\wb-repo"
$WbDir   = $RepoDir
$LogFile = "$env:USERPROFILE\wb-sync\workbench-push.log"

function Write-Log([string]$msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
    Write-Output $line
    try { Add-Content -Path $LogFile -Value $line -Encoding UTF8 } catch {}
}

# --- Find git executable ---
$GitPath = $null
$pathGit = Get-Command git -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if ($pathGit) { $GitPath = $pathGit }

$candidates = @(
    "$env:USERPROFILE\.workbuddy\vendor\PortableGit\mingw64\bin\git.exe",
    "$env:USERPROFILE\.workbuddy\vendor\PortableGit\bin\git.exe",
    "$env:ProgramFiles\Git\mingw64\bin\git.exe",
    "$env:ProgramFiles\Git\bin\git.exe",
    "$env:ProgramFiles\Git\cmd\git.exe",
    "${env:ProgramFiles(x86)}\Git\mingw64\bin\git.exe",
    "${env:ProgramFiles(x86)}\Git\bin\git.exe",
    "${env:ProgramFiles(x86)}\Git\cmd\git.exe"
)
foreach ($c in $candidates) {
    if (-not $GitPath -and (Test-Path $c)) { $GitPath = $c; break }
}

if (-not $GitPath) {
    Write-Log "ERROR: git.exe not found."
    exit 1
}

$GitDir = Split-Path $GitPath -Parent
if ($env:PATH -notlike "*$GitDir*") { $env:PATH = "$GitDir;$env:PATH" }

# --- SSH: use real known_hosts path (NOT NUL, which creates a stray file on Windows) ---
$sshKey = "$env:USERPROFILE\.ssh\id_ed25519"
$knownHosts = "$env:USERPROFILE\.ssh\known_hosts"
$SshCmd = "ssh -i `"$sshKey`" -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=`"$knownHosts`""
$env:GIT_SSH_COMMAND = $SshCmd
$GitArgs = @("-c","core.sshCommand=$SshCmd","-c","http.timeout=30")

function Invoke-Git([array]$Params) {
    & $GitPath @GitArgs @Params 2>&1
}

function Ensure-Repo {
    # .git 有效则直接返回；无效则先改名备份（绝不删除用户数据），再全新 clone
    $valid = $false
    if (Test-Path "$RepoDir\.git") {
        $headFile = "$RepoDir\.git\HEAD"
        if (Test-Path $headFile) {
            $headContent = (Get-Content $headFile -Raw -ErrorAction SilentlyContinue)
            if ($headContent -match "ref:") { $valid = $true }
        }
    }
    if ($valid) {
        $currentUrl = (Invoke-Git -Params @("-C",$RepoDir,"config","--get","remote.origin.url") | Out-String).Trim()
        if ($currentUrl -and $currentUrl -ne $RepoUrl) {
            Write-Log "Switching remote from [$currentUrl] to SSH..."
            Invoke-Git -Params @("-C",$RepoDir,"remote","set-url","origin",$RepoUrl) | Out-Null
        }
        $gitName = Invoke-Git -Params @("-C",$RepoDir,"config","user.name")
        if ([string]::IsNullOrWhiteSpace($gitName)) {
            Invoke-Git -Params @("-C",$RepoDir,"config","user.name","Ailis") | Out-Null
        }
        $gitEmail = Invoke-Git -Params @("-C",$RepoDir,"config","user.email")
        if ([string]::IsNullOrWhiteSpace($gitEmail)) {
            Invoke-Git -Params @("-C",$RepoDir,"config","user.email","workbuddy-sync@local") | Out-Null
        }
        # 确保 main 有 upstream（新 init/fetch 的仓库没有跟踪信息会导致 pull 失败）
        $branch = (Invoke-Git -Params @("-C",$RepoDir,"rev-parse","--abbrev-ref","HEAD") | Out-String).Trim()
        if ($branch) {
            Invoke-Git -Params @("-C",$RepoDir,"branch","--set-upstream-to=origin/$branch",$branch) | Out-Null
        }
        # 清理可能残留的死锁（之前 stash 并发故障留下 index.lock 会卡死所有 git 命令）
        $lockFile = "$RepoDir\.git\index.lock"
        if (Test-Path $lockFile) {
            Remove-Item $lockFile -Force -Confirm:$false -ErrorAction SilentlyContinue
            Write-Log "Cleaned stale index.lock (previous crash residue)"
        }
        return
    }
    # .git 缺失或无效：备份目录（改名，不删除），再 clone
    if (Test-Path $RepoDir) {
        $backup = "$RepoDir.broken-$(Get-Date -Format yyyyMMddHHmmss)"
        try {
            Rename-Item $RepoDir $backup -Force -ErrorAction Stop
            Write-Log "Invalid repo dir moved to $backup (data preserved)"
        } catch {
            Write-Log "WARN: could not rename repo dir; will attempt in-place recovery"
        }
    }
    Write-Log "Cloning repo via SSH..."
    Invoke-Git -Params @("clone",$RepoUrl,$RepoDir) | Out-Null
    if (-not (Test-Path "$RepoDir\.git")) {
        Write-Log "ERROR: Clone failed. Check SSH key / network / repo URL."
        exit 1
    }
    Write-Log "Clone OK."
}

# --- 互斥锁：防止与其他推送进程并发冲突 ---
$lock = New-Object System.Threading.Mutex($false, "Local\WorkbenchPushAilis")
$lockAcquired = $lock.WaitOne(120000)   # 最多等 2 分钟
if (-not $lockAcquired) {
    Write-Log "SKIP: another push in progress (lock timeout 120s). Will be picked up on next run."
    exit 0
}

try {
    Ensure-Repo

    if ($Action -eq "push") {
        if (-not (Test-Path $WbDir)) {
            New-Item -ItemType Directory -Path $WbDir -Force | Out-Null
            Write-Log "Created repo dir (was missing)."
        }

        $ts = Get-Date -Format "yyyy-MM-dd HH:mm"

        # --- 1. 只暂存白名单文件（绝不 add -A，防止临时脚本/隐私文件混入公开仓库） ---
        Invoke-Git -Params @("-C",$RepoDir,"add","--","index.html","README.md",".gitignore","workbench-push.ps1",".github","reports/fx","reports/news","reports/industries") | Out-Null

        # --- 2. 有改动则 commit，无改动则跳过（幂等） ---
        $diff = Invoke-Git -Params @("-C",$RepoDir,"diff","--cached","--stat")
        if ($diff) {
            Invoke-Git -Params @("-C",$RepoDir,"commit","-m","workbench auto-sync $ts") | Out-Null
            Write-Log "Committed workbench changes ($ts)."
        } else {
            Write-Log "No workbench changes to commit (idempotent skip)."
        }

        # --- 3. pull --rebase：对齐远端（失败仅警告，不破坏仓库） ---
        Invoke-Git -Params @("-C",$RepoDir,"pull","--rebase") | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Log "WARN: pull --rebase non-zero exit ($LASTEXITCODE); continuing to push attempt."
        }

        # --- 4. push，失败则 pull 重试（最多 3 次） ---
        $branch = (Invoke-Git -Params @("-C",$RepoDir,"rev-parse","--abbrev-ref","HEAD") | Out-String).Trim()
        $pushOk = $false
        for ($i = 1; $i -le 3; $i++) {
            Invoke-Git -Params @("-C",$RepoDir,"push","origin",$branch) | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $pushOk = $true
                break
            }
            Write-Log "push attempt $i failed (exit $LASTEXITCODE), pull --rebase and retry..."
            Invoke-Git -Params @("-C",$RepoDir,"pull","--rebase") | Out-Null
            Start-Sleep -Seconds 2
        }
        if ($pushOk) {
            Write-Log "PUSH OK -> origin/$branch"
        } else {
            Write-Log "ERROR: PUSH FAILED after 3 attempts. Check SSH key and network."
            exit 1
        }
    } elseif ($Action -eq "pull") {
        Write-Log "[pull] Fetching latest workbench/ from GitHub..."
        Invoke-Git -Params @("-C",$RepoDir,"pull","--rebase") | Out-Null
        Write-Log "[pull] DONE. Open workbench/index.html in browser."
    }
}
finally {
    try { $lock.ReleaseMutex() } catch {}
}
