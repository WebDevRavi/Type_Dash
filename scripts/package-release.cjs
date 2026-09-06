const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.resolve(__dirname, '..', 'dist');
const zipFile = path.resolve(__dirname, '..', 'typerusher_crazygames_release.zip');

if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

// Generate PowerShell script to create ZIP with POSIX forward-slash paths
const psScript = `
Add-Type -AssemblyName System.IO.Compression;
Add-Type -AssemblyName System.IO.Compression.FileSystem;
$d = [System.IO.Path]::GetFullPath('${distDir.replace(/'/g, "''")}');
$z = [System.IO.Path]::GetFullPath('${zipFile.replace(/'/g, "''")}');
$archive = [System.IO.Compression.ZipFile]::Open($z, [System.IO.Compression.ZipArchiveMode]::Create);
$files = [System.IO.Directory]::GetFiles($d, '*', [System.IO.SearchOption]::AllDirectories);
foreach ($file in $files) {
    $entryName = $file.Substring($d.Length + 1).Replace([char]92, [char]47);
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file, $entryName);
}
$archive.Dispose();
`;

execSync(`powershell -NoProfile -Command "${psScript.replace(/\r?\n/g, ' ')}"`, { stdio: 'inherit' });

console.log('Successfully created production release archive: typerusher_crazygames_release.zip');
