/**
 * ISTRUZIONI PER COLLEGARE LE RISPOSTE RSVP A GOOGLE SHEETS
 * ===========================================================
 * 
 * 1. Vai su Google Drive e crea un nuovo Google Sheets
 *    - Rinominalo "Risposte Matrimonio"
 *    - Nella riga 1, scrivi le intestazioni:
 *      A1: Timestamp | B1: Nome | C1: Cognome | D1: Tipo | E1: Risposta | F1: Note
 * 
 * 2. Vai su Estensioni → Apps Script
 * 
 * 3. Cancella tutto il codice e incolla SOLO la funzione doPost qui sotto:
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  var timestamp = data.timestamp || new Date().toISOString();
  var risposta = data.risposta || '';
  var guests = data.guests || [];
  
  for (var i = 0; i < guests.length; i++) {
    var g = guests[i];
    sheet.appendRow([
      timestamp,
      g.nome || '',
      g.cognome || '',
      g.tipo || '',
      risposta,
      g.note || ''
    ]);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 4. Clicca "Deploy" → "Nuova distribuzione"
 *    - Tipo: "Applicazione web"
 *    - Esegui come: "Me"
 *    - Chi ha accesso: "Chiunque"
 *    - Clicca "Deploy"
 * 
 * 5. Copia l'URL generato (tipo: https://script.google.com/macros/s/xxx/exec)
 * 
 * 6. Incolla l'URL nel file api.php alla riga:
 *    $googleUrl = ''; // <-- INSERT YOUR GOOGLE APPS SCRIPT URL HERE
 *    
 *    Diventa:
 *    $googleUrl = 'https://script.google.com/macros/s/xxx/exec';
 * 
 * NOTA: Altervista supporta curl, quindi il PHP invierà automaticamente
 * ogni risposta anche a Google Sheets in tempo reale!
 */
