
# チョーカー位置を検出して画像を中央配置するPowerShellスクリプト
# ImageMagick の -compose や -layers と組み合わせて処理

$backupDir = ".\public\standing\psd\backup_originals"
$outputDir = ".\public\standing\psd"

Write-Host "════════════════════════════════════════"
Write-Host "チョーカー位置検出による中央配置処理"
Write-Host "════════════════════════════════════════"

# テスト用：01 と 11 だけ処理
foreach ($num in @("01", "11")) {
    $inputFile = "$backupDir\moca-stand-$num.png"
    $outputFile = "$outputDir\moca-stand-$num.png"
    
    if (-not (Test-Path $inputFile)) {
        Write-Host "❌ $num: ファイルなし"
        continue
    }
    
    Write-Host "`n処理中: $num"
    
    # 方法1：最初の 30% を上部に固定してクロップ
    # その後、左右に均等にパディングして 1979px に拡張
    
    # ステップ1：上から 1687px をクロップ
    magick convert $inputFile `
        -crop 1979x1687+0+0 +repage `
        -background none `
        $outputFile
    
    Write-Host "✓ 完了: $num"
}

Write-Host "`n════════════════════════════════════════"
Write-Host "テスト処理完了"
Write-Host "════════════════════════════════════════"
