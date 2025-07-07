# Import Transactions Feature

## Overview
The Import Transactions feature allows users to bulk import transactions from CSV and Excel files, with special support for HDFC Bank statement format.

## Features

### ✅ Responsive Design
- **Mobile-first approach**: Optimized for mobile devices with card-based layout
- **Desktop view**: Full table view with advanced features
- **Adaptive sizing**: Automatically adjusts based on screen size

### ✅ File Support
- **CSV files**: Primary format with robust parsing using ngx-papaparse
- **Excel files**: Full support for XLSX and XLS formats using xlsx library
- **Drag & Drop**: Intuitive file upload with visual feedback

### ✅ Smart Parsing
- **HDFC Bank Statements**: Automatic detection and parsing of HDFC bank statement format
- **Standard CSV**: Support for custom CSV formats
- **Excel Files**: Parse Excel workbooks with multiple sheets
- **Auto-categorization**: Intelligent categorization based on transaction descriptions
- **Date parsing**: Handles multiple date formats (DD/MM/YY, YYYY-MM-DD)

### ✅ User Experience
- **Preview before import**: See all transactions before importing
- **Selective import**: Choose which transactions to import
- **Bulk selection**: Select all/deselect all functionality
- **Validation**: Real-time validation with helpful error messages
- **Progress indicators**: Loading states and progress feedback

## Supported Formats

### HDFC Bank Statement Format
The component automatically detects and parses HDFC bank statements with the following columns:
- `Date`: Transaction date (DD/MM/YY format)
- `Narration`: Transaction description
- `Withdrawal Amt.`: Amount withdrawn
- `Deposit Amt.`: Amount deposited
- `Chq./Ref.No.`: Reference number

### Standard CSV Format
For custom CSV files, the component expects:
- `payee`: Transaction payee/merchant name
- `amount`: Transaction amount
- `type`: Transaction type (income/expense)
- `category`: Transaction category
- `date`: Transaction date (YYYY-MM-DD format)

### Excel Format
For Excel files (XLSX, XLS), the component supports:
- **Multiple sheets**: Automatically uses the first sheet
- **Header row**: First row should contain column headers
- **Same column structure**: As CSV format
- **Data validation**: Handles empty cells and formatting issues

## Auto-Categorization

The system automatically categorizes transactions based on keywords in the narration:

| Category | Keywords |
|----------|----------|
| Salary | salary, techmahindra |
| Food & Dining | zomato, swiggy, restaurant, food, hungerbox |
| Fuel | fuel, petrol, oil, bp, quality fuel |
| Shopping | flipkart, amazon, shopping, mr diy, bata, lenskart |
| Entertainment | spotify, netflix, entertainment |
| Utilities | electricity, water, gas, utility, vodafone, jio |
| Transport | uber, ola, parking, transport, irctc |
| Medical | medical, wellness, pharmacy, chemist |
| Rent | rent |
| EMI | emi |

## Usage

### For Users
1. Navigate to the Transactions page
2. Click the "Import" button
3. Download the templates (CSV + Excel) (optional)
4. Upload your file (CSV, XLSX, or XLS) or drag & drop
5. Review and select transactions to import
6. Click "Import Selected"

### For Developers
```typescript
// Open import dialog
const dialogRef = this._dialog.open(ImportTransactionsComponent, {
  width: '600px',
  maxWidth: '95vw',
});

// Handle imported transactions
dialogRef.afterClosed().subscribe((imported: any[]) => {
  if (imported && imported.length) {
    // Process imported transactions
    this.importTransactions(imported);
  }
});
```

## Technical Implementation

### Dependencies
- **ngx-papaparse**: CSV parsing library with Angular integration
- **xlsx**: Excel file parsing library
- **Angular Material**: UI components
- **Firebase**: Database storage

### Key Components
- `ImportTransactionsComponent`: Main import dialog
- `TransactionsService`: Handles database operations
- Responsive CSS with Tailwind utilities

### File Processing
```typescript
// CSV Processing
this.papa.parse(file, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => { /* handle results */ }
});

// Excel Processing
const workbook = XLSX.read(data, { type: 'array' });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
```

### Error Handling
- File format validation
- Data validation before import
- Graceful error recovery
- User-friendly error messages
- Excel-specific error handling (empty sheets, format issues)

## Template Files

The system provides downloadable templates:
- **CSV Template**: `transaction_template.csv`
- **Excel Template**: `transaction_template.xlsx`

Both templates include sample data and proper column headers.

## Future Enhancements
- [ ] Support for more bank statement formats
- [ ] Custom category mapping
- [ ] Import history
- [ ] Duplicate detection
- [ ] Batch processing for large files
- [ ] Multiple sheet selection for Excel files
- [ ] Advanced Excel formatting support

## Testing
The component has been tested with:
- HDFC Bank statement CSV (provided)
- Standard CSV format
- Excel files (XLSX, XLS)
- Various screen sizes (mobile, tablet, desktop)
- Error scenarios (invalid files, network issues)
- Excel-specific scenarios (empty sheets, multiple sheets) 