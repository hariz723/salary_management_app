import React, { useState } from 'react';
import { Modal, Upload, Button, message, Alert, Table, Tag } from 'antd';
import { importCsv } from '../../services/api';
import { UploadCloud, FileText, Download, CheckCircle2, AlertTriangle } from 'lucide-react';

const { Dragger } = Upload;

interface ImportCsvModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ visible, onClose, onSuccess }) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<{
    total_rows: number;
    imported_count: number;
    failed_count: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);

  const handleDownloadSample = () => {
    const sampleCsv = `first_name,last_name,email,gender,country,department,job_title,job_level,base_salary,bonus_percentage,equity_usd
Alice,Wong,alice.wong@acme.com,Female,United States,Engineering,Senior Software Engineer,Senior,145000,12,20000
Raj,Patel,raj.patel@acme.com,Male,India,Product,Product Manager,Mid,2200000,10,5000
Elena,Rostova,elena.rostova@acme.com,Female,Germany,Sales,Enterprise Account Executive,Senior,95000,15,10000`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'acme_salary_import_sample.csv';
    link.click();
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Please select a CSV file to upload');
      return;
    }

    setUploading(true);
    setImportResult(null);

    try {
      const result = await importCsv(fileList[0].originFileObj || fileList[0]);
      setImportResult(result);
      if (result.imported_count > 0) {
        message.success(`Successfully imported ${result.imported_count} employee records!`);
        onSuccess();
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Import failed';
      message.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFileList([]);
    setImportResult(null);
  };

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">Bulk Import Employee Salary CSV</div>
            <div className="text-xs text-slate-500 font-normal">
              Validate, ingest, and update employee compensation records in batches
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={640}
    >
      <div className="space-y-4 my-4">
        <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs">
          <div className="text-blue-900">
            <span className="font-semibold">Expected Columns: </span>
            <code className="text-[11px] bg-white px-1.5 py-0.5 rounded border border-blue-200">
              first_name, last_name, email, country, department, job_title, job_level, base_salary
            </code>
          </div>
          <button
            onClick={handleDownloadSample}
            className="flex items-center space-x-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline shrink-0 ml-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample CSV</span>
          </button>
        </div>

        {!importResult ? (
          <Dragger
            name="file"
            multiple={false}
            accept=".csv"
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList([file]);
              return false;
            }}
            onRemove={() => setFileList([])}
            className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl"
          >
            <p className="ant-upload-drag-icon flex justify-center text-blue-500 mb-2">
              <UploadCloud className="w-10 h-10" />
            </p>
            <p className="text-sm font-semibold text-slate-700">Click or drag CSV file to this area to upload</p>
            <p className="text-xs text-slate-500 mt-1">
              Supports CSV files with up to 10,000 rows. Pydantic schema validation runs on each row.
            </p>
          </Dragger>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-medium">Total Rows</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{importResult.total_rows}</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <div className="text-xs text-emerald-600 font-medium">Imported</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">{importResult.imported_count}</div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-center">
                <div className="text-xs text-red-600 font-medium">Validation Errors</div>
                <div className="text-lg font-bold text-red-700 mt-0.5">{importResult.failed_count}</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-red-700 mb-2 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Validation Error Log (First {importResult.errors.length} errors)</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-red-200 rounded-xl divide-y divide-red-100 text-xs">
                  {importResult.errors.map((e, idx) => (
                    <div key={idx} className="p-2.5 bg-red-50/50 flex items-start space-x-2">
                      <Tag color="error" className="text-[10px] m-0 font-mono">
                        Row {e.row}
                      </Tag>
                      <span className="text-red-800">{e.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
          {importResult ? (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Upload Another File
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
          )}

          {!importResult && (
            <button
              onClick={handleUpload}
              disabled={uploading || fileList.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg shadow-sm flex items-center space-x-1.5"
            >
              {uploading ? 'Validating & Ingesting...' : 'Start Ingestion'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
