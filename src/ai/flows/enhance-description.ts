
'use server';
/**
 * @fileOverview AI flow to generate catchy item descriptions for SwapNorge.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EnhanceDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the item.'),
  category: z.string().describe('The category of the item.'),
  lang: z.enum(['no', 'en']).default('no'),
});
export type EnhanceDescriptionInput = z.infer<typeof EnhanceDescriptionInputSchema>;

const EnhanceDescriptionOutputSchema = z.object({
  description: z.string().describe('The enhanced catchy description.'),
});
export type EnhanceDescriptionOutput = z.infer<typeof EnhanceDescriptionOutputSchema>;

const prompt = ai.definePrompt({
  name: 'enhanceDescriptionPrompt',
  input: { schema: EnhanceDescriptionInputSchema },
  output: { schema: EnhanceDescriptionOutputSchema },
  prompt: `You are a friendly neighborhood assistant for SwapNorge, a community swap app in Norway.
  
  Generate a warm, inviting, and professional product description for a local swap listing. 
  The description should be in {{lang}}. 
  Emphasize the value of sharing and sustainability.
  Keep it concise (2-3 sentences).
  
  Item Title: {{{title}}}
  Category: {{{category}}}`,
});

export async function enhanceDescription(input: EnhanceDescriptionInput): Promise<EnhanceDescriptionOutput> {
  const { output } = await prompt(input);
  if (!output) throw new Error('Failed to generate description');
  return output;
}
