param(
  [string]$OutPath = (Join-Path (Split-Path $PSScriptRoot -Parent) "insertion-process-editable.pptx")
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path $PSScriptRoot -Parent
$buildDir = Join-Path $projectRoot ".pptx-build"
if (Test-Path $buildDir) {
  Remove-Item -LiteralPath $buildDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path `
  (Join-Path $buildDir "_rels"), `
  (Join-Path $buildDir "docProps"), `
  (Join-Path $buildDir "ppt"), `
  (Join-Path $buildDir "ppt\_rels"), `
  (Join-Path $buildDir "ppt\slides"), `
  (Join-Path $buildDir "ppt\slides\_rels"), `
  (Join-Path $buildDir "ppt\slideMasters"), `
  (Join-Path $buildDir "ppt\slideMasters\_rels"), `
  (Join-Path $buildDir "ppt\slideLayouts"), `
  (Join-Path $buildDir "ppt\slideLayouts\_rels"), `
  (Join-Path $buildDir "ppt\theme") | Out-Null

function Emu([double]$inches) {
  return [int64][Math]::Round($inches * 914400)
}

function Esc([string]$s) {
  return [System.Security.SecurityElement]::Escape($s)
}

function SolidFill([string]$hex) {
  if ([string]::IsNullOrWhiteSpace($hex) -or $hex -eq "none") {
    return "<a:noFill/>"
  }
  return "<a:solidFill><a:srgbClr val=`"$hex`"/></a:solidFill>"
}

function ShapeXml(
  [int]$id,
  [string]$name,
  [string]$geom,
  [double]$x,
  [double]$y,
  [double]$w,
  [double]$h,
  [string]$fill,
  [string]$line = "111111",
  [double]$lineWidth = 1,
  [double]$rot = 0,
  [string]$text = "",
  [int]$fontSize = 14,
  [bool]$bold = $false,
  [string]$fontColor = "111111",
  [string]$align = "ctr"
) {
  $rotAttr = ""
  if ($rot -ne 0) { $rotAttr = " rot=`"$([int][Math]::Round($rot * 60000))`"" }
  $fillXml = SolidFill $fill
  $lineXml = if ($line -eq "none") {
    "<a:ln><a:noFill/></a:ln>"
  } else {
    "<a:ln w=`"$([int][Math]::Round($lineWidth * 12700))`"><a:solidFill><a:srgbClr val=`"$line`"/></a:solidFill></a:ln>"
  }
  $txBody = "<p:txBody><a:bodyPr wrap=`"square`" anchor=`"mid`"/><a:lstStyle/><a:p><a:pPr algn=`"$align`"/><a:endParaRPr lang=`"en-US`"/></a:p></p:txBody>"
  if ($text.Length -gt 0) {
    $b = if ($bold) { " b=`"1`"" } else { "" }
    $txBody = @"
<p:txBody><a:bodyPr wrap="square" anchor="mid"/><a:lstStyle/><a:p><a:pPr algn="$align"/><a:r><a:rPr lang="en-US" sz="$($fontSize * 100)"$b><a:solidFill><a:srgbClr val="$fontColor"/></a:solidFill></a:rPr><a:t>$(Esc $text)</a:t></a:r></a:p></p:txBody>
"@
  }
  return @"
<p:sp>
  <p:nvSpPr><p:cNvPr id="$id" name="$(Esc $name)"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr>
    <a:xfrm$rotAttr><a:off x="$(Emu $x)" y="$(Emu $y)"/><a:ext cx="$(Emu $w)" cy="$(Emu $h)"/></a:xfrm>
    <a:prstGeom prst="$geom"><a:avLst/></a:prstGeom>
    $fillXml
    $lineXml
  </p:spPr>
  $txBody
</p:sp>
"@
}

function TextBoxXml([int]$id, [string]$name, [double]$x, [double]$y, [double]$w, [double]$h, [string]$text, [int]$fontSize = 16, [bool]$bold = $false, [string]$color = "111111", [string]$align = "l") {
  return ShapeXml $id $name "rect" $x $y $w $h "none" "none" 0 0 $text $fontSize $bold $color $align
}

