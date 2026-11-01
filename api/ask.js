export default async function handler(req, res) {
    // السماح بالطلبات من أي مكان (لتجنب مشاكل المتصفح)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question } = req.body;
    if (!question) {
        return res.status(400).json({ error: 'No question provided' });
    }

    // قراءة المفتاح من إعدادات Vercel السرية
    const API_KEY = process.env.GEMINI_API_KEY;
    
    // 🔴 هنا قمنا بتغيير النموذج إلى gemini-3.8-flash
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${API_KEY}`;

    const prompt = `أنت خبير تقني محترف في صيانة التكييف والتبريد (HVAC). أجب على سؤال الفني التالي باللغة العربية بأسلوب عملي ومباشر، واذكر الأسباب وخطوات الفحص: "${question}"`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            res.status(200).json({ answer: data.candidates[0].content.parts[0].text });
        } else {
            // إذا كان اسم النموذج خاطئاً، سيظهر الخطأ هنا في سجلات Vercel
            console.log("API Error Response:", data); 
            res.status(500).json({ error: 'Failed to get response from AI' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}
