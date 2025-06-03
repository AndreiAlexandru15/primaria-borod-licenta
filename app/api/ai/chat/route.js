import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('API /ai/chat: Primesc cerere...');
    
    // Parse FormData from the request
    const formData = await request.formData();
      // Extract message and metadata
    const message = formData.get('message');
    const timestamp = formData.get('timestamp');
    const userAgent = formData.get('userAgent');
    const sessionId = formData.get('sessionId');
    const filesCount = parseInt(formData.get('filesCount') || '0');
      console.log('API /ai/chat: Date primite:', {
      message: message?.substring(0, 100) + (message?.length > 100 ? '...' : ''),
      timestamp,
      sessionId,
      filesCount,
      userAgent: userAgent?.substring(0, 50) + '...'
    });
      // Prepare data for n8n webhook
    const n8nFormData = new FormData();
    n8nFormData.append('message', message);
    n8nFormData.append('timestamp', timestamp);
    n8nFormData.append('sessionId', sessionId);
    if (userAgent) n8nFormData.append('userAgent', userAgent);
    
    // Add files to FormData for n8n with additional metadata
    if (filesCount > 0) {
      console.log(`API /ai/chat: Procesez ${filesCount} fișiere...`);
      
      const filesInfo = [];
      for (let i = 0; i < filesCount; i++) {
        const file = formData.get(`file_${i}`);
        const fileName = formData.get(`file_${i}_name`);
        const fileSize = formData.get(`file_${i}_size`);
        const fileType = formData.get(`file_${i}_type`);
        
        if (file) {
          n8nFormData.append(`file_${i}`, file);
          if (fileName) n8nFormData.append(`file_${i}_name`, fileName);
          if (fileSize) n8nFormData.append(`file_${i}_size`, fileSize);
          if (fileType) n8nFormData.append(`file_${i}_type`, fileType);
          
          filesInfo.push({
            index: i,
            name: fileName || file.name,
            size: fileSize || file.size,
            type: fileType || file.type
          });
        }
      }
      
      n8nFormData.append('filesCount', filesCount.toString());
      n8nFormData.append('filesInfo', JSON.stringify(filesInfo));
      
      console.log('API /ai/chat: Info fișiere:', filesInfo);
    }
    
    // Get n8n webhook URL from environment variables
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/ai-chat';
    
    console.log(`API /ai/chat: Trimit către n8n: ${n8nWebhookUrl}`);
    
    // Send request to n8n webhook
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      body: n8nFormData,
    });
    
    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`API /ai/chat: Eroare n8n (${n8nResponse.status}):`, errorText);
      throw new Error(`N8N webhook error: ${n8nResponse.status} - ${errorText}`);
    }
      const n8nResult = await n8nResponse.json();
    console.log('API /ai/chat: Răspuns de la n8n:', n8nResult);
      // Return the response from n8n
    return NextResponse.json({
      success: true,
      response: n8nResult.response || n8nResult.output || 'Am primit mesajul tău și l-am procesat cu succes.',
      output: n8nResult.output, // Include și proprietatea output pentru debugging
      filesProcessed: filesCount,
      sessionId: sessionId,
      ...n8nResult
    });
    
  } catch (error) {
    console.error('API /ai/chat: Eroare:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'A apărut o eroare la procesarea mesajului.',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API endpoint pentru chat AI. Folosește POST pentru a trimite mesaje.',
    endpoints: {
      POST: '/api/ai/chat - Trimite mesaj către AI'
    }
  });
}