function LineXml([int]$id, [string]$name, [double]$x, [double]$y, [double]$w, [double]$h, [string]$color = "666666", [double]$lineWidth = 2, [bool]$arrow = $true, [bool]$dash = $false) {
  $head = if ($arrow) { "<a:headEnd type=`"triangle`"/>" } else { "" }
  $dashXml = if ($dash) { "<a:prstDash val=`"dash`"/>" } else { "" }
  $x0 = $x
  $y0 = $y
  $ww = $w
  $hh = $h
  $flipH = ""
  $flipV = ""
  if ($ww -lt 0) {
    $x0 = $x + $ww
    $ww = -$ww
    $flipH = " flipH=`"1`""
  }
  if ($hh -lt 0) {
    $y0 = $y + $hh
    $hh = -$hh
    $flipV = " flipV=`"1`""
  }
  return @"
<p:cxnSp>
  <p:nvCxnSpPr><p:cNvPr id="$id" name="$(Esc $name)"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr>
  <p:spPr>
    <a:xfrm$flipH$flipV><a:off x="$(Emu $x0)" y="$(Emu $y0)"/><a:ext cx="$(Emu $ww)" cy="$(Emu $hh)"/></a:xfrm>
    <a:prstGeom prst="line"><a:avLst/></a:prstGeom>
    <a:ln w="$([int][Math]::Round($lineWidth * 12700))"><a:solidFill><a:srgbClr val="$color"/></a:solidFill>$dashXml$head</a:ln>
  </p:spPr>
</p:cxnSp>
"@
}

$script:shapeId = 10
function NextId() {
  $script:shapeId += 1
  return $script:shapeId
}

function AddSpring([double]$x, [double]$y, [double]$w, [double]$h, [string]$orientation = "vertical") {
  $xml = ""
  $turns = 9
  for ($i = 0; $i -lt $turns; $i++) {
    if ($orientation -eq "vertical") {
      $yy = $y + ($i * $h / $turns)
      $xml += LineXml (NextId) "vertical spring coil" ($x + $w * 0.20) $yy ($w * 0.60) ($h / $turns * 0.50) "333333" 1 $false $false
      $xml += LineXml (NextId) "vertical spring coil" ($x + $w * 0.80) ($yy + $h / $turns * 0.50) (-$w * 0.60) ($h / $turns * 0.50) "333333" 1 $false $false
    } else {
      $xx = $x + ($i * $w / $turns)
      $xml += LineXml (NextId) "horizontal spring coil" $xx ($y + $h * 0.20) ($w / $turns * 0.50) ($h * 0.60) "333333" 1 $false $false
      $xml += LineXml (NextId) "horizontal spring coil" ($xx + $w / $turns * 0.50) ($y + $h * 0.80) ($w / $turns * 0.50) (-$h * 0.60) "333333" 1 $false $false
    }
  }
  return $xml
}

function AddMechanismPanel([double]$x, [double]$y, [double]$w, [int]$step, [string]$heading, [string]$subheading, [string]$caption, [double]$greenX, [double]$blueLift = 0, [bool]$showUpArrow = $false, [bool]$contactArrow = $false) {
  $xml = ""
  $h = 1.78
  $xml += ShapeXml (NextId) "housing outer" "rect" $x $y $w $h "F6F7F7" "111111" 1.25
  $xml += ShapeXml (NextId) "upper chamber" "rect" ($x + 0.03) ($y + 0.03) ($w - 0.06) 0.72 "E7EAEC" "111111" 0.8
  $xml += LineXml (NextId) "middle rail" $x ($y + 0.88) $w 0 "111111" 1 $false $false
  $xml += ShapeXml (NextId) "left housing shade" "rect" ($x + 0.05) ($y + 0.07) ($w * 0.36) 0.62 "DDE1E3" "777777" 0.5
  $xml += ShapeXml (NextId) "right stop block" "parallelogram" ($x + $w - 0.92) ($y + 0.92) 0.62 0.26 "E7C51C" "111111" 1
  $xml += AddSpring ($x + $w - 0.78) ($y + 0.30) 0.57 0.26 "horizontal"

  $blueX = $x + 0.62
  $blueY = $y + 0.10 - $blueLift
  $xml += ShapeXml (NextId) "blue fixed button upper block" "rect" $blueX $blueY 0.46 0.60 "B8D8F0" "111111" 1
  $xml += ShapeXml (NextId) "blue fixed button slanted wedge" "parallelogram" ($blueX + 0.03) ($blueY + 0.59) 0.30 0.48 "87BCE4" "111111" 1 18
  $xml += ShapeXml (NextId) "blue pivot hole" "ellipse" ($blueX + 0.08) ($blueY + 0.86) 0.13 0.13 "B8D8F0" "111111" 1
  $xml += AddSpring ($blueX + 0.12) ($y + 0.09) 0.23 0.52 "vertical"

  $gY = $y + 1.23
  $xml += ShapeXml (NextId) "green sliding button body" "roundRect" ($x + $greenX) $gY 0.78 0.50 "68B85E" "111111" 1
  $xml += ShapeXml (NextId) "green sliding button peg" "roundRect" ($x + $greenX + 0.35) ($gY - 0.22) 0.12 0.24 "68B85E" "111111" 1

  if ($step -eq 1) {
    $xml += LineXml (NextId) "green approach arrow" ($x + 0.93) ($y + 1.59) -0.75 0 "2F8C3A" 2 $true $true
  } else {
    $xml += LineXml (NextId) "green motion arrow" ($x + $greenX + 0.25) ($y + 1.05) -0.48 0 "E23A22" 2 $true $false
  }
  if ($showUpArrow) {
    $xml += LineXml (NextId) "blue upward arrow" ($blueX + 0.24) ($y + 0.71) 0 -0.44 "E23A22" 2.2 $true $false
  }
  if ($contactArrow) {
    $xml += LineXml (NextId) "contact upward arrow" ($blueX + 0.22) ($y + 0.74) 0 -0.30 "E23A22" 1.8 $true $false
  }

  $xml += TextBoxXml (NextId) "step heading" ($x + 0.05) ($y - 0.62) ($w - 0.10) 0.22 "$step. $heading" 13 $true "111111" "ctr"
  $xml += TextBoxXml (NextId) "step subheading" ($x + 0.05) ($y - 0.39) ($w - 0.10) 0.22 $subheading 10 $false "111111" "ctr"
  $xml += TextBoxXml (NextId) "caption" ($x + 0.05) ($y + 1.98) ($w - 0.10) 0.54 $caption 10 $false "111111" "ctr"
  return $xml
}

$slideShapes = ""
$slideShapes += TextBoxXml (NextId) "title" 0.36 0.17 5.7 0.35 "Insertion Process (Step 1)" 24 $true
$slideShapes += TextBoxXml (NextId) "description 1" 0.36 0.72 8.6 0.22 "During insertion, the green sliding button moves to the left." 15 $false
$slideShapes += TextBoxXml (NextId) "description 2" 0.36 1.02 8.9 0.22 "It first contacts the wedge surface on the blue fixed button." 15 $false
$slideShapes += TextBoxXml (NextId) "description 3" 0.36 1.32 10.7 0.22 "This wedge pushes the blue button upward, compressing the vertical spring above it." 15 $false
$slideShapes += TextBoxXml (NextId) "description 4" 0.36 1.62 11.1 0.22 "Then the green button continues moving left, passing over the blue button, until it reaches the locked position shown in the last image." 15 $false

$panelY = 3.28
$panelW = 2.55
$gap = 0.29
$x1 = 0.24
$x2 = $x1 + $panelW + $gap
$x3 = $x2 + $panelW + $gap
$x4 = $x3 + $panelW + $gap

$slideShapes += AddMechanismPanel $x1 $panelY $panelW 1 "Start" "(Before insertion)" "Green button approaches from the right." 1.22 0 $false $false
$slideShapes += LineXml (NextId) "process arrow 1" ($x1 + $panelW + 0.06) ($panelY + 0.86) 0.19 0 "888888" 4 $true $false
$slideShapes += AddMechanismPanel $x2 $panelY $panelW 2 "Contact" "(Wedge engagement)" "The green button contacts the wedge surface of the blue button." 0.72 0 $false $true
$slideShapes += LineXml (NextId) "process arrow 2" ($x2 + $panelW + 0.06) ($panelY + 0.86) 0.19 0 "888888" 4 $true $false
$slideShapes += AddMechanismPanel $x3 $panelY $panelW 3 "Compress spring" "(Blue button moves up)" "The wedge pushes the blue button upward, compressing the vertical spring." 0.42 0.16 $true $false
$slideShapes += LineXml (NextId) "process arrow 3" ($x3 + $panelW + 0.06) ($panelY + 0.86) 0.19 0 "888888" 4 $true $false
$slideShapes += AddMechanismPanel $x4 $panelY $panelW 4 "Locked position" "(After passing over)" "The green button passes over the blue button and reaches the locked position." 0.22 0 $false $false

$legendY = 6.92
$slideShapes += ShapeXml (NextId) "legend box" "rect" 0.80 6.58 11.70 0.55 "FFFFFF" "BFBFBF" 0.8
$slideShapes += ShapeXml (NextId) "legend green" "roundRect" 1.02 $legendY 0.45 0.18 "68B85E" "111111" 1
$slideShapes += TextBoxXml (NextId) "legend green text" 1.55 6.83 1.70 0.30 "Green: Sliding Button" 12 $false
$slideShapes += ShapeXml (NextId) "legend blue upper" "rect" 4.10 ($legendY - 0.08) 0.32 0.22 "B8D8F0" "111111" 0.8
$slideShapes += ShapeXml (NextId) "legend blue wedge" "parallelogram" 4.13 ($legendY + 0.12) 0.22 0.22 "87BCE4" "111111" 0.8 18
$slideShapes += TextBoxXml (NextId) "legend blue text" 4.62 6.83 1.55 0.30 "Blue: Fixed Button" 12 $false
$slideShapes += ShapeXml (NextId) "legend yellow" "roundRect" 6.94 $legendY 0.45 0.18 "E7C51C" "111111" 1
$slideShapes += TextBoxXml (NextId) "legend yellow text" 7.58 6.83 1.55 0.30 "Yellow: Stop Block" 12 $false
$slideShapes += AddSpring 10.15 6.82 0.24 0.32 "vertical"
$slideShapes += TextBoxXml (NextId) "legend spring text" 10.62 6.83 1.20 0.30 "Vertical Spring" 12 $false

$slideXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      $slideShapes
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>
"@

$contentTypes = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>
"@

$rels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"@

$presentation = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle/>
</p:presentation>
"@

$presentationRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>
"@

$slideMaster = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>
"@

$slideMasterRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>
"@

$slideLayout = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>
"@

$slideLayoutRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>
"@

$slideRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>
"@

$theme = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Editable Mechanism Theme">
  <a:themeElements>
    <a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F2937"/></a:dk2><a:lt2><a:srgbClr val="F8FAFC"/></a:lt2><a:accent1><a:srgbClr val="2F80ED"/></a:accent1><a:accent2><a:srgbClr val="68B85E"/></a:accent2><a:accent3><a:srgbClr val="E7C51C"/></a:accent3><a:accent4><a:srgbClr val="E23A22"/></a:accent4><a:accent5><a:srgbClr val="87BCE4"/></a:accent5><a:accent6><a:srgbClr val="666666"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>
    <a:fontScheme name="Office"><a:majorFont><a:latin typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
  <a:objectDefaults/><a:extraClrSchemeLst/>
</a:theme>
"@

$core = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Insertion Process Editable Diagram</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-07-06T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-07-06T00:00:00Z</dcterms:modified>
</cp:coreProperties>
"@

$app = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft PowerPoint</Application>
  <PresentationFormat>On-screen Show (16:9)</PresentationFormat>
  <Slides>1</Slides>
  <ScaleCrop>false</ScaleCrop>
</Properties>
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
function WriteXml([string]$path, [string]$content) {
  [System.IO.File]::WriteAllText((Join-Path $buildDir $path), $content, $utf8NoBom)
}

WriteXml "[Content_Types].xml" $contentTypes
WriteXml "_rels\.rels" $rels
WriteXml "docProps\core.xml" $core
WriteXml "docProps\app.xml" $app
WriteXml "ppt\presentation.xml" $presentation
WriteXml "ppt\_rels\presentation.xml.rels" $presentationRels
WriteXml "ppt\slides\slide1.xml" $slideXml
WriteXml "ppt\slides\_rels\slide1.xml.rels" $slideRels
WriteXml "ppt\slideMasters\slideMaster1.xml" $slideMaster
WriteXml "ppt\slideMasters\_rels\slideMaster1.xml.rels" $slideMasterRels
WriteXml "ppt\slideLayouts\slideLayout1.xml" $slideLayout
WriteXml "ppt\slideLayouts\_rels\slideLayout1.xml.rels" $slideLayoutRels
WriteXml "ppt\theme\theme1.xml" $theme

if (Test-Path $OutPath) {
  Remove-Item -LiteralPath $OutPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($buildDir, $OutPath)
Write-Host "Created $OutPath"
