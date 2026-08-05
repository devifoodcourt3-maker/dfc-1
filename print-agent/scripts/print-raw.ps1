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
    // Must be wide (LPWStr) because StartDocPrinter below resolves to the
    // *W entry point (CharSet.Auto = Unicode on Windows). A previous version
    // of this struct marshaled these fields as LPStr (ANSI) while still
    // calling the W export — StartDocPrinterW then read the ANSI pDataType
    // pointer as UTF-16, garbling "RAW" into nonsense the print processor
    // didn't recognize, which is what produced Win32 error 1804
    // (ERROR_INVALID_DATATYPE) on every single print attempt.
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct DOCINFOW {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct PRINTER_INFO_2 {
        public string pServerName;
        public string pPrinterName;
        public string pShareName;
        public string pPortName;
        public string pDriverName;
        public string pComment;
        public string pLocation;
        public IntPtr pDevMode;
        public string pSepFile;
        public string pPrintProcessor;
        public string pDatatype;
        public string pParameters;
        public IntPtr pSecurityDescriptor;
        public int Attributes;
        public int Priority;
        public int DefaultPriority;
        public int StartTime;
        public int UntilTime;
        public int Status;
        public int cJobs;
        public int AveragePPM;
    }

    public class RawPrinter {
        [DllImport("winspool.drv", CharSet = CharSet.Unicode, ExactSpelling = true, EntryPoint = "OpenPrinterW", SetLastError = true)]
        public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool ClosePrinter(IntPtr hPrinter);

        [DllImport("winspool.drv", CharSet = CharSet.Unicode, ExactSpelling = true, EntryPoint = "StartDocPrinterW", SetLastError = true)]
        public static extern bool StartDocPrinter(IntPtr hPrinter, int level, ref DOCINFOW pDocInfo);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool EndDocPrinter(IntPtr hPrinter);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool StartPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool EndPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool WritePrinter(IntPtr hPrinter, byte[] pBytes, int dwCount, out int dwWritten);

        [DllImport("winspool.drv", CharSet = CharSet.Unicode, ExactSpelling = true, EntryPoint = "GetPrinterW", SetLastError = true)]
        private static extern bool GetPrinter(IntPtr hPrinter, int Level, IntPtr pPrinter, int cbBuf, out int pcbNeeded);

        [DllImport("winspool.drv", CharSet = CharSet.Unicode, ExactSpelling = true, EntryPoint = "EnumPrintProcessorDatatypesW", SetLastError = true)]
        private static extern bool EnumPrintProcessorDatatypes(string pName, string pPrintProcessorName, int Level, IntPtr pDatatypes, int cbBuf, out int pcbNeeded, out int pcReturned);

        // Some POS/receipt printer driver packages (e.g. the GA-E200 Series /
        // TH 400 Lite Windows driver) register a print processor whose
        // datatype list doesn't include a plain "RAW" entry — only variants
        // like "RAW [FF appended]". StartDocPrinter requires an exact,
        // case-sensitive-ish match against that list, so we look it up
        // instead of assuming "RAW" always works.
        public static string GetPrintProcessorName(IntPtr hPrinter) {
            int needed;
            GetPrinter(hPrinter, 2, IntPtr.Zero, 0, out needed);
            if (needed <= 0) return null;
            IntPtr buffer = Marshal.AllocHGlobal(needed);
            try {
                if (!GetPrinter(hPrinter, 2, buffer, needed, out needed)) return null;
                PRINTER_INFO_2 info = (PRINTER_INFO_2)Marshal.PtrToStructure(buffer, typeof(PRINTER_INFO_2));
                return info.pPrintProcessor;
            } finally {
                Marshal.FreeHGlobal(buffer);
            }
        }

        public static string[] GetSupportedDatatypes(string printProcessorName) {
            if (string.IsNullOrEmpty(printProcessorName)) return new string[0];
            int needed, returned;
            EnumPrintProcessorDatatypes(null, printProcessorName, 1, IntPtr.Zero, 0, out needed, out returned);
            if (needed <= 0) return new string[0];
            IntPtr buffer = Marshal.AllocHGlobal(needed);
            try {
                if (!EnumPrintProcessorDatatypes(null, printProcessorName, 1, buffer, needed, out needed, out returned)) {
                    return new string[0];
                }
                string[] result = new string[returned];
                for (int i = 0; i < returned; i++) {
                    IntPtr namePtr = Marshal.ReadIntPtr(buffer, i * IntPtr.Size);
                    result[i] = Marshal.PtrToStringUni(namePtr);
                }
                return result;
            } finally {
                Marshal.FreeHGlobal(buffer);
            }
        }
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

# Prefer the exact "RAW" datatype, but fall back to whatever RAW-like
# datatype this printer's actual print processor supports (some POS driver
# packages only register "RAW [FF appended]", not plain "RAW").
$dataType = 'RAW'
$printProcessor = $null
$supportedDatatypes = @()
try {
    $printProcessor = [DfcPrintAgent.RawPrinter]::GetPrintProcessorName($hPrinter)
    $supportedDatatypes = [DfcPrintAgent.RawPrinter]::GetSupportedDatatypes($printProcessor)
    if ($supportedDatatypes -and ($supportedDatatypes -notcontains 'RAW')) {
        $rawVariant = $supportedDatatypes | Where-Object { $_ -like 'RAW*' } | Select-Object -First 1
        if ($rawVariant) {
            $dataType = $rawVariant
        }
    }
} catch {
    # Querying the print processor is a best-effort compatibility check; fall
    # back to plain 'RAW' if it fails for any reason.
}

try {
    $docInfo = New-Object DfcPrintAgent.DOCINFOW
    $docInfo.pDocName = 'DFC KOT'
    $docInfo.pDataType = $dataType

    if (-not [DfcPrintAgent.RawPrinter]::StartDocPrinter($hPrinter, 1, [ref]$docInfo)) {
        $win32Error = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
        $errorMessage = "StartDocPrinter failed using datatype '$dataType' (print processor '$printProcessor', Win32 error $win32Error)."
        if ($supportedDatatypes -and $supportedDatatypes.Count -gt 0) {
            $errorMessage += " Datatypes supported by this printer: $($supportedDatatypes -join ', ')."
        }
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
