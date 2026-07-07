import { CRMRecord } from '../types/index.js';

interface ParsedRecord {
  [key: string]: string;
}

export function mapCSVToCRM(records: ParsedRecord[]): { records: CRMRecord[]; skipped: number } {
  console.log('📊 Mapping CSV to CRM format...');
  console.log(`🔍 Total records: ${records.length}`);
  
  if (records.length > 0) {
    console.log(`📋 Sample columns: ${Object.keys(records[0]).join(', ')}`);
    console.log(`📋 Sample data:`, JSON.stringify(records[0], null, 2));
  }
  
  const results: CRMRecord[] = [];
  let skipped = 0;

  for (let i = 0; i < records.length; i++) {
    try {
      const mapped = mapSingleRecord(records[i], i);
      if (mapped) {
        results.push(mapped);
      } else {
        skipped++;
        if (skipped <= 3) {
          console.log(`⚠️ Record ${i + 1} skipped: No email or phone found`);
          console.log(`   Data:`, JSON.stringify(records[i], null, 2));
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to map record ${i + 1}:`, error);
      skipped++;
    }
  }

  console.log(`✅ Mapped: ${results.length} records, ${skipped} skipped`);
  return { records: results, skipped };
}

function mapSingleRecord(record: ParsedRecord, index: number): CRMRecord | null {
  // Helper to find values case-insensitively with multiple variations
  const findValue = (keys: string[]): string => {
    // First try exact matches
    for (const key of keys) {
      if (record[key] && String(record[key]).trim() && String(record[key]).trim() !== '') {
        return String(record[key]).trim();
      }
    }
    // Then try case-insensitive matches
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

  // Find email - try ALL possible variations
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
  
  // If not found, search all fields for @ symbol
  if (!email) {
    for (const key of Object.keys(record)) {
      const value = String(record[key]);
      // Check if it looks like an email
      if (value.includes('@') && value.includes('.') && !value.includes(' ')) {
        email = value;
        break;
      }
    }
  }

  // Find mobile/phone - try ALL possible variations
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
  
  // If not found, search all fields for numbers
  if (!mobile) {
    for (const key of Object.keys(record)) {
      const value = String(record[key]);
      // Remove all non-digits
      const numbers = value.replace(/[^0-9+]/g, '');
      // Check if it has at least 10 digits
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

  // Extract country code and clean mobile
  let countryCode = '';
  let cleanMobile = '';
  
  if (mobile) {
    // Remove spaces, dashes, parentheses
    let cleaned = mobile.replace(/[\s\-\(\)]/g, '');
    
    // Check for country code
    const match = cleaned.match(/^\+(\d{1,3})/);
    if (match) {
      countryCode = '+' + match[1];
      cleanMobile = cleaned.replace(/^\+(\d{1,3})/, '');
    } else {
      // Check if starts with 00
      const match00 = cleaned.match(/^00(\d{1,3})/);
      if (match00) {
        countryCode = '+' + match00[1];
        cleanMobile = cleaned.replace(/^00(\d{1,3})/, '');
      } else {
        cleanMobile = cleaned.replace(/[^0-9]/g, '');
        // If it starts with 0, remove it
        if (cleanMobile.startsWith('0')) {
          cleanMobile = cleanMobile.substring(1);
        }
      }
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
    // Sale done indicators
    if (statusLower.includes('sale') || statusLower.includes('closed') || 
        statusLower.includes('won') || statusLower.includes('done') || 
        statusLower.includes('hot') || statusLower.includes('converted') ||
        statusLower.includes('customer') || statusLower.includes('client')) {
      crmStatus = 'SALE_DONE';
    } 
    // Bad lead indicators
    else if (statusLower.includes('bad') || statusLower.includes('not interested') || 
             statusLower.includes('reject') || statusLower.includes('cold') ||
             statusLower.includes('spam') || statusLower.includes('invalid') ||
             statusLower.includes('unqualified') || statusLower.includes('disqualified')) {
      crmStatus = 'BAD_LEAD';
    } 
    // Did not connect indicators
    else if (statusLower.includes('not connect') || statusLower.includes('no answer') || 
             statusLower.includes('busy') || statusLower.includes('unreachable') ||
             statusLower.includes('voicemail') || statusLower.includes('no contact')) {
      crmStatus = 'DID_NOT_CONNECT';
    } 
    // Default to good lead
    else {
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
  
  // If no notes found, combine extra info from unmapped fields
  if (!notes) {
    const extraInfo: string[] = [];
    const mappedKeys = [
      'name', 'email', 'phone', 'mobile', 'company', 'city', 'state', 'country', 
      'status', 'notes', 'remarks', 'description', 'date', 'created_at',
      'address', 'location', 'zip', 'postal', 'website', 'url'
    ];
    
    for (const key of Object.keys(record)) {
      const value = String(record[key]);
      // Skip if empty or already mapped
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

  // Find name - try all variations
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
    description: findValue(['description', 'Description', 'additional info'])
  };

  return crmRecord;
}