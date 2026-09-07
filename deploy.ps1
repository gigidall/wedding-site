$ftpHost = "ftp://ftp.weddingmauroantonella.altervista.org"
$ftpUser = "weddingmauroantonella"
$ftpPass = "B2KpzYUjUp4N"

$sourceDir = "c:\devRS\wedding-site"
$itemsToUpload = @("index.html", "risposte.html", "honeymoon", "style.css", "script.js", "api.php")#, "data", "assets")

function Upload-Ftp {
    param (
        [string]$localPath,
        [string]$remotePath
    )

    if (Test-Path $localPath -PathType Leaf) {
        Write-Host "Uploading: $($localPath.Replace($sourceDir, '')) -> $remotePath"
        try {
            $request = [System.Net.FtpWebRequest]::Create($remotePath)
            $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
            $request.UsePassive = $true
            $request.UseBinary = $true
            $request.KeepAlive = $false

            $content = [System.IO.File]::ReadAllBytes($localPath)
            $request.ContentLength = $content.Length

            $requestStream = $request.GetRequestStream()
            $requestStream.Write($content, 0, $content.Length)
            $requestStream.Close()

            $response = $request.GetResponse()
            $response.Close()
        } catch {
            Write-Host "[-] Failed to upload $localPath : $_" -ForegroundColor Red
        }
    } elseif (Test-Path $localPath -PathType Container) {
        # Create remote dir
        try {
            $request = [System.Net.FtpWebRequest]::Create($remotePath)
            $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
            $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
            $request.UsePassive = $true
            $response = $request.GetResponse()
            $response.Close()
        } catch {
            # Usually fails if directory already exists, ignore
        }

        # Recursive call
        Get-ChildItem -Path $localPath | ForEach-Object {
            if ($_.Name -eq "images_upload") { return }
            $newLocal = $_.FullName
            $newRemote = "$remotePath/$($_.Name)"
            Upload-Ftp -localPath $newLocal -remotePath $newRemote
        }
    }
}

Write-Host "Inizio caricamento su Altervista..." -ForegroundColor Cyan
foreach ($item in $itemsToUpload) {
    $local = Join-Path $sourceDir $item
    $remote = "$ftpHost/$item"
    if (Test-Path $local) {
        Upload-Ftp -localPath $local -remotePath $remote
    } else {
        Write-Host "[-] Non trovato: $local" -ForegroundColor Yellow
    }
}
Write-Host "Caricamento completato!" -ForegroundColor Green
