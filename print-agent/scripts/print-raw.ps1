# Sends the raw ESC/POS bytes in $FilePath straight to $PrinterName's Windows
# print queue via the Win32 spooler API (RAW datatype) — the same underlying
# mechanism the printer's own driver uses when you print a document, just
# invoked directly so kitchen tickets can be sent as raw commands instead of
# a text/PDF page. Built entirely on .NET/PowerShell primitives that ship
# with Windows, so no compiler or extra install is needed on the restaurant PC.
param(
    [Parameter(Mandatory = $true)][string]$PrinterName,
    [Parameter(Mandatory = $true)][string]$FilePath
)

$ErrorActionPreference = 'Stop'

$source = @"
using System;
using System.Runtime.InteropServices;

namespace DfcPrintAgent {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    public struct DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    public class RawPrinter {
        [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
        public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool ClosePrinter(IntPtr hPrinter);

        [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
        public static extern bool StartDocPrinter(IntPtr hPrinter, int level, ref DOCINFOA pDocInfo);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool EndDocPrinter(IntPtr hPrinter);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool StartPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool EndPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool WritePrinter(IntPtr hPrinter, byte[] pBytes, int dwCount, out int dwWritten);
    }
}
"@

Add-Type -TypeDefinition $source -ErrorAction Stop

if (-not (Get-Printer -Name $PrinterName -ErrorAction SilentlyContinue)) {
    [Console]::Error.WriteLine("Printer '$PrinterName' was not found in Windows. Check the exact name in Settings > Printers & Scanners.")
    exit 2
}

$bytes = [System.IO.File]::ReadAllBytes($FilePath)

$hPrinter = [IntPtr]::Zero
if (-not [DfcPrintAgent.RawPrinter]::OpenPrinter($PrinterName, [ref]$hPrinter, [IntPtr]::Zero)) {
    [Console]::Error.WriteLine("Failed to open printer '$PrinterName' (Win32 error $([Runtime.InteropServices.Marshal]::GetLastWin32Error())).")
    exit 3
}

# From here on a handle is open, so every path — success or failure — must go
# through the finally blocks below to release it. $exitCode/$errorMessage
# record the outcome instead of calling `exit` mid-try, since `exit` doesn't
# reliably unwind through PowerShell try/finally the way a thrown error does.
$exitCode = 0
$errorMessage = $null
$written = 0

try {
    $docInfo = New-Object DfcPrintAgent.DOCINFOA
    $docInfo.pDocName = 'DFC KOT'
    $docInfo.pDataType = 'RAW'

    if (-not [DfcPrintAgent.RawPrinter]::StartDocPrinter($hPrinter, 1, [ref]$docInfo)) {
        $errorMessage = "StartDocPrinter failed (Win32 error $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))."
        $exitCode = 4
    } else {
        try {
            [DfcPrintAgent.RawPrinter]::StartPagePrinter($hPrinter) | Out-Null

            if (-not [DfcPrintAgent.RawPrinter]::WritePrinter($hPrinter, $bytes, $bytes.Length, [ref]$written)) {
                $errorMessage = "WritePrinter failed (Win32 error $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))."
                $exitCode = 5
            }

            [DfcPrintAgent.RawPrinter]::EndPagePrinter($hPrinter) | Out-Null
        }
        finally {
            [DfcPrintAgent.RawPrinter]::EndDocPrinter($hPrinter) | Out-Null
        }
    }
}
finally {
    [DfcPrintAgent.RawPrinter]::ClosePrinter($hPrinter) | Out-Null
}

if ($exitCode -ne 0) {
    [Console]::Error.WriteLine($errorMessage)
    exit $exitCode
}

Write-Output "OK: $written bytes sent to '$PrinterName'"
exit 0
