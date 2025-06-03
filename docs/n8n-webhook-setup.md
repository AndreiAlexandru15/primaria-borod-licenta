# Configurare n8n Webhook pentru AI Chat

## Configurare Variabile de Mediu

În fișierul `.env.local`, configurează URL-ul webhook-ului n8n:

```bash
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/ai-chat
# Înlocuiește cu URL-ul real al webhook-ului tău n8n
# Exemplu: N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ai-chat
```

## Arhitectura sistemului

```
Frontend (React) → API Route (/api/ai/chat) → n8n Webhook → AI Response
```

## Configurare Workflow n8n

### 1. Creează un nou workflow în n8n

### 2. Adaugă un nod "Webhook"
- **HTTP Method**: POST
- **Path**: `/ai-chat` sau `/webhook-test/ai-chat`
- **Response Mode**: Respond to Webhook

### 3. Configurează webhook-ul să primească următoarele date:

#### Parametri text:
- `message` - mesajul utilizatorului
- `timestamp` - timestamp-ul mesajului în format ISO
- `sessionId` - ID unic pentru sesiunea de chat (format: `chat_timestamp_randomstring`)
- `userAgent` - informații despre browser-ul utilizatorului
- `filesCount` - numărul de fișiere atașate (opțional)
- `filesInfo` - JSON cu informații despre fișiere (nume, dimensiune, tip)

#### Fișiere (dacă există):
- `file_0`, `file_1`, etc. - fișierele atașate
- `file_0_name`, `file_0_size`, `file_0_type` - metadata pentru fiecare fișier

### 4. Tipuri de fișiere acceptate:
- **Documente**: PDF, DOC, DOCX, TXT
- **Imagini**: JPG, JPEG, PNG, GIF
- **Spreadsheets**: XLS, XLSX
- **Dimensiune maximă**: 10MB per fișier

### 5. Exemplu de răspuns JSON din n8n:
```json
{
  "response": "Răspunsul AI-ului la mesajul utilizatorului",
  "status": "success",
  "filesAnalyzed": 2,
  "additionalData": {
    "summary": "Rezumatul analizei documentelor"
  }
}
```

## Structura datelor trimise către n8n

### FormData trimis către n8n:
```
message: "Textul mesajului utilizatorului"
timestamp: "2025-06-04T10:30:00.000Z"
sessionId: "chat_1748957620359_abc123def"
userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
filesCount: "2" (dacă sunt fișiere atașate)
filesInfo: '[{"index":0,"name":"document.pdf","size":"1048576","type":"application/pdf"}]'
file_0: [File object - document.pdf]
file_0_name: "document.pdf"
file_0_size: "1048576"
file_0_type: "application/pdf"
file_1: [File object - image.jpg]
file_1_name: "image.jpg"
file_1_size: "524288"
file_1_type: "image/jpeg"
```

## Gestionarea Session ID în n8n

Session ID-ul este generat automat când utilizatorul deschide chat-ul pentru prima dată și rămâne constant pe toată durata conversației. Acest lucru permite:

### 1. **Urmărirea conversațiilor**
```javascript
// Exemplu de folosire în n8n Function node
const sessionId = $input.first().json.sessionId;
const message = $input.first().json.message;

// Poți salva istoricul conversației folosind sessionId
// sau recupera context-ul anterior pentru această sesiune
```

### 2. **Menținerea contextului**
- Toate mesajele dintr-o sesiune vor avea același session ID
- Poți grupa mesajele pentru a oferi răspunsuri mai contextuale
- Permite implementarea de "memorie" în conversația AI

### 3. **Logging și analytics**
- Urmărește câte conversații unice ai
- Analizează durata conversațiilor
- Identifică tipurile de întrebări cel mai frecvente

## Gestionarea erorilor

Aplicația va afișa un mesaj de eroare generic dacă:
- Webhook-ul n8n nu răspunde
- Conexiunea la n8n eșuează
- N8n returnează un status code de eroare
- Fișierele încărcate sunt de tip nepermis sau prea mari

## Logging și Debugging

Pentru debugging, verifică:
1. **Browser Console** - pentru erorile frontend
2. **Server Console** - pentru erorile API route
3. **n8n Logs** - pentru erorile în workflow

## Testare

Pentru a testa integrarea:
1. Configurează webhook-ul în n8n
2. Actualizează URL-ul în `.env.local`
3. Restartează aplicația Next.js
4. Trimite un mesaj prin chat-ul AI (cu și fără fișiere)
5. Verifică în n8n că datele sunt primite corect
6. Verifică în console-ul browser-ului și server-ului pentru logging

## Exemplu de workflow n8n simplu

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "ai-chat",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Process Message",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const message = $input.first().json.message;\nconst sessionId = $input.first().json.sessionId;\nconst files = $input.first().binary;\n\n// Log session info\nconsole.log(`Session: ${sessionId} - Message: ${message}`);\n\nreturn {\n  json: {\n    response: `[Session: ${sessionId.slice(-8)}] Am primit mesajul: \"${message}\". ${Object.keys(files || {}).length > 0 ? 'Și am analizat fișierele atașate.' : ''}`,\n    status: 'success',\n    sessionId: sessionId,\n    filesProcessed: Object.keys(files || {}).length\n  }\n};"
      }
    },
    {
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook"
    }
  ]
}
```

### Exemplu de workflow avansat cu salvarea istoricului:

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "Save to Database",
      "type": "n8n-nodes-base.mysql",
      "parameters": {
        "operation": "insert",
        "table": "chat_history",
        "columns": "session_id, message, timestamp, files_count"
      }
    },
    {
      "name": "Get Chat History",
      "type": "n8n-nodes-base.mysql",
      "parameters": {
        "operation": "select",
        "table": "chat_history",
        "where": "session_id = '{{ $json.sessionId }}'"
      }
    },
    {
      "name": "Generate AI Response",
      "type": "n8n-nodes-base.function"
    },
    {
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook"
    }
  ]
}
```
