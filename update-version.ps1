# 自动更新CSS版本号的PowerShell脚本
# 使用方法: .\update-version.ps1

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$indexFile = "index.html"

# 读取index.html文件
$content = Get-Content $indexFile -Raw

# 使用正则表达式替换CSS文件的版本号
$newContent = $content -replace 'style\.css\?v=[^"]*', "style.css?v=$timestamp"

# 如果没有版本号，则添加版本号
if ($content -notmatch 'style\.css\?v=') {
    $newContent = $newContent -replace 'style\.css', "style.css?v=$timestamp"
}

# 写回文件
Set-Content $indexFile $newContent -NoNewline

Write-Host "CSS版本号已更新为: $timestamp" -ForegroundColor Green
Write-Host "请刷新浏览器查看更改" -ForegroundColor Yellow
