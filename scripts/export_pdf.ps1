$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = 'C:\Users\lenovo\Desktop\DineIQ\DineIQ_Complete_Documentation_Final.docx'
$pdfPath = 'C:\Users\lenovo\Desktop\DineIQ\DineIQ_Complete_Documentation_Final.pdf'

try {
    Write-Host "Opening document: $docPath..."
    $doc = $word.Documents.Open($docPath)
    Write-Host "Exporting to PDF: $pdfPath..."
    $doc.ExportAsFixedFormat($pdfPath, 17) # 17 = wdExportFormatPDF
    Write-Host "Export finished."
    $doc.Close([ref]$false)
    Write-Host "Closed document."
} catch {
    Write-Error $_
} finally {
    $word.Quit([ref]$false)
    Write-Host "Word application closed."
}
