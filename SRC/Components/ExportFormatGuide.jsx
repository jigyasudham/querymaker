import React from 'react';

const ExportFormatGuide = ({ theme }) => {
  return (
    <div className={`${theme === 'dark' ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 mb-4`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">💾</span>
        <div className="flex-1">
          <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
            Export Format Guide
          </h4>
          
          <div className="space-y-2 text-sm">
            {/* JSON Format */}
            <div className="flex gap-2">
              <span className={`font-semibold min-w-[60px] ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                JSON:
              </span>
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                Full data backup with all metadata, tags, and statistics. Best for backing up or sharing complete query collections. Can be imported back into Query Maker.
              </span>
            </div>

            {/* CSV Format */}
            <div className="flex gap-2">
              <span className={`font-semibold min-w-[60px] ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
                CSV:
              </span>
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                Spreadsheet-friendly format. Opens in Excel/Google Sheets for analysis and reporting. Contains basic query info (name, SQL, user, date). Limited metadata.
              </span>
            </div>

            {/* SQL Format */}
            <div className="flex gap-2">
              <span className={`font-semibold min-w-[60px] ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                SQL:
              </span>
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                Ready-to-run SQL file with comments. Copy-paste directly into any SQL client. Each query separated by comments with name and user info.
              </span>
            </div>
          </div>

          {/* Quick Tips */}
          <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-blue-800' : 'border-blue-200'}`}>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
              <strong>💡 Quick Tips:</strong>
              <div className="mt-1 space-y-1">
                <div>• Use <strong>JSON</strong> for backup/restore (preserves everything)</div>
                <div>• Use <strong>CSV</strong> for analysis in Excel</div>
                <div>• Use <strong>SQL</strong> for running queries in other tools</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportFormatGuide;