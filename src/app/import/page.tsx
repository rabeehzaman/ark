"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ParsedCheque {
  date: string | null;
  chequeNumber: string;
  amount: number;
  status: "PENDING" | "CLEARED" | "BOUNCED";
  remarks: string | null;
}

interface ParsedParty {
  name: string;
  cheques: ParsedCheque[];
  totalAmount: number;
  bouncedTotal: number;
}

interface ImportSummary {
  totalParties: number;
  totalCheques: number;
  totalAmount: number;
  bouncedTotal: number;
}

type Step = "upload" | "preview" | "importing" | "done";

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [parties, setParties] = useState<ParsedParty[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [result, setResult] = useState<{
    partiesCreated: number;
    chequesCreated: number;
    errors?: string[];
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to parse file");
        return;
      }

      const data = await res.json();
      setParties(data.parties);
      setSummary(data.summary);
      setStep("preview");
    } catch {
      toast.error("Failed to parse file");
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = async () => {
    setStep("importing");
    try {
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parties }),
      });

      if (!res.ok) {
        toast.error("Import failed");
        setStep("preview");
        return;
      }

      const data = await res.json();
      setResult(data);
      setStep("done");
      toast.success(
        `Imported ${data.chequesCreated} cheques across ${data.partiesCreated} parties`
      );
    } catch {
      toast.error("Import failed");
      setStep("preview");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
        <p className="text-muted-foreground">
          Upload your Excel cheque book file
        </p>
      </div>

      {step === "upload" && (
        <Card>
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {parsing ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-lg font-medium">Parsing Excel file...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Drag and drop your Excel file here
                  </p>
                  <p className="text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".xlsx,.xls";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFile(file);
                      };
                      input.click();
                    }}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Parties</p>
                <p className="text-2xl font-bold">{summary.totalParties}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Cheques</p>
                <p className="text-2xl font-bold">{summary.totalCheques}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.totalAmount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Bounced</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.bouncedTotal)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Preview - Parsed Parties</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Party Name</TableHead>
                    <TableHead className="text-right">Cheques</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Bounced</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parties.map((party, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">
                        {party.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {party.cheques.length}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(party.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {party.bouncedTotal > 0 ? (
                          <span className="text-red-600">
                            {formatCurrency(party.bouncedTotal)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload");
                setParties([]);
                setSummary(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImport}>
              <Check className="h-4 w-4 mr-2" />
              Confirm Import ({summary.totalCheques} cheques)
            </Button>
          </div>
        </>
      )}

      {step === "importing" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium">Importing data...</p>
            <p className="text-muted-foreground">
              This may take a moment
            </p>
          </CardContent>
        </Card>
      )}

      {step === "done" && result && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-lg font-bold mb-2">Import Complete!</p>
            <p className="text-muted-foreground mb-4">
              {result.partiesCreated} parties and {result.chequesCreated} cheques
              imported successfully
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="w-full max-w-lg mb-4">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">
                    {result.errors.length} warnings
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setParties([]);
                  setSummary(null);
                  setResult(null);
                }}
              >
                Import Another
              </Button>
              <a href="/">
                <Button>Go to Dashboard</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
