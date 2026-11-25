<#
  DYSE · Gera os áudios das atividades com a ElevenLabs
  --------------------------------------------------------------
  Lê todas as atividades (atividades/praticas/<nivel>/aula-NN/atividade_N.html),
  lista as frases que o motor fala (usando o próprio praticas.js, no Chrome
  headless, para os nomes de arquivo baterem) e gera só os MP3s que faltam em
  atividades/praticas/audio/. No fim, reescreve audio/manifest.js.

  Uso (PowerShell, na raiz do projeto):
    .\scripts\gerar-audios.ps1 -SoListar            # só mostra o que falta e quantos caracteres gasta
    $env:ELEVENLABS_API_KEY = 'sua-chave'           # chave da ElevenLabs (não salvar em arquivo)
    .\scripts\gerar-audios.ps1                       # gera o que falta

  Vozes: f = Bella (feminina), m = Chris (masculina) — americanas, padrão da ElevenLabs.
#>
param(
  [string]$Nivel = '',          # vazio = todos os níveis
  [switch]$SoListar,
  [switch]$Fila                 # grava atividades/praticas/audio/fila.json (todas as frases) e para
)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$prat = Join-Path $raiz 'atividades\praticas'
$audioDir = Join-Path $prat 'audio'
$VOZES = @{ f = 'hpp4J3VqNfWAUOO0d1Us'; m = 'iP95p4xoKVk53GoZ742B' }
$MODELO = 'eleven_multilingual_v2'

# ---------- 1) Lista de frases (via Chrome headless) ----------
$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if(-not $chrome){ throw 'Não encontrei Chrome nem Edge.' }

$tmp = Join-Path $env:TEMP ('dyse-audios-' + [guid]::NewGuid())
New-Item -ItemType Directory $tmp | Out-Null
$sb = New-Object System.Text.StringBuilder
[void]$sb.Append('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre id="o"></pre>')
foreach($f in 'catalogo.js', 'praticas.js'){
  [void]$sb.Append('<script>' + [IO.File]::ReadAllText((Join-Path $prat $f)) + '</script>')
}
[void]$sb.Append('<script>window.__L=[];DysePratica.iniciar=function(c){window.__L.push.apply(window.__L, DysePratica._audios(c));};</script>')
$pasta = if($Nivel){ Join-Path $prat $Nivel } else { $prat }
$arquivos = Get-ChildItem $pasta -Recurse -Filter 'atividade_*.html'
foreach($a in $arquivos){
  $html = [IO.File]::ReadAllText($a.FullName)
  $m = [regex]::Matches($html, '(?s)<script>\r?\n(.*?)</script>')
  if($m.Count){ [void]$sb.Append('<script>(function(){' + $m[$m.Count - 1].Groups[1].Value + '})();</script>') }
}
[void]$sb.Append('<script>document.getElementById("o").textContent=JSON.stringify(window.__L);</script></body></html>')
$pagina = Join-Path $tmp 'lista.html'
[IO.File]::WriteAllText($pagina, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))

# O Chrome escreve avisos no stderr; no PowerShell 5.1 isso vira erro com "Stop".
$ErrorActionPreference = 'Continue'
$saida = & $chrome --headless=new --disable-gpu "--user-data-dir=$tmp\perfil" --dump-dom ('file:///' + ($pagina -replace '\\', '/')) 2>$null | Out-String
$ErrorActionPreference = 'Stop'
Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
$mm = [regex]::Match($saida, '(?s)<pre id="o">(.*?)</pre>')
if(-not $mm.Success){ throw 'Não consegui listar as frases (Chrome headless).' }
$lista = [System.Net.WebUtility]::HtmlDecode($mm.Groups[1].Value) | ConvertFrom-Json

$unicas = @{}
foreach($x in $lista){ if($x.texto -and -not $unicas.ContainsKey($x.chave)){ $unicas[$x.chave] = $x } }
$faltam = @($unicas.Values | Where-Object { -not (Test-Path (Join-Path $audioDir ($_.chave + '.mp3'))) })
$chars = ($faltam | ForEach-Object { $_.texto.Length } | Measure-Object -Sum).Sum
Write-Host ("Atividades lidas: {0} · frases únicas: {1} · faltam gerar: {2} ({3} caracteres)" -f $arquivos.Count, $unicas.Count, $faltam.Count, [int]$chars)

if($Fila){
  # Lista usada pela página /atividades/praticas/gerar-audios.html (gera pelo servidor, com a chave da Vercel).
  New-Item -ItemType Directory -Force $audioDir | Out-Null
  $itens = $unicas.Values | Sort-Object chave | ForEach-Object { [ordered]@{ t = $_.texto; v = $_.voz; c = $_.chave } }
  $json = ConvertTo-Json -InputObject @($itens) -Compress -Depth 3
  [IO.File]::WriteAllText((Join-Path $audioDir 'fila.json'), $json, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host ("fila.json: {0} frases" -f @($itens).Count)
  return
}

if($SoListar){
  $faltam | Sort-Object chave | ForEach-Object { Write-Host ("  [{0}] {1}" -f $_.voz, $_.texto) }
  return
}

# ---------- 2) Gera os que faltam ----------
if($faltam.Count){
  $chave = $env:ELEVENLABS_API_KEY
  if(-not $chave){ throw 'Defina $env:ELEVENLABS_API_KEY antes de gerar.' }
  New-Item -ItemType Directory -Force $audioDir | Out-Null
  $i = 0
  foreach($x in $faltam){
    $i++
    $corpo = @{ text = $x.texto; model_id = $MODELO; voice_settings = @{ stability = 0.55; similarity_boost = 0.75 } } | ConvertTo-Json -Compress
    $url = 'https://api.elevenlabs.io/v1/text-to-speech/' + $VOZES[$x.voz] + '?output_format=mp3_44100_64'
    $destino = Join-Path $audioDir ($x.chave + '.mp3')
    try{
      Invoke-WebRequest -Uri $url -Method Post -Headers @{ 'xi-api-key' = $chave } -ContentType 'application/json; charset=utf-8' `
        -Body ([Text.Encoding]::UTF8.GetBytes($corpo)) -OutFile $destino -UseBasicParsing | Out-Null
      Write-Host ("  {0}/{1} ok  [{2}] {3}" -f $i, $faltam.Count, $x.voz, $x.texto)
    } catch {
      if(Test-Path $destino){ Remove-Item $destino -Force }
      Write-Host ("  {0}/{1} ERRO [{2}] {3} -> {4}" -f $i, $faltam.Count, $x.voz, $x.texto, $_.Exception.Message) -ForegroundColor Red
      if($_.Exception.Message -match '401|quota|402'){ break }
    }
  }
}

# ---------- 3) Reescreve o manifesto com o que existe na pasta ----------
$existentes = Get-ChildItem $audioDir -Filter '*.mp3' -ErrorAction SilentlyContinue | ForEach-Object { '"' + $_.BaseName + '":1' }
$js = "/* Gerado por scripts/gerar-audios.ps1 — não editar à mão. */`nwindow.DYSE_AUDIOS = {" + ($existentes -join ',') + "};`n"
[IO.File]::WriteAllText((Join-Path $audioDir 'manifest.js'), $js, (New-Object System.Text.UTF8Encoding($false)))
Write-Host ("Manifesto atualizado: {0} áudios." -f @($existentes).Count)
