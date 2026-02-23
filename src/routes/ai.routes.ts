// routes/ai.routes.ts
import { Router } from 'express';
import { openai } from '../services/openai.service'; // wrapper pour OpenAI

const router = Router();

router.post('/analyse', async (req, res) => {
  const { ccn, effectif, secteur, typeContrats, objectifs, problemes, priorite } = req.body;

  try {
    const prompt = `
    Tu es un expert RH/paie. 
    Analyse cette entreprise : 
    CCN: ${ccn}, Effectif: ${effectif}, Secteur: ${secteur}, 
    Types de contrats: ${typeContrats.join(', ')}, Objectifs: ${objectifs.join(', ')}, 
    Problèmes: ${problemes}, Priorité: ${priorite}.
    Donne des recommandations claires et synthétiques pour optimiser la paie et la conformité.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ result: completion.choices[0].message?.content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

export default router;
