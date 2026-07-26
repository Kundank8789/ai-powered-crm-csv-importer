import { CRMRecord } from '../types/index.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

interface ParsedRecord {
  [key: string]: string;
}

interface SkippedRow {
  row: ParsedRecord;
  reason: string;
}

// ✅ FIXED: Proper phone number parsing
function parsePhoneNumber(phone: string): { countryCode: string; nationalNumber: string } | null {
  if (!phone) return null;
  
  try {
    // Clean the phone number - remove spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Try to parse with libphonenumber
    let parsed = parsePhoneNumberFromString(cleaned);
    
    // If that fails, try with a plus sign
    if (!parsed && !cleaned.startsWith('+')) {
      parsed = parsePhoneNumberFromString('+' + cleaned);
    }
    
    if (parsed && parsed.isValid()) {
      return {
        countryCode: '+' + parsed.countryCallingCode,
        nationalNumber: parsed.nationalNumber || cleaned
      };
    }
    
    // Fallback: manual extraction for common formats
    // Try to extract country code from +XX or +X format
    const plusMatch = cleaned.match(/^\+(\d{1,3})/);
    if (plusMatch) {
      const countryCode = plusMatch[1];
      let remaining = cleaned.replace(/^\+(\d{1,3})/, '');
      
      // Remove leading zeros
      remaining = remaining.replace(/^0+/, '');
      
      // Only return if we have a valid-looking number
      if (remaining.length >= 10) {
        return {
          countryCode: '+' + countryCode,
          nationalNumber: remaining
        };
      }
    }
    
    // If no country code found, just clean the number
    const digitsOnly = cleaned.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 10) {
      return {
        countryCode: '',
        nationalNumber: digitsOnly
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Phone parsing error for:', phone, error);
    return null;
  }
}

export function mapCSVToCRM(records: ParsedRecord[]): { 
  records: CRMRecord[]; 
  skipped: number;
  skippedRows: SkippedRow[];
} {
  console.log('📊 Mapping CSV to CRM format...');
  
  if (!records || !Array.isArray(records)) {
    console.warn('⚠️ No valid records provided');
    return { records: [], skipped: 0, skippedRows: [] };
  }
  
  console.log(`🔍 Total records: ${records.length}`);
  
  if (records.length > 0) {
    console.log(`📋 Sample columns: ${Object.keys(records[0] || {}).join(', ')}`);
    console.log(`📋 Sample data:`, JSON.stringify(records[0] || {}, null, 2));
  }
  
  const results: CRMRecord[] = [];
  const skippedRows: SkippedRow[] = [];
  let skipped = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    if (!record || typeof record !== 'object') {
      skipped++;
      skippedRows.push({
        row: record || {},
        reason: 'Invalid record format: record is null or undefined'
      });
      continue;
    }
    
    try {
      const mapped = mapSingleRecord(record, i);
      if (mapped) {
        results.push(mapped);
      } else {
        const reason = getSkipReason(record);
        skipped++;
        skippedRows.push({ row: record, reason });
      }
    } catch (error) {
      console.warn(`⚠️ Failed to map record ${i + 1}:`, error);
      skipped++;
      skippedRows.push({
        row: record,
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  console.log(`✅ Mapped: ${results.length} records, ${skipped} skipped`);
  return { records: results, skipped, skippedRows };
}

function getSkipReason(record: ParsedRecord): string {
  const hasAnyData = Object.values(record).some(v => v && String(v).trim() !== '');
  if (!hasAnyData) {
    return 'Empty record - no data found';
  }

  let hasEmail = false;
  let hasValidEmail = false;
  for (const key of Object.keys(record)) {
    const value = String(record[key]);
    if (value.includes('@') && value.includes('.') && !value.includes(' ')) {
      hasEmail = true;
      if (value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        hasValidEmail = true;
        break;
      }
    }
  }

  let hasPhone = false;
  for (const key of Object.keys(record)) {
    const value = String(record[key]);
    const digitsOnly = value.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 10) {
      hasPhone = true;
      break;
    }
  }

  if (!hasEmail && !hasPhone) {
    return 'Missing required fields: no email address and no phone number found';
  }
  
  if (!hasEmail) {
    return 'Missing required field: email address not found or invalid format';
  }
  
  if (!hasPhone) {
    return 'Missing required field: phone number not found';
  }

  if (hasEmail && !hasValidEmail) {
    return 'Invalid email format: email found but not in valid format';
  }

  return 'Unknown reason - record could not be mapped';
}

function mapSingleRecord(record: ParsedRecord, index: number): CRMRecord | null {
  if (!record || typeof record !== 'object') {
    return null;
  }
  
  const findValue = (keys: string[]): string => {
    for (const key of keys) {
      if (record[key] && String(record[key]).trim() && String(record[key]).trim() !== '') {
        return String(record[key]).trim();
      }
    }
    for (const key of keys) {
      for (const recordKey of Object.keys(record)) {
        if (recordKey.toLowerCase() === key.toLowerCase()) {
          if (record[recordKey] && String(record[recordKey]).trim() && String(record[recordKey]).trim() !== '') {
            return String(record[recordKey]).trim();
          }
        }
      }
    }
    return '';
  };

  // Find email
  let email = findValue([
    'email', 'Email', 'EMAIL', 
    'email address', 'Email Address', 'email_address', 
    'mail', 'Mail', 'MAIL',
    'e-mail', 'E-mail', 
    'primary email', 'Primary Email',
    'lead email', 'Lead Email',
    'contact email', 'Contact Email',
    'user email', 'User Email'
  ]);
  
  if (!email) {
    for (const key of Object.keys(record)) {
      const value = String(record[key]);
      if (value.includes('@') && value.includes('.') && !value.includes(' ')) {
        email = value;
        break;
      }
    }
  }

  // Find mobile/phone
  let mobile = findValue([
    'phone', 'Phone', 'PHONE',
    'mobile', 'Mobile', 'MOBILE',
    'phone number', 'Phone Number', 'phone_number',
    'mobile number', 'Mobile Number', 'mobile_number',
    'contact number', 'Contact Number', 'contact_number',
    'telephone', 'Telephone', 'TELEPHONE',
    'cell', 'Cell', 'CELL',
    'cell phone', 'Cell Phone',
    'primary phone', 'Primary Phone',
    'lead phone', 'Lead Phone',
    'whatsapp', 'WhatsApp'
  ]);
  
  if (!mobile) {
    for (const key of Object.keys(record)) {
      const value = String(record[key]);
      const numbers = value.replace(/[^0-9+]/g, '');
      const digitsOnly = numbers.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= 10) {
        mobile = value;
        break;
      }
    }
  }

  // Skip if no email and no mobile
  if (!email && !mobile) {
    return null;
  }

  // ✅ FIXED: Parse phone number properly
  let countryCode = '';
  let cleanMobile = '';
  
  if (mobile) {
    const parsed = parsePhoneNumber(mobile);
    if (parsed) {
      countryCode = parsed.countryCode;
      cleanMobile = parsed.nationalNumber;
    } else {
      // Fallback: just remove non-digits
      cleanMobile = mobile.replace(/[^0-9]/g, '');
    }
  }

  // Try to get date from various fields
  let createdAt = new Date().toISOString();
  const dateKeys = [
    'date', 'Date', 'created_at', 'Created At', 'created', 'Created', 
    'timestamp', 'Timestamp', 'lead date', 'Lead Date',
    'creation date', 'Creation Date', 'entry date', 'Entry Date',
    'submission date', 'Submission Date'
  ];
  for (const key of dateKeys) {
    const value = findValue([key]);
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          createdAt = date.toISOString();
          break;
        }
      } catch (e) {
        // Continue to next key
      }
    }
  }

  // Determine CRM status from context
  let crmStatus: 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE' = 'GOOD_LEAD_FOLLOW_UP';
  const statusText = findValue([
    'status', 'Status', 'lead status', 'Lead Status', 'crm_status',
    'state', 'State', 'stage', 'Stage', 'phase', 'Phase'
  ]);
  
  if (statusText) {
    const statusLower = statusText.toLowerCase();
    if (statusLower.includes('sale') || statusLower.includes('closed') || 
        statusLower.includes('won') || statusLower.includes('done') || 
        statusLower.includes('hot') || statusLower.includes('converted') ||
        statusLower.includes('customer') || statusLower.includes('client')) {
      crmStatus = 'SALE_DONE';
    } else if (statusLower.includes('bad') || statusLower.includes('not interested') || 
               statusLower.includes('reject') || statusLower.includes('cold') ||
               statusLower.includes('spam') || statusLower.includes('invalid') ||
               statusLower.includes('unqualified') || statusLower.includes('disqualified')) {
      crmStatus = 'BAD_LEAD';
    } else if (statusLower.includes('not connect') || statusLower.includes('no answer') || 
               statusLower.includes('busy') || statusLower.includes('unreachable') ||
               statusLower.includes('voicemail') || statusLower.includes('no contact')) {
      crmStatus = 'DID_NOT_CONNECT';
    } else {
      crmStatus = 'GOOD_LEAD_FOLLOW_UP';
    }
  }

  // Collect all notes/extra info
  const notesFields = [
    'notes', 'Notes', 'remarks', 'Remarks', 'comment', 'Comment', 
    'note', 'Note', 'description', 'Description', 'additional info',
    'extra', 'Extra', 'details', 'Details', 'info', 'Info'
  ];
  let notes = findValue(notesFields);
  
  if (!notes) {
    const extraInfo: string[] = [];
    const mappedKeys = [
      'name', 'email', 'phone', 'mobile', 'company', 'city', 'state', 'country', 
      'status', 'notes', 'remarks', 'description', 'date', 'created_at',
      'address', 'location', 'zip', 'postal', 'website', 'url'
    ];
    
    for (const key of Object.keys(record)) {
      const value = String(record[key]);
      if (!value || value.trim() === '') continue;
      
      const keyLower = key.toLowerCase();
      const isMapped = mappedKeys.some(k => keyLower.includes(k.toLowerCase()));
      
      if (!isMapped && value && value.length > 0) {
        extraInfo.push(`${key}: ${value}`);
      }
    }
    if (extraInfo.length > 0) {
      notes = extraInfo.join(' | ');
    }
  }

  // Find name
  const name = findValue([
    'name', 'Name', 'full name', 'Full Name', 'full_name',
    'first name', 'FirstName', 'first_name',
    'lead name', 'Lead Name', 'lead_name',
    'person name', 'Person Name',
    'contact name', 'Contact Name', 'contact_name',
    'customer name', 'Customer Name'
  ]);

  // Find company
  const company = findValue([
    'company', 'Company', 'COMPANY',
    'organization', 'Organization', 'org', 'Org',
    'business', 'Business',
    'account', 'Account',
    'firm', 'Firm',
    'client', 'Client'
  ]);

  // Find city
  const city = findValue([
    'city', 'City', 'CITY',
    'location', 'Location', 'locality', 'Locality',
    'town', 'Town',
    'municipality', 'Municipality'
  ]);

  // Find state
  const state = findValue([
    'state', 'State', 'STATE',
    'region', 'Region', 'province', 'Province',
    'district', 'District',
    'county', 'County'
  ]);

  // Find country
  const country = findValue([
    'country', 'Country', 'COUNTRY',
    'nation', 'Nation'
  ]);

  // Find lead owner
  const leadOwner = findValue([
    'lead owner', 'Lead Owner', 'owner', 'Owner',
    'assigned to', 'Assigned To', 'sales rep', 'Sales Rep',
    'agent', 'Agent', 'representative', 'Representative'
  ]);

  // Create CRM record
  const crmRecord: CRMRecord = {
    created_at: createdAt,
    name: name || '',
    email: email || '',
    country_code: countryCode || '',
    mobile_without_country_code: cleanMobile || '',
    company: company || '',
    city: city || '',
    state: state || '',
    country: country || '',
    lead_owner: leadOwner || '',
    crm_status: crmStatus,
    crm_note: notes || '',
    data_source: '',
    possession_time: '',
    description: findValue(['description', 'Description', 'additional info']) || ''
  };

  return crmRecord;
}