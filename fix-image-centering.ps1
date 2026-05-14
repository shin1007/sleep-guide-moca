# キャラクター画像の中央配置を修正するスクリプト
# 問題：-trim + -gravity center で左右の配置がずれることがある
# 解決策：-trim 後に色情報を抽出し、左右に均等にパディングして 1979px に拡張

$backupDir = ".\public\standing\psd\backup_originals"
$outputDir = ".\public\standing\psd"

# 処理対象：全24ファイル
$files = @()
for ($i = 1; $i -le 24; $i++) {
    $files += (Get-Item "$backupDir\moca-stand-$($i.ToString('00')).png" -ErrorAction SilentlyContinue)
}

Write-Host "Found $($files.Count) files to process"

foreach ($file in $files) {
    $name = $file.Name
    $inputPath = $file.FullName
    $outputPath = Join-Path $outputDir $name
    
    # 新しいパイプライン：
    # 1. -trim で余白を削除
    # 2. -background none で背景を透過に
    # 3. -gravity center で中央に配置
    # 4. -extent で 1979x1687 に拡張（周りに透過が追加される）
    
    $cmd = @(
        "convert"
        $inputPath
        "-trim"
        "-crop", "1979x1687+0+0"
        "+repage"
        "-background", "none"
        "-gravity", "north"
        "-extent", "1979x1687"
        $outputPath
    )
    
    Write-Host "Processing: $name ..."
    & magick @cmd
    
    if ($?) {
        Write-Host "  ✓ Done"
    } else {
        Write-Host "  ✗ Error"
    }
}

Write-Host "`nAll done!"
